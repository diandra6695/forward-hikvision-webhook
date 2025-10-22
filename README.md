# Hikvision Webhook Service

Express service for handling Hikvision attendance webhooks with TypeScript best practices.

## Features

- 🚀 **Type-safe**: Built with TypeScript for type safety and better development experience
- 📊 **Data Processing**: Automatically processes Hikvision webhook payloads into structured attendance data
- 🛡️ **Security**: Built-in security middleware with Helmet and CORS
- 📝 **Logging**: Structured logging with Winston for better debugging and monitoring
- 🔍 **Health Checks**: Built-in health check and service information endpoints
- ⚡ **Performance**: Efficient processing with proper error handling

<!--## Supported Events

- **Clock In**: `subEventType: 38` with `attendanceStatus: "checkIn"`
- **Clock Out**: `subEventType: 22` with `attendanceStatus: "undefined"`-->

## Quick Start

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

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Webhook Configuration
WEBHOOK_PATH=/webhook/hikvision
WEBHOOK_SECRET=your_webhook_secret_here
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

## API Endpoints

### Webhook Endpoint
```
POST /webhook/hikvision
```

Accepts Hikvision Access Controller Event webhooks.

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

Returns service health status and metrics.

### Service Info
```
GET /info
```

Returns information about the service and supported events.

## Processed Data Structure

The service processes raw webhook payloads into structured attendance data:

```typescript
interface ProcessedAttendanceData {
  deviceId: string;        // "192.168.1.11:4000"
  deviceName: string;      // "Access Controller"
  employeeNo: string;      // "001"
  employeeName: string;    // "John Doe"
  attendanceStatus: AttendanceStatus; // "checkIn" | "checkOut" | "undefined"
  timestamp: Date;         // ISO 8601 date
  eventType: number;
  doorNo: number;          // Door number
  verifyMethod: string;    // Human readable verification method
  ipAddress: string;       // Device IP address
  rawPayload: HikvisionWebhookPayload; // Original payload
}
```

## Project Structure

```
src/
├── config/           # Configuration and environment variables
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── services/         # Business logic and data processing
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (logger, etc.)
└── index.ts         # Application entry point
```

## Logging

The service uses Winston for structured logging with different levels:

- **Development**: Console output with colors
- **Production**: File-based logging with rotation

Log files are stored in the `logs/` directory:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Error Handling

The service includes comprehensive error handling:

<!--- **Input Validation**: Joi schemas validate webhook payloads-->
- **Graceful Errors**: Proper HTTP status codes and error messages
- **Error Logging**: Detailed error logging for debugging
- **Uncaught Exceptions**: Proper handling of process-level errors

## Development

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

## Security

- **Helmet**: Security headers for Express
- **CORS**: Cross-origin resource sharing configuration
<!--- **Input Validation**: Joi schema validation for all inputs-->
- **Rate Limiting**: Can be added for production use

## Monitoring

The service provides built-in monitoring:

- **Health Checks**: `/health` endpoint
- **Metrics**: Memory usage, uptime, and request tracking
- **Structured Logs**: JSON-formatted logs for easy parsing
- **Request Logging**: Morgan HTTP request logging
