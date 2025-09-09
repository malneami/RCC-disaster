import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GpsConfig } from '../../config/gps.config';

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
}

@Injectable()
export class GpsRetryService {
  private readonly logger = new Logger(GpsRetryService.name);
  private readonly gpsConfig: GpsConfig;

  constructor(private configService: ConfigService) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      attempts = this.gpsConfig.retryAttempts,
      delay = this.gpsConfig.retryDelay,
      backoff = 'exponential',
      maxDelay = 30000,
      retryCondition = this.defaultRetryCondition,
    } = options;

    let lastError: any;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.log(`Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (!retryCondition(error) || attempt === attempts) {
          this.logger.error(`Operation failed after ${attempt} attempts:`, error);
          throw error;
        }

        const waitTime = this.calculateDelay(attempt, delay, backoff, maxDelay);
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${waitTime}ms:`, (error as Error).message);
        
        await this.sleep(waitTime);
      }
    }

    throw lastError;
  }

  private defaultRetryCondition(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    if (error.response) {
      const status = error.response.status;
      return status >= 500 && status < 600;
    }

    return false;
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    backoff: 'linear' | 'exponential',
    maxDelay: number,
  ): number {
    let delay: number;

    if (backoff === 'exponential') {
      delay = baseDelay * Math.pow(2, attempt - 1);
    } else {
      delay = baseDelay * attempt;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    return Math.min(delay, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerKey: string,
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000,
  ): Promise<T> {
    // This would integrate with a circuit breaker pattern
    // For now, we'll implement a simple version
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`Circuit breaker triggered for ${circuitBreakerKey}:`, error);
      throw error;
    }
  }
}
