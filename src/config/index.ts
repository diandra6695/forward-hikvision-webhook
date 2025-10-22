import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  webhookPath: string;
  webhookSecret: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  webhookPath: process.env.WEBHOOK_PATH || '/webhook/hikvision',
  webhookSecret: process.env.WEBHOOK_SECRET || 'default-secret',
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
