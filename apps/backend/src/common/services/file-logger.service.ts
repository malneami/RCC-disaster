import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FileLoggerService {
  private readonly logger: winston.Logger;
  private readonly consoleLogger: Logger;

  constructor() {
    this.consoleLogger = new Logger(FileLoggerService.name);
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create Winston logger with file transport
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'gps-tracking' },
      transports: [
        // Write all logs to gps-tracking.log
        new winston.transports.File({
          filename: path.join(logsDir, 'gps-tracking.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
        // Write errors to a separate file
        new winston.transports.File({
          filename: path.join(logsDir, 'gps-tracking-error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
      ],
    });

    // In development, also log to console
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }
  }

  /**
   * Log GPS polling information
   */
  logGPSPolling(message: string, context?: any): void {
    const logMessage = {
      type: 'GPS_POLLING',
      message,
      ...context,
    };
    this.logger.info(logMessage);
    this.consoleLogger.log(`[GPSPolling] ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log ambulance tracking information
   */
  logAmbulanceTracking(message: string, context?: any): void {
    const logMessage = {
      type: 'AMBULANCE_TRACKING',
      message,
      ...context,
    };
    this.logger.info(logMessage);
    this.consoleLogger.log(`[AmbulanceTracking] ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log GPS processing details
   */
  logGPSProcessing(imei: string, data: { lat: number; lng: number; timestamp: Date; rawTime?: string }): void {
    const logMessage = {
      type: 'GPS_PROCESSING',
      imei,
      latitude: data.lat,
      longitude: data.lng,
      timestamp: data.timestamp.toISOString(),
      rawTimestamp: data.rawTime,
    };
    this.logger.info(logMessage);
    this.consoleLogger.log(
      `Processing GPS for ${imei}: Lat=${data.lat}, Lng=${data.lng}, Time=${data.timestamp.toISOString()} (Raw: ${data.rawTime})`
    );
  }

  /**
   * Log ambulance location update
   */
  logLocationUpdate(ambulanceId: string, data: {
    latitude: number;
    longitude: number;
    isWithinHospital: boolean;
    nearbyHospitalsCount: number;
    hospitalNames?: string[];
  }): void {
    const logMessage = {
      type: 'LOCATION_UPDATE',
      ambulanceId,
      latitude: data.latitude,
      longitude: data.longitude,
      isWithinHospital: data.isWithinHospital,
      nearbyHospitalsCount: data.nearbyHospitalsCount,
      hospitalNames: data.hospitalNames,
      timestamp: new Date().toISOString(),
    };
    this.logger.info(logMessage);
    
    if (data.isWithinHospital) {
      this.consoleLogger.log(
        `Ambulance ${ambulanceId} is within ${data.nearbyHospitalsCount} hospital(s)`
      );
    } else {
      this.consoleLogger.log(
        `Ambulance ${ambulanceId} is not within any hospital zone.`
      );
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | any, context?: any): void {
    const logMessage = {
      type: 'ERROR',
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      ...context,
    };
    this.logger.error(logMessage);
    this.consoleLogger.error(message, error, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: any): void {
    const logMessage = {
      type: 'WARNING',
      message,
      ...context,
    };
    this.logger.warn(logMessage);
    this.consoleLogger.warn(message, context);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: any): void {
    const logMessage = {
      type: 'DEBUG',
      message,
      ...context,
    };
    this.logger.debug(logMessage);
    this.consoleLogger.debug(message, context);
  }
}


