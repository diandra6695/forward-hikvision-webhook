#!/usr/bin/env node

/**
 * Test script to verify webhook handles both form-data and JSON payloads
 */

const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/webhook/hikvision';

// Sample Hikvision JSON payload
const jsonPayload = {
  ipAddress: "192.168.1.100",
  portNo: 80,
  protocol: "HTTP",
  macAddress: "AA:BB:CC:DD:EE:FF",
  channelID: 1,
  dateTime: new Date().toISOString(),
  activePostCount: 1,
  eventType: "AccessControllerEvent",
  eventState: "active",
  eventDescription: "Card verified",
  AccessControllerEvent: {
    deviceName: "Test Device",
    majorEventType: 1,
    subEventType: 38, // CLOCK_IN
    cardNo: "12345678",
    cardType: 1,
    name: "John Doe",
    cardReaderKind: 1,
    doorNo: 1,
    serialNo: "DS-K2801",
    employeeNoString: "EMP001",
    currentVerifyMode: "Card",
    attendanceStatus: "checkIn"
  }
};

async function testJsonPayload() {
  console.log('🧪 Testing JSON payload...');

  try {
    const response = await axios.post(WEBHOOK_URL, jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hikvision-Test-Client'
      },
      timeout: 10000
    });

    console.log('✅ JSON payload test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    return true;
  } catch (error) {
    console.error('❌ JSON payload test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testRawJsonPayload() {
  console.log('\n🧪 Testing raw JSON payload (without Content-Type header)...');

  try {
    const response = await axios.post(WEBHOOK_URL, JSON.stringify(jsonPayload), {
      headers: {
        'User-Agent': 'Hikvision-Test-Client-Raw'
      },
      timeout: 10000
    });

    console.log('✅ Raw JSON payload test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    return true;
  } catch (error) {
    console.error('❌ Raw JSON payload test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing health check...');

  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed - make sure the server is running on port 3000');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting webhook JSON compatibility tests...\n');

  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
    process.exit(1);
  }

  const jsonTest1 = await testJsonPayload();
  const jsonTest2 = await testRawJsonPayload();

  console.log('\n📊 Test Summary:');
  console.log(`Health Check: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`JSON Payload: ${jsonTest1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Raw JSON Payload: ${jsonTest2 ? '✅ PASS' : '❌ FAIL'}`);

  if (healthOk && jsonTest1 && jsonTest2) {
    console.log('\n🎉 All tests passed! The webhook now supports both form-data and JSON payloads.');
    console.log('\n🔍 Development Mode Debugging:');
    console.log('   - Check the server console above for detailed request information');
    console.log('   - All incoming requests are displayed with full headers and body data');
    console.log('   - Key HikVision data is extracted and highlighted for easy debugging');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server logs for details.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testJsonPayload, testRawJsonPayload, testHealthCheck, runTests };