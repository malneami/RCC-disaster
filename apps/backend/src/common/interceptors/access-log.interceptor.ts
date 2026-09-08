import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AccessLogService, EntityType } from '../services/access-log.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(
    private accessLogService: AccessLogService,
    private prisma: PrismaService,
  ) {}

  private async getValidUserId(userId: string | undefined): Promise<string | null> {
    if (!userId || userId === '4600ecc0-c41b-4d99-8ddd-78ef909182cb') {
      const adminUser = await this.prisma.user.findFirst({
        where: { 
          email: 'admin@rcc-healthcare.com',
          deletedAt: null 
        }
      });
      
      if (adminUser) {
        return adminUser.id;
      }
      return null;
    }
    
    // Verify the userId exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    return user ? userId : null;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;

    // Skip logging if no user (shouldn't happen with auth guard, but safety check)
    if (!user) {
      return next.handle();
    }

    // Determine entity type and ID from URL
    const entityInfo = this.extractEntityInfo(url, method);

    if (!entityInfo) {
      return next.handle();
    }

    // Determine access type from HTTP method
    const accessType = this.mapHttpMethodToAccessType(method);

    // Log after the request completes
    return next.handle().pipe(
      tap({
        next: async () => {
          // Validate userId before logging
          const validUserId = await this.getValidUserId(user.id);
          if (!validUserId) {
            console.warn('[AccessLogInterceptor] Invalid userId, skipping access log:', user.id);
            return;
          }
          
          const forwardedFor = headers['x-forwarded-for'];
          const ipAddr = ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 'unknown';
          
          try {
            await this.accessLogService.logAccess({
              entityType: entityInfo.type,
              entityId: entityInfo.id,
              userId: validUserId,
              accessType,
              accessMethod: 'API',
              ipAddress: ipAddr,
              userAgent: headers['user-agent'] || 'unknown',
              reason: this.getReasonFromContext(context, method),
            });
          } catch (error) {
            console.error('[AccessLogInterceptor] Failed to log access:', error);
          }
        },
        error: async (error) => {
          // Validate userId before logging
          const validUserId = await this.getValidUserId(user.id);
          if (!validUserId) {
            console.warn('[AccessLogInterceptor] Invalid userId, skipping error access log:', user.id);
            return;
          }
          
          // Log even on errors
          const forwardedFor = headers['x-forwarded-for'];
          const ipAddr = ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 'unknown';
          
          try {
            await this.accessLogService.logAccess({
              entityType: entityInfo.type,
              entityId: entityInfo.id,
              userId: validUserId,
              accessType,
              accessMethod: 'API',
              ipAddress: ipAddr,
              userAgent: headers['user-agent'] || 'unknown',
              reason: `Error: ${error.message}`,
            });
          } catch (logError) {
            console.error('[AccessLogInterceptor] Failed to log error access:', logError);
          }
        },
      }),
    );
  }

  private extractEntityInfo(
    url: string,
    method: string,
  ): { type: EntityType; id: string } | null {
    // Extract entity type and ID from URL patterns
    // Examples:
    // /patients/:id -> PATIENT
    // /tickets/:id -> TICKET
    // /patients/:patientId/medical-records/:id -> MEDICAL_RECORD
    // /api/patients/:id -> PATIENT (handle API prefix)

    // Remove query string and normalize URL
    const cleanUrl = url.split('?')[0];
    // Remove leading slashes and split
    let urlParts: string[] = cleanUrl.replace(/^\/+/, '').split('/').filter(Boolean) as string[];
    
    // Remove 'api/v1' or 'api' prefix if present
    if (urlParts.length > 0 && urlParts[0] === 'api') {
      urlParts = urlParts.slice(1);
      // Also remove 'v1' if present
      if (urlParts.length > 0 && urlParts[0] === 'v1') {
        urlParts = urlParts.slice(1);
      }
    }

    // Check for medical records pattern first (more specific)
    if (
      urlParts.includes('medical-records') &&
      urlParts[urlParts.indexOf('medical-records') + 1]
    ) {
      const recordId = urlParts[urlParts.indexOf('medical-records') + 1];
      if (this.isEntityId(recordId)) {
        return { type: EntityType.MEDICAL_RECORD, id: recordId };
      }
    }

    // Check for tickets
    if (urlParts[0] === 'tickets' && this.isEntityId(urlParts[1])) {
      return { type: EntityType.TICKET, id: urlParts[1] };
    }

    // Check for patients
    if (
      urlParts[0] === 'patients' &&
      this.isEntityId(urlParts[1]) &&
      !urlParts.includes('medical-records')
    ) {
      return { type: EntityType.PATIENT, id: urlParts[1] };
    }

    return null;
  }

  /**
   * Named sub-routes such as /tickets/performance would otherwise be treated as
   * entity IDs and fail the access-log insert on a foreign key violation.
   * Entity IDs are UUIDs, so anything else is a route segment.
   */
  private isEntityId(segment: string | undefined): segment is string {
    return (
      !!segment &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    );
  }

  private mapHttpMethodToAccessType(method: string): string {
    const methodMap: Record<string, string> = {
      GET: 'VIEW',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return methodMap[method] || 'VIEW';
  }

  private getReasonFromContext(context: ExecutionContext, method: string): string {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const handlerName = handler.name;

    if (method === 'GET') {
      return `Viewed ${className} via ${handlerName}`;
    } else if (method === 'POST') {
      return `Created ${className} via ${handlerName}`;
    } else if (method === 'PUT' || method === 'PATCH') {
      return `Updated ${className} via ${handlerName}`;
    } else if (method === 'DELETE') {
      return `Deleted ${className} via ${handlerName}`;
    }
    return `Accessed ${className} via ${handlerName}`;
  }

}

