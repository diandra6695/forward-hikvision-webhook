import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { config } from '../config';

/**
 * Middleware to handle Hikvision webhook requests
 * Supports both JSON and multipart/form-data payloads
 */
export const hikvisionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.get('Content-Type') || '';
  // console.log('test', req);

  // if (config.isDevelopment) {
  //   let rawData = '';
  //   req.on('data', chunk => {
  //     rawData += chunk.toString();
  //   });
  //   console.log('body before middleware', req);
  // }
  logger.info('Hikvision webhook request', {
    method: req.method,
    url: req.url,
    contentType,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // If we already have parsed body (from Express JSON parser), continue
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info('Request body already parsed by Express JSON parser', {
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body),
      contentType,
    });

    // Display full request data in development mode
    if (config.isDevelopment) {
      displayRequestData(req, 'Express JSON Parser');
    }

    next();
    return;
  }

  // Handle multipart/form-data (Hikvision format)
  if (contentType.includes('multipart/form-data')) {
    // logger.info('Processing multipart/form-data from Hikvision device');

    let rawData = '';
    req.on('data', chunk => {
      rawData += chunk.toString();
    });

    if (config.isDevelopment) {
      console.log('rawData', rawData);
    }

    req.on('end', () => {
      logger.debug('Raw multipart data received', {
        length: rawData.length,
        preview: rawData.substring(0, 200) + (rawData.length > 200 ? '...' : ''),
      });

      try {
        // Parse multipart data manually
        const parsedData = parseMultipartData(rawData, contentType);
        if (parsedData) {
          req.body = parsedData;
          logger.info('Successfully parsed multipart data', {
            parsedKeys: Object.keys(parsedData),
          });

          // Display full request data in development mode
          if (config.isDevelopment) {
            displayRequestData(req, 'Multipart Form-Data');
          }
        } else {
          logger.warn('Failed to parse multipart data');
        }
      } catch (error) {
        logger.error('Error parsing multipart data', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      next();
    });

    return;
  }

  // Handle direct JSON content type
  if (contentType.includes('application/json')) {
    logger.info('Processing direct JSON content');
    next();
    return;
  }

  // Handle other content types or when content-type is not specified
  let rawData = '';
  req.on('data', chunk => {
    rawData += chunk;
  });

  req.on('end', () => {
    logger.debug('Raw request data received', {
      length: rawData.length,
      preview: rawData.substring(0, 200) + (rawData.length > 200 ? '...' : ''),
    });

    // Try to parse as JSON if it looks like JSON
    const trimmedData = rawData.trim();
    if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
      try {
        const parsedData = JSON.parse(trimmedData);
        req.body = parsedData;
        logger.info('Successfully parsed JSON data from raw request', {
          keys: Object.keys(parsedData),
        });

        // Display full request data in development mode
        if (config.isDevelopment) {
          displayRequestData(req, 'Raw JSON');
        }
      } catch (error) {
        logger.warn('Failed to parse as JSON', {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataPreview: trimmedData.substring(0, 100) + '...',
        });
      }
    } else if (trimmedData) {
      logger.info('Received non-JSON data, treating as raw text', {
        dataType: typeof trimmedData,
        preview: trimmedData.substring(0, 50) + '...',
      });
      req.body = { raw: trimmedData };

      // Display full request data in development mode
      if (config.isDevelopment) {
        displayRequestData(req, 'Raw Text');
      }
    }

    next();
  });
};

/**
 * Display full request data in development mode for debugging
 */
