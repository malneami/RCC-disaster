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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 409, description: 'Unique constraint violation' })
  async create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all drivers with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of drivers retrieved successfully' })
  async findAll(@Query() filter: DriverFilterDto) {
    return this.driversService.findAll(filter);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all active drivers' })
  @ApiResponse({ status: 200, description: 'List of active drivers retrieved successfully' })
  async getActiveDrivers() {
    return this.driversService.getActiveDrivers();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiResponse({ status: 200, description: 'Driver retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Update driver' })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 409, description: 'Unique constraint violation' })
  async update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete driver (soft delete)' })
  @ApiResponse({ status: 204, description: 'Driver deleted successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async remove(@Param('id') id: string) {
    await this.driversService.remove(id);
  }
}

