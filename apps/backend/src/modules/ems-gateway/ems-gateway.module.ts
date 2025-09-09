import { Module } from '@nestjs/common';
import { EmsGateway } from './ems.gateway';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [EmsGateway],
  exports: [EmsGateway],
})
export class EmsGatewayModule {}


