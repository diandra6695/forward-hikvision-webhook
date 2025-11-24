import {
  HikvisionWebhookPayload,
  ProcessedAttendanceData,
  AttendanceStatus,
  SubEventType,
} from '../types';
import logger from '../utils/logger';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';

interface WebhookRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class AttendanceService {
  private readonly httpClient: AxiosInstance;
  private readonly retryConfig: WebhookRetryConfig;

  constructor() {
    this.httpClient = axios.create({
      timeout: config.externalWebhookTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hikvision-Webhook-Service/1.0',
      },
    });

    this.retryConfig = {
      maxRetries: config.maxRetries,
      baseDelay: 1000,
      maxDelay: 10000,
    };
  }

  /**
   * Process raw Hikvision webhook payload into structured attendance data
   */
  async processAttendanceData(payload: HikvisionWebhookPayload): Promise<ProcessedAttendanceData> {
    console.log('Processing attendance data:', payload);
    try {
      logger.debug('Processing attendance payload', {
        ipAddress: payload.ipAddress,
        eventType: payload.eventType,
        timestamp: payload.dateTime,
      });

      if (!this.validateAttendancePayload(payload)) {
        throw new Error('Invalid attendance payload');
      }

      const { AccessControllerEvent, ipAddress, dateTime } = payload;
      const attendanceStatus = this.determineAttendanceStatus(AccessControllerEvent.subEventType);

      const employeeData = this.extractEmployeeData(AccessControllerEvent);
      const timestamp = this.parseTimestamp(dateTime);

      const processedData: ProcessedAttendanceData = {
        deviceId: `${this.sanitizeString(ipAddress)}:${payload.portNo || 0}`,
        deviceName: this.sanitizeString(AccessControllerEvent.deviceName || 'Unknown Device'),
        employeeNoString: employeeData.employeeNoString,
        employeeNo: employeeData.employeeNo,
        employeeName: employeeData.employeeName,
        attendanceStatus,
        timestamp,
        eventType: AccessControllerEvent.subEventType as SubEventType,
        doorNo: AccessControllerEvent.doorNo || 0,
        verifyMethod: this.getVerifyMethod(AccessControllerEvent.currentVerifyMode || 'invalid'),
        ipAddress: this.sanitizeString(ipAddress),
        rawPayload: payload,
      };

      // Forward data to external webhook asynchronously
      this.forwardToExternalWebhook(payload).catch(error => {
        logger.error('Failed to forward webhook data', {
          error: error instanceof Error ? error.message : 'Unknown error',
          deviceId: processedData.deviceId,
        });
      });

      logger.info('Attendance data processed successfully', {
        employeeNo: processedData.employeeNo,
        employeeName: processedData.employeeName,
        attendanceStatus: processedData.attendanceStatus,
        timestamp: processedData.timestamp.toISOString(),
      });

      return processedData;
    } catch (error) {
      logger.error('Error processing attendance data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload: this.sanitizePayload(payload),
      });
      throw error;
    }
  }

  /**
   * Forward processed data to external webhook with retry logic
   */
  private async forwardToExternalWebhook(
    payload: HikvisionWebhookPayload
  ): Promise<WebhookResponse> {
    const formData = new FormData();
    formData.append('event_log', JSON.stringify(payload));

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        logger.debug(
          `Attempting webhook forward (attempt ${attempt}/${this.retryConfig.maxRetries})`
        );

        const response: AxiosResponse = await this.httpClient.post(
          config.externalWebhookUrl,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        logger.info('Attendance data forwarded successfully', {
          status: response.status,
          statusText: response.statusText,
          attempt,
        });

        return {
          success: true,
          message: 'Webhook forwarded successfully',
          data: response.data,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        logger.warn(`Webhook forward attempt ${attempt} failed`, {
          error: lastError.message,
          url: config.externalWebhookUrl,
        });

        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          await this.sleep(delay);
        }
      }
    }

    logger.error('All webhook forward attempts failed', {
      error: lastError?.message,
      maxRetries: this.retryConfig.maxRetries,
      url: config.externalWebhookUrl,
    });

    throw lastError || new Error('Unknown error occurred during webhook forwarding');
  }

  /**
   * Validate attendance payload with comprehensive checks
   */
  validateAttendancePayload(payload: HikvisionWebhookPayload): boolean {
    try {
      if (!payload || typeof payload !== 'object') {
        logger.warn('Invalid payload structure');
        return false;
      }

      // Check for essential fields but be more lenient
      if (!payload.AccessControllerEvent || typeof payload.AccessControllerEvent !== 'object') {
        logger.warn('Missing or invalid AccessControllerEvent');
        return false;
      }

      const event = payload.AccessControllerEvent;

      // Be more lenient with subEventType - allow unknown types but log them
      const isValidEventType = [SubEventType.CLOCK_IN, SubEventType.CLOCK_OUT].includes(
        event.subEventType
      );

      if (!isValidEventType) {
        logger.warn('Unknown subEventType for attendance', {
          subEventType: event.subEventType,
        });
        // Don't return false here, just warn - we'll handle unknown types
      }

      // Basic validation for timestamp and IP, but don't fail completely
      if (payload.dateTime && !this.isValidTimestamp(payload.dateTime)) {
        logger.warn('Invalid timestamp format', {
          dateTime: payload.dateTime,
        });
      }

      if (payload.ipAddress && !this.isValidIpAddress(payload.ipAddress)) {
        logger.warn('Invalid IP address format', {
          ipAddress: payload.ipAddress,
        });
      }

      // Only fail if we're missing critical data
      if (!payload.dateTime && !payload.ipAddress) {
        logger.warn('Missing both dateTime and ipAddress');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating attendance payload', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Determine attendance status based on subEventType
   */
  private determineAttendanceStatus(subEventType: number): AttendanceStatus {
    switch (subEventType) {
      case SubEventType.CLOCK_IN:
        return AttendanceStatus.CHECK_IN;
      case SubEventType.CLOCK_OUT:
        return AttendanceStatus.CHECK_OUT;
      default:
        logger.warn('Unknown subEventType, defaulting to UNDEFINED', {
          subEventType,
        });
        return AttendanceStatus.UNDEFINED;
    }
  }

  /**
   * Extract and validate employee data from event
   */
  private extractEmployeeData(event: any): {
    employeeNoString: string;
    employeeNo: string;
    employeeName: string;
  } {
    const employeeNoString = this.sanitizeString(event.employeeNoString || 'unknown');
    const employeeNo = this.sanitizeString(event.employeeNoString || event.cardNo || 'unknown');
    const employeeName = this.sanitizeString(event.name || 'Unknown Employee');

    return {
      employeeNoString,
      employeeNo,
      employeeName,
    };
  }

  /**
   * Parse and validate timestamp
   */
  private parseTimestamp(dateTime: string): Date {
    if (!dateTime) {
      logger.warn('Missing dateTime, using current time');
      return new Date();
    }

    const timestamp = new Date(dateTime);

    if (isNaN(timestamp.getTime())) {
      logger.warn('Invalid timestamp format, using current time', {
        dateTime,
      });
      return new Date();
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (timestamp < oneDayAgo || timestamp > oneDayLater) {
      logger.warn('Timestamp is outside reasonable range, using current time', {
        timestamp: timestamp.toISOString(),
        dateTime,
      });
      return new Date();
    }

    return timestamp;
  }

  /**
   * Get human-readable verify method
   */
  private getVerifyMethod(currentVerifyMode: string): string {
    const verifyMethods: Record<string, string> = {
      cardOrFaceOrFp: 'Card/Face/Fingerprint',
      card: 'Card Only',
      face: 'Face Only',
      fp: 'Fingerprint Only',
      invalid: 'Invalid/Unknown',
      password: 'Password',
      pin: 'PIN',
      qr: 'QR Code',
    };

    const sanitizedMode = this.sanitizeString(currentVerifyMode);
    return verifyMethods[sanitizedMode] || sanitizedMode;
  }

  /**
   * Sanitize string input to prevent injection
   */
  private sanitizeString(input: string | undefined | null): string {
    if (!input || typeof input !== 'string') {
      return 'unknown';
    }
    return input.trim().replace(/[<>\"'&]/g, '');
  }

  /**
   * Validate IP address format
   */
  private isValidIpAddress(ip: string): boolean {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Validate timestamp format
   */
  private isValidTimestamp(dateTime: string): boolean {
    if (!dateTime || typeof dateTime !== 'string') {
      return false;
    }

    const timestamp = new Date(dateTime);
    return !isNaN(timestamp.getTime());
  }

  /**
   * Sanitize payload for logging (remove sensitive data)
   */
  private sanitizePayload(payload: HikvisionWebhookPayload): any {
    const sanitized = { ...payload };

    if (sanitized.AccessControllerEvent) {
      delete sanitized.AccessControllerEvent.cardNo;
      delete sanitized.AccessControllerEvent.employeeNoString;
    }

    return sanitized;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate attendance summary for reporting
   */
  getAttendanceSummary(data: ProcessedAttendanceData): {
    name: string;
    employeeNo: string;
    status: string;
    timestamp: string;
    verifyMethod: string;
  } {
    return {
      name: data.employeeName || 'Unknown',
      employeeNo: data.employeeNo || 'unknown',
      status: data.attendanceStatus || AttendanceStatus.UNDEFINED,
      timestamp: data.timestamp?.toLocaleString() || new Date().toLocaleString(),
      verifyMethod: data.verifyMethod || 'Unknown',
    };
  }
}
