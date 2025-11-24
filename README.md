# Hikvision Webhook Service

A robust, production-ready Express service for handling Hikvision attendance webhooks with TypeScript best practices, comprehensive error handling, and data forwarding capabilities.

## ✨ Features

- 🚀 **Type-safe**: Built with TypeScript for type safety and better development experience
- 📊 **Data Processing**: Automatically processes Hikvision webhook payloads into structured attendance data
- 🔄 **Webhook Forwarding**: Forwards processed data to external endpoints with retry logic
- 🛡️ **Security**: Built-in security middleware with Helmet and CORS
- 📝 **Comprehensive Logging**: Structured logging with Winston for better debugging and monitoring
- 🔍 **Health Checks**: Built-in health check and service information endpoints
- ⚡ **High Performance**: Efficient processing with proper error handling and async operations
- 🔧 **Configurable**: Environment-based configuration management
- 🛡️ **Input Validation**: Robust validation and sanitization for all inputs
- 🔄 **Retry Logic**: Exponential backoff retry mechanism for external webhooks

## 📋 Supported Events

- **Clock In**: `subEventType: 38` with `attendanceStatus: "checkIn"`
- **Clock Out**: `subEventType: 22` with `attendanceStatus: "checkOut"`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hikvision-webhook

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your environment variables
# Edit .env file with your settings
```

### Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Webhook Configuration
WEBHOOK_PATH=/webhook/hikvision
WEBHOOK_SECRET=your_webhook_secret_here

# External Webhook Forwarding (Optional)
EXTERNAL_WEBHOOK_URL=https://your-external-endpoint.com/api/webhook
EXTERNAL_WEBHOOK_TIMEOUT=10000
MAX_RETRIES=3
```

### Running the Service

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Webhook Endpoint
```
POST /webhook/hikvision
```

Accepts Hikvision Access Controller Event webhooks and processes them into structured attendance data.

**Example Request:**
```json
{
  "ipAddress": "192.168.1.11",
  "portNo": 4000,
  "protocol": "HTTP",
  "macAddress": "a4:d5:c2:24:dd:74",
  "channelID": 1,
  "dateTime": "2025-10-22T13:43:48+08:00",
  "activePostCount": 1,
  "eventType": "AccessControllerEvent",
  "eventState": "active",
  "eventDescription": "Access Controller Event",
  "AccessControllerEvent": {
    "deviceName": "Access Controller",
    "majorEventType": 5,
    "subEventType": 38,
    "cardNo": "11",
    "cardType": 1,
    "name": "John Doe",
    "cardReaderKind": 1,
    "cardReaderNo": 1,
    "doorNo": 1,
    "verifyNo": 165,
    "employeeNoString": "001",
    "serialNo": 139,
    "userType": "normal",
    "currentVerifyMode": "cardOrFaceOrFp",
    "frontSerialNo": 138,
    "attendanceStatus": "checkIn",
    "label": "Check In",
    "statusValue": 0,
    "mask": "unknown",
    "purePwdVerifyEnable": true
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Attendance data processed successfully",
  "data": {
    "deviceId": "192.168.1.11:4000",
    "deviceName": "Access Controller",
    "employeeNo": "001",
    "employeeName": "John Doe",
    "attendanceStatus": "checkIn",
    "timestamp": "2025-10-22T05:43:48.000Z",
    "eventType": 38,
    "doorNo": 1,
    "verifyMethod": "Card/Face/Fingerprint",
    "ipAddress": "192.168.1.11",
    "rawPayload": { ... }
  }
}
```

### Health Check
```
GET /health
```

