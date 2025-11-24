const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');

console.log('🔧 Starting Hikvision Webhook Service installation...');

// Verify built files exist
const distPath = path.join(__dirname, '..', 'dist', 'index.js');
if (!fs.existsSync(distPath)) {
  console.error('❌ Built files not found. Please run "npm run build" first.');
  console.log('💡 Run: npm run build');
  process.exit(1);
}

console.log('✅ Built files verified at:', distPath);

// Create a new service object
const svc = new Service({
  name: 'HikvisionWebhookService',
  description: 'Hikvision attendance webhook processing service',
  script: distPath,
  nodeOptions: [
    '--max-old-space-size=4096',
    '--enable-source-maps'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: process.env.PORT || '3000'
    }
  ],
  workingDirectory: path.join(__dirname, '..'),
  maxRetries: 3,
  maxRestarts: 3,
  wait: 2,
  grow: 0.25,
  abortOnError: false
});

// Enhanced event listeners
svc.on('install', function () {
  console.log('✅ Service installed successfully!');
  console.log('📝 Service name: HikvisionWebhookService');
  console.log('🚀 Starting service...');

  // Give Windows a moment to register the service
  setTimeout(() => {
    svc.start();
  }, 2000);
});

svc.on('alreadyinstalled', function () {
  console.log('⚠️  Service is already installed');
  console.log('💡 To manage the service:');
  console.log('   - npm run service:stop');
  console.log('   - npm run service:start');
  console.log('   - npm run service:uninstall');
});

svc.on('invalidinstallation', function () {
  console.log('❌ Invalid installation detected');
  console.log('🔧 Attempting to clean up and reinstall...');

  // Try to uninstall first
  const uninstallSvc = new Service({
    name: 'HikvisionWebhookService',
    script: distPath
  });

  uninstallSvc.on('uninstall', function () {
    console.log('🧹 Cleaned up invalid installation');
    setTimeout(() => {
      console.log('🔄 Attempting to install again...');
      svc.install();
    }, 2000);
  });

  uninstallSvc.uninstall();
});

svc.on('start', function () {
  console.log('✅ Service started successfully!');
  console.log('📍 The service is now running in the background');
  console.log('🌐 Webhook endpoint: http://localhost:3000/webhook/hikvision');
  console.log('💡 To check status: npm run service:status');
  console.log('🛑 To stop service: npm run service:stop');
  console.log('📋 To view logs: npm run service:logs');
});

svc.on('stop', function () {
  console.log('⏸️  Service stopped');
});

svc.on('error', function (err) {
  console.error('❌ Service error:', err);
  if (err.message.includes('access denied')) {
    console.log('🔐 Please run this command as Administrator');
    process.exit(1);
  }
});

// Install the service
try {
  console.log('📦 Installing service...');
  svc.install();
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  if (error.message.includes('access denied')) {
    console.log('🔐 Please run this command as Administrator');
  }
  process.exit(1);
}