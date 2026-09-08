import { registerAs } from '@nestjs/config';

export const mcpAuditConfig = registerAs('mcpAudit', () => ({
  enabled: process.env.MCP_AUDIT_ENABLED === 'true',
  serverUrl: process.env.MCP_AUDIT_SERVER_URL || '',
  apiKey: process.env.MCP_AUDIT_API_KEY || '',
  timeoutMs: parseInt(process.env.MCP_AUDIT_TIMEOUT_MS || '30000', 10),
  retryAttempts: parseInt(process.env.MCP_AUDIT_RETRY_ATTEMPTS || '3', 10),
  realtimeEnabled: process.env.MCP_AUDIT_REALTIME_ENABLED === 'true',
  criticalEventsOnly: process.env.MCP_AUDIT_CRITICAL_EVENTS_ONLY === 'false',
  dailyHour: parseInt(process.env.MCP_AUDIT_DAILY_HOUR || '3', 10),
  weeklyDay: parseInt(process.env.MCP_AUDIT_WEEKLY_DAY || '0', 10),
}));
