import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { HospitalsService } from './hospitals.service';

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hospitals' })
  async findAll() {
    return this.hospitalsService.findAll();
  }

  @Get('by-service')
  @ApiOperation({ summary: 'Get hospitals by service type' })
  @ApiQuery({ name: 'service', enum: ServiceType })
  async findByService(@Query('service') service: ServiceType) {
    return this.hospitalsService.findByService(service);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID' })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }
}