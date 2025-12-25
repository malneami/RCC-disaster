import { Module, Global } from '@nestjs/common';
import { AccessLogService } from './services/access-log.service';
import { AccessLogInterceptor } from './interceptors/access-log.interceptor';
import { EncryptionService } from './services/encryption.service';
import { EMSETAService } from './services/ems-eta.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AccessLogService, AccessLogInterceptor, EncryptionService, EMSETAService],
  exports: [AccessLogService, AccessLogInterceptor, EncryptionService, EMSETAService],
})
export class CommonModule {}