function displayRequestData(req: Request, source: string): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 WEBHOOK REQUEST DEBUG - DEVELOPMENT MODE');
  console.log('='.repeat(80));

  // Request headers
  console.log('\n📤 Request Headers:');
  console.log('  Method:', req.method);
  console.log('  URL:', req.url);
  console.log('  Content-Type:', req.get('Content-Type') || 'Not specified');
  console.log('  User-Agent:', req.get('User-Agent') || 'Not specified');
  console.log('  IP Address:', req.ip || req.connection.remoteAddress || 'Unknown');
  console.log('  Content-Length:', req.get('Content-Length') || 'Not specified');

  // Additional headers that might be useful
  const interestingHeaders = ['Authorization', 'X-Forwarded-For', 'X-Real-IP', 'Origin', 'Referer'];
  interestingHeaders.forEach(header => {
    const value = req.get(header);
    if (value) {
      console.log(`  ${header}:`, value);
    }
  });

  console.log('\n📥 Request Body Data:');
  console.log(`  Source: ${source}`);
  console.log(`  Body Type: ${typeof req.body}`);
  console.log(`  Keys: [${Object.keys(req.body).join(', ')}]`);

  if (req.body) {
    console.log('\n📋 Complete Body Content:');
    try {
      console.log(JSON.stringify(req.body, null, 2));
    } catch (error) {
      console.log('  Error stringifying body:', error);
      console.log('  Raw body:', req.body);
    }
  } else {
    console.log('  No body data available');
  }

  // Extract and display key HikVision data if present
  if (req.body.AccessControllerEvent) {
    console.log('\n🎯 Key HikVision Data:');
    const event = req.body.AccessControllerEvent;
    console.log(`  Device Name: ${event.deviceName || 'Unknown'}`);
    console.log(`  Employee Name: ${event.name || 'Unknown'}`);
    console.log(`  Employee No: ${event.employeeNoString || 'Unknown'}`);
    console.log(`  Card No: ${event.cardNo || 'Unknown'}`);
    console.log(`  Attendance Status: ${event.attendanceStatus || 'Unknown'}`);
    console.log(`  Event Type: ${event.subEventType || 'Unknown'}`);
    console.log(`  Door No: ${event.doorNo || 'Unknown'}`);
    console.log(`  Timestamp: ${req.body.dateTime || 'Unknown'}`);
  }

  // Show device info if available at root level
  if (req.body.ipAddress) {
    console.log('\n🌐 Device Information:');
    console.log(`  IP Address: ${req.body.ipAddress}`);
    console.log(`  Port: ${req.body.portNo || 'Unknown'}`);
    console.log(`  Protocol: ${req.body.protocol || 'Unknown'}`);
    console.log(`  MAC Address: ${req.body.macAddress || 'Unknown'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔍 END OF DEBUG INFO');
  console.log('='.repeat(80) + '\n');
}

/**
 * Parse multipart/form-data manually - simplified for Hikvision
 */
function parseMultipartData(rawData: string, contentType: string): any {
  try {
    // Look for JSON data in the raw multipart data
    // Hikvision sends: Content-Disposition: form-data; name="event_log"\r\n\r\n{JSON_DATA}

    const jsonMatch = rawData.match(/name="event_log"[\r\n]*[\r\n]*([\s\S]*?)(?=[\r\n]*--|$)/);
    if (jsonMatch) {
      let jsonString = jsonMatch[1] ? jsonMatch[1].trim() || '' : '';

      logger.debug('Found event_log field', {
        length: jsonString.length,
        startsWithBrace: jsonString.startsWith('{'),
        endsWithBrace: jsonString.endsWith('}'),
        preview: jsonString.substring(0, 100) + '...',
      });

      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(jsonString);

        const result = {
          event_log: jsonData,
          ...jsonData, // Flatten to main level
        };

        // logger.info('Successfully parsed Hikvision multipart data', {
        //   eventLogType: typeof jsonData,
        //   totalKeys: Object.keys(result).length,
        //   mainKeys: Object.keys(jsonData),
        // });

        return result;
      } catch (parseError) {
        logger.error('Failed to parse event_log JSON', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          jsonString: jsonString.substring(0, 200) + '...',
        });
        return null;
      }
    }

    logger.warn('No event_log field found in multipart data');
    return null;
  } catch (error) {
    logger.error('Error in parseMultipartData', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
