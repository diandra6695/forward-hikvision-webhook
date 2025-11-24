import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  webhookPath: string;
  webhookSecret: string;
  externalWebhookUrl: string;
  externalWebhookTimeout: number;
  maxRetries: number;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  webhookPath: process.env.WEBHOOK_PATH || '/webhook/hikvision',
  webhookSecret: process.env.WEBHOOK_SECRET || 'default-secret',
  externalWebhookUrl:
    process.env.EXTERNAL_WEBHOOK_URL || 'http://localhost:8000/api/webhook/hikvision',
  externalWebhookTimeout: parseInt(process.env.EXTERNAL_WEBHOOK_TIMEOUT || '10000', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