Returns service health status and basic metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "50MB",
    "total": "512MB"
  },
  "version": "1.0.0"
}
```

### Service Info
```
GET /info
```

Returns information about the service and supported events.

## 📊 Processed Data Structure

The service processes raw webhook payloads into structured attendance data:

```typescript
interface ProcessedAttendanceData {
  deviceId: string;        // "192.168.1.11:4000"
  deviceName: string;      // "Access Controller"
  employeeNo: string;      // "001"
  employeeNoString: string; // Raw employee number from device
  employeeName: string;    // "John Doe"
  attendanceStatus: AttendanceStatus; // "checkIn" | "checkOut" | "undefined"
  timestamp: Date;         // ISO 8601 date
  eventType: SubEventType; // 38 (CLOCK_IN) | 22 (CLOCK_OUT)
  doorNo: number;          // Door number
  verifyMethod: string;    // Human readable verification method
  ipAddress: string;       // Device IP address
  rawPayload: HikvisionWebhookPayload; // Original payload
}
```

## 🏗️ Project Structure

```
src/
├── config/           # Configuration and environment variables
│   └── index.ts      # Centralized configuration management
├── controllers/      # Route controllers
│   └── webhook.controller.ts  # Webhook endpoint handlers
├── middleware/       # Express middleware
│   ├── error.middleware.ts    # Error handling middleware
│   ├── hikvision.middleware.ts # Hikvision-specific middleware
│   └── index.ts       # Middleware exports
├── services/         # Business logic and data processing
│   ├── attendance.service.ts  # Core attendance processing logic
│   └── index.ts       # Service exports
├── types/           # TypeScript type definitions
│   ├── hikvision.types.ts     # Hikvision-specific types
│   └── index.ts       # Type exports
├── utils/           # Utility functions
│   └── logger.ts     # Winston logger configuration
└── index.ts         # Application entry point
```

## 📝 Logging

The service uses Winston for structured logging with different levels:

- **Development**: Console output with colors and timestamps
- **Production**: File-based logging with rotation

Log files are stored in the `logs/` directory:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

**Log Levels:**
- `error`: Serious errors that require immediate attention
- `warn`: Warning messages for potential issues
- `info`: General information about service operations
- `debug`: Detailed debugging information

## 🔄 Webhook Forwarding

The service automatically forwards processed attendance data to external endpoints:

### Features
- **Retry Logic**: Exponential backoff with configurable max retries
- **Timeout Handling**: Configurable timeout for external requests
- **Error Logging**: Comprehensive error tracking for failed forwards
- **Asynchronous**: Non-blocking forwarding that doesn't affect response times

### Configuration
```env
EXTERNAL_WEBHOOK_URL=https://your-endpoint.com/api/webhook
EXTERNAL_WEBHOOK_TIMEOUT=10000  # 10 seconds
MAX_RETRIES=3
```

## 🛡️ Error Handling & Validation

### Input Validation
- **Schema Validation**: Comprehensive validation of webhook payloads
- **Type Safety**: TypeScript interfaces for all data structures
- **Input Sanitization**: Protection against injection attacks
- **Data Validation**: IP address, timestamp, and field validation

### Error Handling
- **Graceful Errors**: Proper HTTP status codes and error messages
- **Error Logging**: Detailed error logging with context
- **Fallback Values**: Default values for missing or invalid data
- **Uncaught Exceptions**: Proper handling of process-level errors

### Security Features
- **Helmet**: Security headers for Express
- **CORS**: Cross-origin resource sharing configuration
- **Input Sanitization**: Removal of potentially harmful characters
- **Sensitive Data Protection**: Sanitized logging that removes sensitive information

## 🛠️ Development

### Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `WEBHOOK_PATH` | Webhook endpoint path | `/webhook/hikvision` |
| `WEBHOOK_SECRET` | Webhook secret for validation | `default-secret` |
| `EXTERNAL_WEBHOOK_URL` | External webhook forwarding URL | (ngrok default) |
| `EXTERNAL_WEBHOOK_TIMEOUT` | External webhook timeout (ms) | `10000` |
| `MAX_RETRIES` | Maximum retry attempts for forwarding | `3` |

## 🔧 Monitoring & Operations

### Health Monitoring
- **Health Checks**: `/health` endpoint with service status
- **Metrics**: Memory usage, uptime, and system information
- **Structured Logs**: JSON-formatted logs for easy parsing
- **Request Logging**: Morgan HTTP request logging

### Performance Features
- **Async Processing**: Non-blocking webhook forwarding
- **Memory Efficient**: Proper cleanup and resource management
- **Fast Processing**: Optimized data processing pipelines
- **Graceful Degradation**: Service continues with partial data

## 🔒 Security Considerations

- **Input Validation**: All inputs are validated and sanitized
- **Security Headers**: Helmet middleware for security headers
- **CORS Configuration**: Configurable cross-origin policies
- **Secret Management**: Environment-based secret management
- **Data Sanitization**: Sensitive data removed from logs

## 📈 Production Deployment

### Recommended Setup
1. **Environment Variables**: Configure all required environment variables
2. **Process Manager**: Use PM2 or similar for process management
3. **Load Balancer**: Use nginx or similar for load balancing
4. **Monitoring**: Set up log aggregation and monitoring
5. **SSL/TLS**: Configure HTTPS for production

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Missing Environment Variables**
   - Ensure `.env` file exists with all required variables
   - Check for typos in variable names

3. **Webhook Forwarding Failures**
   - Verify `EXTERNAL_WEBHOOK_URL` is accessible
   - Check timeout and retry configurations
   - Review error logs for specific failure reasons

4. **Memory Issues**
   - Monitor memory usage in logs
   - Consider increasing available memory
   - Check for memory leaks in custom code

### Debug Mode
Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will provide detailed logging for troubleshooting webhook processing and forwarding issues.