import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { NicuCapacityService } from './nicu-capacity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NicuLevel, NicuCotType } from '@prisma/client';

@Controller('nicu-capacity')
@UseGuards(JwtAuthGuard)
export class NicuCapacityController {
  constructor(private readonly nicuCapacityService: NicuCapacityService) {}

  @Get()
  async getCapacity(
    @Query('hospitalId') hospitalId?: string,
    @Query('cluster') cluster?: string,
  ) {
    return this.nicuCapacityService.getCapacity({ hospitalId, cluster });
  }

  @Get('match')
  async match(
    @Query('requiredNicuLevel') requiredNicuLevel: NicuLevel,
    @Query('requiredCotType') requiredCotType: NicuCotType,
    @Query('cluster') cluster?: string,
    @Query('originHospitalId') originHospitalId?: string,
  ) {
    return this.nicuCapacityService.match({
      requiredNicuLevel,
      requiredCotType,
      cluster,
      originHospitalId,
    });
  }

  @Post(':bedId/reserve')
  async reserve(
    @Param('bedId') bedId: string,
    @Body('neonatalTransferId') neonatalTransferId: string,
  ) {
    return this.nicuCapacityService.reserveCot(bedId, neonatalTransferId);
  }
}
