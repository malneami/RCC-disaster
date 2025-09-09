import { Module } from '@nestjs/common';
import { AmbulancesController } from './ambulances.controller';
import { AmbulancesService } from './ambulances.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AmbulancesController],
  providers: [AmbulancesService],
  exports: [AmbulancesService],
})
export class AmbulancesModule {}


