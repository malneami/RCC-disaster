import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { McpAuditRequest, McpAuditResponse, McpHealthResponse } from './dto/mcp.dto';

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);
  private readonly httpClient: AxiosInstance;
  private readonly enabled: boolean;
  private readonly serverUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('mcpAudit.enabled', false);
    this.serverUrl = this.configService.get<string>('mcpAudit.serverUrl', '');
    this.apiKey = this.configService.get<string>('mcpAudit.apiKey', '');
    this.timeoutMs = this.configService.get<number>('mcpAudit.timeoutMs', 30000);
    this.retryAttempts = this.configService.get<number>('mcpAudit.retryAttempts', 3);

    this.httpClient = axios.create({
      baseURL: this.serverUrl,
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (this.enabled && this.serverUrl) {
      this.logger.log(`MCP Audit Client initialized. Server: ${this.serverUrl}`);
    } else {
      this.logger.warn('MCP Audit Client is disabled or not configured');
    }
  }

  /**
   * Submit audit event to MCP server (real-time)
   */
  async submitAuditEvent(event: any): Promise<McpAuditResponse | null> {
    if (!this.enabled || !this.serverUrl) {
      this.logger.debug('MCP submission skipped (disabled)');
      return null;
    }

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        this.logger.log(`Submitting audit event to MCP (attempt ${attempt + 1}/${this.retryAttempts})`);
        const response = await this.httpClient.post<McpAuditResponse>('/api/v1/audit/events', event);
        this.logger.log(`MCP event submission successful: ${response.data.auditId}`);
        return response.data;
      } catch (error: any) {
        attempt++;
        this.logger.error(`MCP event submission failed (attempt ${attempt}): ${error.message}`);
        if (attempt >= this.retryAttempts) {
          this.logger.error('MCP event submission failed after all retries');
          return {
            auditId: event.auditId || 'unknown',
            status: 'FAILED',
            processedAt: new Date().toISOString(),
            error: error.message,
          };
        }
        // Wait before retry (exponential backoff)
        await this.delay(1000 * Math.pow(2, attempt - 1));
      }
    }
    return null;
  }

  /**
   * Request comprehensive audit report from MCP server
   */
  async requestAuditReport(auditRequest: McpAuditRequest): Promise<McpAuditResponse | null> {
    if (!this.enabled || !this.serverUrl) {
      this.logger.debug('MCP audit report request skipped (disabled)');
      return null;
    }

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        this.logger.log(`Requesting audit report from MCP (attempt ${attempt + 1}/${this.retryAttempts})`);
        const response = await this.httpClient.post<McpAuditResponse>('/api/v1/audit/reports', auditRequest);
        this.logger.log(`MCP audit report request successful: ${response.data.auditId}`);
        return response.data;
      } catch (error: any) {
        attempt++;
        this.logger.error(`MCP audit report request failed (attempt ${attempt}): ${error.message}`);
        if (attempt >= this.retryAttempts) {
          this.logger.error('MCP audit report request failed after all retries');
          return {
            auditId: auditRequest.auditId,
            status: 'FAILED',
            processedAt: new Date().toISOString(),
            error: error.message,
          };
        }
        await this.delay(1000 * Math.pow(2, attempt - 1));
      }
    }
    return null;
  }

  /**
   * Check MCP server connection health
   */
  async checkConnection(): Promise<McpHealthResponse> {
    if (!this.enabled || !this.serverUrl) {
      return {
        status: 'ERROR',
        message: 'MCP Audit is disabled or not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await this.httpClient.get<McpHealthResponse>('/api/v1/health');
      this.logger.log('MCP health check successful');
      return response.data;
    } catch (error: any) {
      this.logger.error(`MCP health check failed: ${error.message}`);
      return {
        status: 'ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if MCP integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !!this.serverUrl;
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
