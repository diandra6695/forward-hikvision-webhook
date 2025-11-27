import { Request, Response } from 'express';
import { unknown, z } from 'zod';
import { HikvisionWebhookPayload, WebhookResponse, AttendanceStatus } from '../types';
import { AttendanceService } from '../services';
import logger from '../utils/logger';

export class WebhookController {
  public attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  /**
   * Handle Hikvision Direct webhook (clean payload format)
   */
  async handleHikvisionDirectWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if any data exists in form data
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('Empty request body received', {
          receivedFields: Object.keys(req.body),
        });
        const response: WebhookResponse = {
          success: false,
          message: 'Request body is required',
        };
        res.status(400).json(response);
        return;
      }

      // The payload should be clean and ready to process
      const payload = req.body;

      // Process the data using existing service
      const processedData = await this.attendanceService.processAttendanceData(payload);

      // Log successful processing
      const summary = this.attendanceService.getAttendanceSummary(processedData);
      logger.info('Direct Hikvision webhook processed successfully', {
        summary,
        processingTime: Date.now() - startTime,
        deviceId: processedData.deviceId,
        employeeNo: processedData.employeeNoString,
        attendanceStatus: processedData.attendanceStatus,
        originalData: payload,
      });

      // Return success response
      const response: WebhookResponse = {
        success: true,
        message: 'Direct Hikvision webhook processed successfully',
        data: processedData,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logger.error('Error processing Direct Hikvision webhook', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        originalData: req.body,
        processingTime: Date.now() - startTime,
      });

      const response: WebhookResponse = {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Handle Hikvision Access Controller webhook (multipart form data)
   */
  async handleHikvisionAccessWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if AccessControllerEvent exists in form data
      if (!req.body.AccessControllerEvent) {
        logger.warn('AccessControllerEvent field is required', {
          receivedFields: Object.keys(req.body),
        });
        const response: WebhookResponse = {
          success: false,
          message: 'AccessControllerEvent field is required',
        };
        res.status(400).json(response);
        return;
      }

      // Parse JSON string from form-data
      let eventData;
      try {
        eventData = JSON.parse(req.body.AccessControllerEvent);
      } catch (parseError) {
        logger.error('Failed to parse AccessControllerEvent JSON', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          rawData: req.body.AccessControllerEvent,
        });
        const response: WebhookResponse = {
          success: false,
          message: 'Invalid JSON in AccessControllerEvent field',
        };
        res.status(400).json(response);
        return;
      }

      // Handle both nested and flat structures
      const transformedPayload: any = {
        ipAddress: eventData.ipAddress || '192.168.1.11',
        portNo: eventData.portNo || 4000,
        protocol: eventData.protocol || 'HTTP',
        macAddress: eventData.macAddress || 'a4:d5:c2:24:dd:74',
        channelID: eventData.channelID || 1,
        dateTime: eventData.dateTime || new Date().toISOString(),
        activePostCount: eventData.activePostCount || 1,
        eventType: eventData.eventType || 'AccessControllerEvent',
        eventState: eventData.eventState || 'active',
        eventDescription: eventData.eventDescription || 'Access Controller Event',
        shortSerialNumber: eventData.shortSerialNumber || '',
        AccessControllerEvent: eventData.AccessControllerEvent || eventData.eventDetail || eventData,
      };

      // Process the data using existing service
      const processedData = await this.attendanceService.processAttendanceData(transformedPayload);

      // Log successful processing
      const summary = this.attendanceService.getAttendanceSummary(processedData);
      logger.info('Access Controller webhook processed successfully', {
        summary,
        processingTime: Date.now() - startTime,
        deviceId: processedData.deviceId,
        employeeNo: processedData.employeeNoString,
        attendanceStatus: processedData.attendanceStatus,
        originalData: eventData,
      });

      // Return success response
      const response: WebhookResponse = {
        success: true,
        message: 'Access Controller event processed successfully',
        data: processedData,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logger.error('Error processing Access Controller webhook', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        originalData: req.body.AccessControllerEvent,
        processingTime: Date.now() - startTime,
      });

      const response: WebhookResponse = {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Handle incoming Hikvision webhook
   */
  async handleHikvisionWebhook(req: Request, res: Response): Promise<void> {
    // console.log(req.body);
    const startTime = Date.now();
    // const response: WebhookResponse = {
    //   success: true,
    //   message: 'Attendance data processed successfully',
    //   data: req.body.event_log,
    // };

    // res.status(200).json(response);

    try {
      // If body is empty, try to parse as text
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('Empty request body received');
        const response: WebhookResponse = {
          success: false,
          message: 'Empty request body',
        };
        res.status(400).json(response);
        return;
      }

      let data;

      if (
        req.body.event_log.AccessControllerEvent.attendanceStatus === 'undefined' ||
        req.body.event_log.AccessControllerEvent.currentVerifyMode === 'invalid' ||
        req.body.event_log.AccessControllerEvent.label === '' ||
        req.body.event_log.AccessControllerEvent.attendanceStatus === undefined
      ) {
        const response: WebhookResponse = {
          success: false,
          message: 'Empty request body',
        };
        res.status(200).json(response);
        return;
      } else {
        data = req.body;
      }
      const processedData = await this.attendanceService.processAttendanceData(data.event_log);

      // Log successful processing
      const summary = this.attendanceService.getAttendanceSummary(processedData);
      logger.info('Webhook processed successfully', {
        summary,
        processingTime: Date.now() - startTime,
        deviceId: processedData.deviceId,
        employeeNo: processedData.employeeNoString,
        attendanceStatus: processedData.attendanceStatus,
      });

      // Return success response
      const response: WebhookResponse = {
        success: true,
        message: 'Attendance data processed successfully',
        data: processedData,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logger.error('Error processing webhook', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        payload: req.body.event_log,
        processingTime: Date.now() - startTime,
      });

      const response: WebhookResponse = {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      service: 'hikvision-webhook-service',
    };

    logger.debug('Health check accessed', healthStatus);
    res.status(200).json(healthStatus);
  }

  /**
   * Get webhook information
   */
  async getWebhookInfo(req: Request, res: Response): Promise<void> {
    const info = {
      service: 'Hikvision Webhook Service',
      version: '1.0.0',
      description: 'Service for handling Hikvision attendance webhooks',
      supportedEvents: ['AccessControllerEvent'],
      supportedSubEventTypes: {
        38: 'Clock In',
        22: 'Clock Out',
      },
      endpoints: {
        webhook: '/webhook/hikvision',
        health: '/health',
        info: '/info',
      },
    };

    res.status(200).json(info);
  }

  /**
   * Validate webhook payload structure
   */
  private validateWebhookPayload(payload: any): { success: boolean; error?: any } {
    // Define the Zod schema for webhook payload validation
    const webhookSchema = z
      .object({
        ipAddress: z.string().ip().optional(),
        portNo: z.number().int().min(1).max(65535),
        protocol: z.enum(['HTTP', 'HTTPS']),
        macAddress: z
          .string()
          .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
          .optional(),
        channelID: z.number().int().optional(),
        dateTime: z.string().datetime().optional(),
        activePostCount: z.number().int().min(0).optional(),
        eventType: z.literal('AccessControllerEvent'),
        eventState: z.enum(['active', 'inactive']).optional(),
        eventDescription: z.string().optional(),
        AccessControllerEvent: z.object({
          deviceName: z.string(),
          majorEventType: z.number().int(),
          subEventType: z.number().int(),
          cardNo: z.string().optional(),
          cardType: z.number().int().optional(),
          name: z.string().optional(),
          cardReaderKind: z.number().int(),
          cardReaderNo: z.number().int().optional(),
          doorNo: z.number().int(),
          serialNo: z.number().int(),
          verifyNo: z.number().int().optional(),
          employeeNoString: z.string().optional(),
          userType: z.string().optional(),
          currentVerifyMode: z.string(),
          frontSerialNo: z.number().int(),
          attendanceStatus: z.string().optional(),
          label: z.string().optional(),
          statusValue: z.number().int(),
          mask: z.string().optional(),
          purePwdVerifyEnable: z.boolean().optional(),
        }),
      })
      .passthrough(); // Allow unknown fields (equivalent to allowUnknown: true)

    const result = webhookSchema.safeParse(payload);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return { success: true };
  }
}
