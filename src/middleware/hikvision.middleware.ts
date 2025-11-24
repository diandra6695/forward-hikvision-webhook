import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to handle Hikvision webhook requests
 * Supports both JSON and multipart/form-data payloads
 */
export const hikvisionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.get('Content-Type') || '';
  // logger.info('Hikvision webhook request', {
  //   method: req.method,
  //   url: req.url,
  //   contentType,
  //   userAgent: req.get('User-Agent'),
  //   ip: req.ip,
  // });

  // If we already have parsed body, continue
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body already parsed', {
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body),
    });
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

    console.log('rawData', rawData);
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
          // logger.info('Successfully parsed multipart data', {
          //   parsedKeys: Object.keys(parsedData),
          // });
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

  // Handle other content types
  let rawData = '';
  req.on('data', chunk => {
    rawData += chunk;
  });

  req.on('end', () => {
    logger.debug('Raw request data received', {
      length: rawData.length,
      preview: rawData.substring(0, 200) + (rawData.length > 200 ? '...' : ''),
    });

    // Try to parse as JSON
    if (rawData.trim().startsWith('{')) {
      try {
        const parsedData = JSON.parse(rawData);
        req.body = parsedData;
        logger.info('Successfully parsed JSON data');
      } catch (error) {
        logger.warn('Failed to parse as JSON', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    next();
  });
};

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
