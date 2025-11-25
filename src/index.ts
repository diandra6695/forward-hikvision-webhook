import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { WebhookController } from './controllers';
import { errorHandler, notFoundHandler, requestLogger, hikvisionMiddleware } from './middleware';
import logger from './utils/logger';
import multer from 'multer';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

const upload = multer();

// Create controllers
const webhookController = new WebhookController();

// Routes
app.get('/health', webhookController.healthCheck.bind(webhookController));
app.get('/info', webhookController.getWebhookInfo.bind(webhookController));

// Hikvision webhook with special middleware
app.post(
  config.webhookPath,
  hikvisionMiddleware,
  webhookController.handleHikvisionWebhook.bind(webhookController)
);

app.post('/test', upload.none(), (req: Request, res: Response) => {
  try {
    // Check if event_log exists
    if (!req.body.event_log) {
      return res.status(400).json({
        message: 'event_log field is required',
        receivedFields: Object.keys(req.body),
      });
    }

    // Parse JSON string from form-data
    const data = JSON.parse(req.body.event_log);

    console.log('test endpoint received:', data);

    res.status(200).json({
      message: 'Test endpoint received data',
      data: data,
    });
  } catch (error) {
    console.error('Error parsing event_log:', error);
    res.status(400).json({
      message: 'Invalid JSON in event_log field',
      error: error instanceof Error ? error.message : 'Unknown error',
      receivedData: req.body.event_log,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Hikvision Webhook Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      info: '/info',
      webhook: config.webhookPath,
    },
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server started successfully`, {
    port: config.port,
    environment: config.nodeEnv,
    webhookPath: config.webhookPath,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
  process.exit(1);
});

export default app;
