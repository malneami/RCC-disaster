import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuditDimension, AuditEventType, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuditEventInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditEventInterceptor.name);
  private readonly enabled: boolean;
  private readonly criticalEventsOnly: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.enabled = this.configService.get<boolean>('mcpAudit.realtimeEnabled', false);
    this.criticalEventsOnly = this.configService.get<boolean>('mcpAudit.criticalEventsOnly', false);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap(async (data) => {
        // Only audit critical operations
        if (this.isCriticalOperation(method, url)) {
          try {
            await this.logAuditEvent(method, url, data, request.user);
          } catch (error: any) {
            this.logger.error(`Failed to log audit event: ${error.message}`);
          }
        }
      }),
    );
  }

  private isCriticalOperation(method: string, url: string): boolean {
    // Patient operations
    if (url.includes('/patients') && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
      return true;
    }

    // Ticket operations
    if (url.includes('/tickets') && (method === 'POST' || method === 'PATCH')) {
      return true;
    }

    // Disaster operations
    if (url.includes('/disasters/incidents') && (method === 'POST' || method === 'PATCH')) {
      return true;
    }

    // EMS assignments
    if (url.includes('/ems-assignments') && method === 'POST') {
      return true;
    }

    // Hospital bed assignments
    if (url.includes('/bed-requests') && method === 'POST') {
      return true;
    }

    return false;
  }

  private async logAuditEvent(method: string, url: string, data: any, user: any) {
    const entityInfo = this.extractEntityInfo(url, data);
    if (!entityInfo) {
      return;
    }

    let dimension: AuditDimension = AuditDimension.COMPLETENESS;
    let severity: AuditSeverity = AuditSeverity.INFO;
    let description = '';

    // Determine audit dimension and severity based on operation
    if (method === 'POST') {
      dimension = AuditDimension.COMPLETENESS;
      description = `New ${entityInfo.type} created`;
      severity = AuditSeverity.INFO;
    } else if (method === 'PATCH') {
      dimension = AuditDimension.CONSISTENCY;
      description = `${entityInfo.type} updated`;
      severity = AuditSeverity.INFO;
    } else if (method === 'DELETE') {
      dimension = AuditDimension.INTEGRITY;
      description = `${entityInfo.type} deleted`;
      severity = AuditSeverity.WARNING;
    }

    // Skip INFO events if criticalEventsOnly is enabled
    if (this.criticalEventsOnly && severity === AuditSeverity.INFO) {
      return;
    }

    await this.prisma.auditEvent.create({
      data: {
        eventType: AuditEventType.REAL_TIME_EVENT,
        dimension,
        entityType: entityInfo.type,
        entityId: entityInfo.id,
        severity,
        description,
        details: {
          method,
          url,
          timestamp: new Date().toISOString(),
        },
        createdById: user?.id,
      },
    });

    this.logger.log(`Audit event logged: ${description} (${entityInfo.type}:${entityInfo.id})`);
  }

  private extractEntityInfo(url: string, data: any): { type: string; id: string } | null {
    // Extract entity type and ID from URL and response data
    if (url.includes('/patients')) {
      return {
        type: 'PATIENT',
        id: data?.id || 'unknown',
      };
    }

    if (url.includes('/tickets')) {
      return {
        type: 'TICKET',
        id: data?.id || 'unknown',
      };
    }

    if (url.includes('/disasters/incidents')) {
      return {
        type: 'DISASTER',
        id: data?.id || 'unknown',
      };
    }

    if (url.includes('/ems-assignments')) {
      return {
        type: 'EMS_ASSIGNMENT',
        id: data?.id || 'unknown',
      };
    }

    if (url.includes('/bed-requests')) {
      return {
        type: 'BED_REQUEST',
        id: data?.id || 'unknown',
      };
    }

    return null;
  }
}
