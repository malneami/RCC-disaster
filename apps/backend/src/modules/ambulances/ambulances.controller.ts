import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AmbulancesService } from './ambulances.service';
import { CreateAmbulanceDto } from './dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from './dto/update-ambulance.dto';
import { AmbulanceFilterDto } from './dto/ambulance-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Ambulances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ambulances')
export class AmbulancesController {
  constructor(private readonly ambulancesService: AmbulancesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Create a new ambulance' })
  @ApiResponse({ status: 201, description: 'Ambulance created successfully' })
  @ApiResponse({ status: 409, description: 'Unique constraint violation' })
  async create(@Body() createAmbulanceDto: CreateAmbulanceDto) {
    return this.ambulancesService.create(createAmbulanceDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all ambulances with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of ambulances retrieved successfully' })
  async findAll(@Query() filter: AmbulanceFilterDto) {
    return this.ambulancesService.findAll(filter);
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all available ambulances' })
  @ApiResponse({ status: 200, description: 'List of available ambulances retrieved successfully' })
  async getAvailableAmbulances() {
    return this.ambulancesService.getAvailableAmbulances();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get ambulance by ID' })
  @ApiResponse({ status: 200, description: 'Ambulance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async findOne(@Param('id') id: string) {
    return this.ambulancesService.findById(id);
  }

  @Get('vehicle/:vehicleId')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get ambulance by vehicle ID' })
  @ApiResponse({ status: 200, description: 'Ambulance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async findByVehicleId(@Param('vehicleId') vehicleId: string) {
    return this.ambulancesService.findByVehicleId(vehicleId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Update ambulance' })
  @ApiResponse({ status: 200, description: 'Ambulance updated successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  @ApiResponse({ status: 409, description: 'Unique constraint violation' })
  async update(@Param('id') id: string, @Body() updateAmbulanceDto: UpdateAmbulanceDto) {
    return this.ambulancesService.update(id, updateAmbulanceDto);
  }

  @Patch(':vehicleId/location')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Update ambulance location' })
  @ApiResponse({ status: 200, description: 'Ambulance location updated successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async updateLocation(
    @Param('vehicleId') vehicleId: string,
    @Body() body: { lat: number; lng: number; address?: string },
  ) {
    return this.ambulancesService.updateLocation(vehicleId, body.lat, body.lng, body.address);
  }


  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete ambulance (soft delete)' })
  @ApiResponse({ status: 204, description: 'Ambulance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async remove(@Param('id') id: string) {
    await this.ambulancesService.remove(id);
  }
}
