import {
  HikvisionWebhookPayload,
  ProcessedAttendanceData,
  AttendanceStatus,
  SubEventType,
} from '../types';
import logger from '../utils/logger';

export class AttendanceService {
  /**
   * Process raw Hikvision webhook payload into structured attendance data
   */
  processAttendanceData(payload: HikvisionWebhookPayload): ProcessedAttendanceData {
    try {
      const { AccessControllerEvent, ipAddress, dateTime } = payload;

      // Determine attendance status based on subEventType
      const attendanceStatus = AccessControllerEvent.attendanceStatus;

      // Extract employee information with fallbacks
      const employeeNo =
        AccessControllerEvent.employeeNoString || AccessControllerEvent.cardNo || 'unknown';

      const employeeName = AccessControllerEvent.name || 'Unknown Employee';

      // Parse timestamp
      const timestamp = new Date(dateTime);

      if (isNaN(timestamp.getTime())) {
        throw new Error(`Invalid timestamp format: ${dateTime}`);
      }

      const processedData: ProcessedAttendanceData = {
        deviceId: `${ipAddress}:${payload.portNo}`,
        deviceName: AccessControllerEvent.deviceName,
        employeeNoString: AccessControllerEvent.employeeNoString || 'unknown',
        employeeNo,
        employeeName,
        attendanceStatus,
        timestamp,
        eventType: AccessControllerEvent.subEventType as SubEventType,
        doorNo: AccessControllerEvent.doorNo,
        verifyMethod: this.getVerifyMethod(AccessControllerEvent.currentVerifyMode),
        ipAddress,
        rawPayload: payload,
      };

      // logger.info('Attendance data processed successfully', {
      //   employeeNo,
      //   employeeName,
      //   attendanceStatus,
      //   timestamp: timestamp.toISOString(),
      // });

      return processedData;
    } catch (error) {
      logger.error('Error processing attendance data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload,
      });
      throw error;
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
        return AttendanceStatus.UNDEFINED;
    }
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
    };

    return verifyMethods[currentVerifyMode] || currentVerifyMode;
  }

  /**
   * Validate if the payload contains valid attendance data
   */
  validateAttendancePayload(payload: HikvisionWebhookPayload): boolean {
    try {
      // Check required fields
      if (!payload.AccessControllerEvent) {
        logger.warn('Missing AccessControllerEvent in payload');
        return false;
      }

      if (!payload.dateTime) {
        logger.warn('Missing dateTime in payload');
        return false;
      }

      if (!payload.ipAddress) {
        logger.warn('Missing ipAddress in payload');
        return false;
      }

      const event = payload.AccessControllerEvent;

      // Check if it's a valid attendance event
      const isValidEventType = [SubEventType.CLOCK_IN, SubEventType.CLOCK_OUT].includes(
        event.subEventType
      );

      if (!isValidEventType) {
        logger.warn('Invalid subEventType for attendance', {
          subEventType: event.subEventType,
        });
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
   * Get attendance summary for reporting
   */
  getAttendanceSummary(data: ProcessedAttendanceData): {
    name: string;
    employeeNo: string;
    status: string;
    timestamp: string;
    verifyMethod: string;
  } {
    // const status = data.attendanceStatus === AttendanceStatus.CHECK_IN ? 'Clock In' : 'Clock Out';
    // return `${data.employeeName} (${data.employeeNo}) - ${status} at ${data.timestamp.toLocaleString()} via ${data.verifyMethod}`;
    return {
      name: data.employeeName,
      employeeNo: data.employeeNo,
      status: data.attendanceStatus,
      timestamp: data.timestamp.toLocaleString(),
      verifyMethod: data.verifyMethod,
    };
  }
}
