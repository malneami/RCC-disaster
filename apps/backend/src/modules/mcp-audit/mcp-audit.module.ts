import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpAuditService } from './mcp-audit.service';
import { McpAuditController } from './mcp-audit.controller';
import { McpClientService } from './mcp-client.service';
import { McpAuditCronService } from './mcp-audit-cron.service';
import { DatabaseModule } from '../../database/database.module';
import { mcpAuditConfig } from '../../config/mcp-audit.config';

@Module({
  imports: [
    ConfigModule.forFeature(mcpAuditConfig),
    DatabaseModule,
  ],
  controllers: [McpAuditController],
  providers: [
    McpAuditService,
    McpClientService,
    McpAuditCronService,
  ],
  exports: [McpAuditService, McpClientService],
})
export class McpAuditModule {}
