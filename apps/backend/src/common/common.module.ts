import { Module, Global } from '@nestjs/common';
import { AccessLogService } from './services/access-log.service';
import { AccessLogInterceptor } from './interceptors/access-log.interceptor';
import { EncryptionService } from './services/encryption.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AccessLogService, AccessLogInterceptor, EncryptionService],
  exports: [AccessLogService, AccessLogInterceptor, EncryptionService],
})
export class CommonModule {}

