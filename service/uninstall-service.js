const Service = require('node-windows').Service;

const serviceName = 'HikvisionWebhookService';

console.log('🗑️  Uninstalling Hikvision Webhook Service...');

// Create a new service object
const svc = new Service({
  name: serviceName,
  script: require('path').join(__dirname, '..', 'dist', 'index.js')
});

// Listen for the "uninstall" event.
svc.on('uninstall', function () {
  console.log('✅ Service uninstalled successfully!');
  console.log(`📝 Windows service "${serviceName}" has been removed`);
  console.log('💡 You can reinstall it anytime with: npm run service:install');
});

svc.on('error', function (err) {
  console.error('❌ Error uninstalling service:', err);
  if (err.message.includes('access denied')) {
    console.log('🔐 Please run this command as Administrator');
  } else if (err.message.includes('does not exist') || err.message.includes('1060')) {
    console.log('ℹ️  Service was not found, it may have already been removed');
  }
});

// Uninstall the service.
try {
  svc.uninstall();
} catch (error) {
  console.error('❌ Uninstall failed:', error.message);
  if (error.message.includes('access denied')) {
    console.log('🔐 Please run this command as Administrator');
  }
}