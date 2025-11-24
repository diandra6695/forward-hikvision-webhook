const Service = require('node-windows').Service;
const { exec } = require('child_process');

const serviceName = 'HikvisionWebhookService';

// Create a new service object
const svc = new Service({
  name: serviceName,
  script: require('path').join(__dirname, '..', 'dist', 'index.js')
});

// Command line arguments
const command = process.argv[2];

function showUsage() {
  console.log(`
📋 Hikvision Webhook Service Manager

Usage: node service/service-manager.js [command]

Commands:
  start     - Start the service
  stop      - Stop the service
  restart   - Restart the service
  status    - Check service status
  logs      - View recent logs
  help      - Show this help message

Examples:
  npm run service:start
  npm run service:stop
  npm run service:restart
  npm run service:status
  npm run service:logs
`);
}

function checkServiceStatus() {
  console.log('🔍 Checking service status...');

  // First try to check if the service is responding to HTTP requests
  const http = require('http');

  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Service Status: RUNNING');
    console.log('🚀 Hikvision Webhook Service is active and processing requests');
    console.log(`🌐 Health endpoint: http://localhost:${options.port}/health`);
    console.log(`🎣 Webhook endpoint: http://localhost:${options.port}/webhook/hikvision`);
    console.log(`📊 Response status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log('⏸️  Service Status: NOT RESPONDING');
      console.log('🛑 The service is either not running or not accepting connections');
      console.log('💡 Possible reasons:');
      console.log('   - Service is not installed (run: npm run service:install)');
      console.log('   - Service is stopped (run: npm run service:start)');
      console.log('   - Service is running on different port');
      console.log('   - Service is starting up (try again in a few seconds)');
    } else {
      console.log('❌ Error checking service:', err.message);
    }
  });

  req.on('timeout', () => {
    req.destroy();
    console.log('⏱️  Service Status: TIMEOUT');
    console.log('🛑 Service is not responding within timeout period');
  });

  req.end();

  // Also try to get Windows service status if possible
  exec(`sc query "${serviceName}" 2>nul`, (error, stdout, stderr) => {
    if (!error && stdout) {
      if (stdout.includes('RUNNING')) {
        console.log('🔧 Windows Service: RUNNING');
      } else if (stdout.includes('STOPPED')) {
        console.log('🔧 Windows Service: STOPPED');
      } else if (stdout.includes('START_PENDING')) {
        console.log('🔄 Windows Service: STARTING...');
      } else if (stdout.includes('STOP_PENDING')) {
        console.log('🔄 Windows Service: STOPPING...');
      }
    } else {
      console.log('ℹ️  Windows Service status: Could not check (requires Administrator privileges)');
    }
  });
}

function viewLogs() {
  console.log('📋 Recent service logs:');
  console.log('💡 Check the log files at: logs/combined.log and logs/error.log');
  console.log('');

  try {
    const fs = require('fs');
    const path = require('path');

    const logFile = path.join(__dirname, '..', 'logs', 'combined.log');
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      const lines = logs.split('\n').filter(line => line.trim()).slice(-10);
      console.log('Last 10 log entries:');
      console.log(lines.map((line, i) => `[${9-i}] ${line}`).join('\n'));
    } else {
      console.log('ℹ️  Log file not found. Service might not have started yet.');
    }
  } catch (error) {
    console.log('❌ Error reading logs:', error.message);
  }
}

// Handle commands
switch (command?.toLowerCase()) {
  case 'start':
    console.log('🚀 Starting Hikvision Webhook Service...');
    svc.on('start', function () {
      console.log('✅ Service started successfully!');
    });
    svc.on('error', function (err) {
      console.error('❌ Error starting service:', err.message);
    });
    svc.start();
    break;

  case 'stop':
    console.log('🛑 Stopping Hikvision Webhook Service...');
    svc.on('stop', function () {
      console.log('✅ Service stopped successfully!');
    });
    svc.on('error', function (err) {
      console.error('❌ Error stopping service:', err.message);
    });
    svc.stop();
    break;

  case 'restart':
    console.log('🔄 Restarting Hikvision Webhook Service...');
    svc.on('stop', function () {
      console.log('🛑 Service stopped, starting again...');
      setTimeout(() => {
        svc.start();
      }, 2000);
    });
    svc.on('start', function () {
      console.log('✅ Service restarted successfully!');
    });
    svc.on('error', function (err) {
      console.error('❌ Error restarting service:', err.message);
    });
    svc.stop();
    break;

  case 'status':
    checkServiceStatus();
    break;

  case 'logs':
    viewLogs();
    break;

  case 'help':
  default:
    showUsage();
    break;
}