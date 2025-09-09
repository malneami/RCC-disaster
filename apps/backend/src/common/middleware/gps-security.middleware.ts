import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { GpsConfig } from '../../config/gps.config';
import * as crypto from 'crypto';

@Injectable()
export class GpsSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GpsSecurityMiddleware.name);
  private readonly gpsConfig: GpsConfig;

  constructor(private configService: ConfigService) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate API key
      await this.validateApiKey(req);
      
      // Validate request signature (if required)
      await this.validateRequestSignature(req);
      
      // Sanitize request data
      this.sanitizeRequest(req);
      
      // Add security headers
      this.addSecurityHeaders(res);
      
      next();
    } catch (error) {
      this.logger.error('GPS security validation failed:', error);
      throw new UnauthorizedException('GPS API access denied');
    }
  }

  private async validateApiKey(req: Request): Promise<void> {
    const apiKey = this.extractApiKey(req);
    
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey !== this.gpsConfig.apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private async validateRequestSignature(req: Request): Promise<void> {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    
    if (!signature || !timestamp) {
      // Signature validation is optional for now
      return;
    }

    const expectedSignature = this.generateSignature(req, timestamp);
    
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid request signature');
    }

    // Check timestamp to prevent replay attacks
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 300) { // 5 minutes tolerance
      throw new UnauthorizedException('Request timestamp is too old');
    }
  }

  private generateSignature(req: Request, timestamp: string): string {
    const method = req.method.toUpperCase();
    const path = req.path;
    const body = req.body ? JSON.stringify(req.body) : '';
    
    const message = `${method}${path}${body}${timestamp}`;
    const secret = this.gpsConfig.apiKey;
    
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  private extractApiKey(req: Request): string | null {
    // Try different header names
    const apiKey = req.headers['x-api-key'] as string ||
                  req.headers['authorization']?.replace('Bearer ', '') ||
                  req.headers['x-gps-api-key'] as string;
    
    return apiKey || null;
  }

  private sanitizeRequest(req: Request): void {
    // Remove potentially dangerous headers
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-real-ip'];
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];
        if (typeof value === 'string') {
          // Basic sanitization - remove script tags and dangerous characters
          req.query[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '');
        }
      });
    }
  }

  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
}
