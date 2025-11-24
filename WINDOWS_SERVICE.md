# Windows Service Setup Guide

This guide explains how to install and run the Hikvision Webhook Service as a Windows Service that runs automatically in the background.

## 🚀 Quick Setup

### Prerequisites

- Windows 10/11 or Windows Server 2016+
- Node.js 18+ installed
- Administrator privileges (required for Windows Services)

### Installation Steps

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Install as Windows Service**
   ```bash
   npm run service:install
   ```

   This command will:
   - Build the TypeScript code
   - Create a Windows Service named "Hikvision Webhook Service"
   - Configure it to start automatically
   - Start the service immediately

## 📋 Service Management Commands

All commands require administrator privileges:

### Installation & Removal
```bash
# Install service (builds and installs)
npm run service:install

# Uninstall service
npm run service:uninstall
```

### Service Control
```bash
# Start the service
npm run service:start

# Stop the service
npm run service:stop

# Restart the service
npm run service:restart

# Check service status
npm run service:status

# View recent logs
npm run service:logs
```

## 🔧 Configuration

### Environment Configuration

The Windows Service runs in production mode by default. Make sure your `.env` file is properly configured:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Webhook Configuration
WEBHOOK_PATH=/webhook/hikvision
WEBHOOK_SECRET=your_secure_webhook_secret

# External Webhook Forwarding
EXTERNAL_WEBHOOK_URL=https://your-endpoint.com/api/webhook
EXTERNAL_WEBHOOK_TIMEOUT=10000
MAX_RETRIES=3

# Logging
LOG_LEVEL=info
```

### Service Properties

The installed service has the following properties:

- **Name**: `Hikvision Webhook Service`
- **Display Name**: `Hikvision Webhook Service`
- **Description**: `Hikvision attendance webhook processing service`
- **Startup Type**: Automatic
- **Node.js Options**: `--max-old-space-size=4096 --enable-source-maps`

## 🔍 Managing Service via Windows GUI

### Using Services Manager (services.msc)

1. Press `Win + R` and type `services.msc`
2. Look for "Hikvision Webhook Service" in the list
3. Right-click to start/stop/restart the service
4. Double-click to view properties and modify settings

### Using Task Manager

1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Go to the "Services" tab
3. Look for "Hikvision Webhook Service"
4. Right-click to control the service

## 📝 Logging and Monitoring

### Log Files Location

Service logs are stored in the following locations:

- **Application Logs**: `logs/combined.log`
- **Error Logs**: `logs/error.log`
- **Windows Event Log**: Available through Windows Event Viewer

### Viewing Logs

```bash
# View recent logs via npm script
npm run service:logs

# View logs directly
type logs\combined.log
type logs\error.log
```

### Windows Event Viewer

1. Press `Win + R` and type `eventvwr.msc`
2. Navigate to **Windows Logs** → **Application**
3. Look for events with source "node-windows" or "Hikvision Webhook Service"

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start

1. **Check Administrator Privileges**
   - Run Command Prompt as Administrator
   - Try starting the service again

2. **Check Dependencies**
   ```bash
   npm run service:logs
   ```

3. **Verify Build**
   ```bash
   npm run build
   npm start
   ```

#### Service Crashes on Startup

1. **Check Environment Variables**
   - Ensure `.env` file exists in project root
   - Verify all required variables are set

2. **Check Port Availability**
   - Make sure port 3000 (or configured PORT) is available
   - Check for other applications using the same port

3. **Check File Permissions**
   - Ensure the service has read/write access to project directory
   - Verify write permissions for `logs/` directory

#### Service Not Responding

1. **Check Service Status**
   ```bash
   npm run service:status
   ```

2. **Restart Service**
   ```bash
   npm run service:restart
   ```

3. **View Windows Event Log**
   - Look for error messages in Windows Event Viewer
   - Check System and Application logs

### Recovery Commands

```bash
# Complete reinstallation
npm run service:uninstall
npm run service:install

# Force stop and restart
npm run service:stop
timeout /t 5
npm run service:start

# Check for stuck processes
tasklist | findstr node
```

## 🔒 Security Considerations

### Running as Service

The service runs with the privileges of the account that installed it. For better security:

1. **Use Dedicated Service Account**
   - Create a Windows user account specifically for this service
   - Grant minimal necessary permissions
   - Avoid using Administrator account for production

2. **File Permissions**
   - Restrict access to project directory
   - Protect `.env` file with sensitive data
   - Secure log files from unauthorized access

3. **Network Security**
   - Configure firewall rules for the service port
   - Use HTTPS if accessible from external networks
   - Implement IP restrictions if needed

## 🚀 Performance Tuning

### Memory Configuration

The service is configured with `--max-old-space-size=4096` (4GB max heap). Adjust if needed:

1. Edit `service/install-service.js`
2. Modify the `nodeOptions` array
3. Reinstall the service

### Service Recovery

The service is configured to:
- Restart automatically on failure
- Up to 3 restart attempts
- 2-second delay between restarts

Adjust these settings in `service/service-config.json` if needed.

## 📊 Monitoring

### Health Checks

Monitor service health:

```bash
# Check service status
npm run service:status

# Test webhook endpoint
curl -X POST http://localhost:3000/webhook/hikvision

# Check service health endpoint
curl http://localhost:3000/health
```

### Performance Monitoring

Monitor:
- Memory usage in Task Manager
- CPU usage during high traffic
- Log file sizes and rotation
- Response times for webhook processing

## 🔄 Updates and Maintenance

### Updating the Service

1. **Stop Current Service**
   ```bash
   npm run service:stop
   ```

2. **Update Code**
   ```bash
   git pull
   npm install
   npm run build
   ```

3. **Restart Service**
   ```bash
   npm run service:start
   ```

### Configuration Changes

1. **Update `.env` file**
2. **Restart Service**
   ```bash
   npm run service:restart
   ```

## 🆘 Getting Help

If you encounter issues:

1. Check service logs: `npm run service:logs`
2. Check Windows Event Log
3. Verify environment configuration
4. Ensure proper file permissions
5. Run with administrator privileges

For additional support, refer to:
- Windows Event Viewer logs
- Application log files in `logs/` directory
- Service status via `services.msc`