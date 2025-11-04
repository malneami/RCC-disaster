import { Module } from '@nestjs/common';
import { AmbulancesController } from './ambulances.controller';
import { AmbulancesService } from './ambulances.service';
import { DatabaseModule } from '../../database/database.module';
import { GPSMappingService } from '../../common/services/gps-mapping.service';
import { AmbulanceValidationService } from './services/ambulance-validation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AmbulancesController],
  providers: [AmbulancesService, GPSMappingService, AmbulanceValidationService],
  exports: [AmbulancesService],
})
export class AmbulancesModule {}


