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
import { DriverSchedulesService } from './driver-schedules.service';
import { CreateDriverScheduleDto } from './dto/create-driver-schedule.dto';
import { UpdateDriverScheduleDto } from './dto/update-driver-schedule.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Driver Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('driver-schedules')
export class DriverSchedulesController {
  constructor(private readonly driverSchedulesService: DriverSchedulesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Create a new driver schedule' })
  @ApiResponse({ status: 201, description: 'Driver schedule created successfully' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  async create(@Body() createScheduleDto: CreateDriverScheduleDto) {
    return this.driverSchedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all driver schedules' })
  @ApiResponse({ status: 200, description: 'Driver schedules retrieved successfully' })
  async findAll() {
    return this.driverSchedulesService.findAll();
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all active driver schedules' })
  @ApiResponse({ status: 200, description: 'Active driver schedules retrieved successfully' })
  async getActiveSchedules() {
    return this.driverSchedulesService.getActiveSchedules();
  }

  @Get('driver/:driverId')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get schedules for a specific driver' })
  @ApiResponse({ status: 200, description: 'Driver schedules retrieved successfully' })
  async getSchedulesByDriver(@Param('driverId') driverId: string) {
    return this.driverSchedulesService.getSchedulesByDriver(driverId);
  }

  @Get('ambulance/:ambulanceId')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get schedules for a specific ambulance' })
  @ApiResponse({ status: 200, description: 'Ambulance schedules retrieved successfully' })
  async getSchedulesByAmbulance(@Param('ambulanceId') ambulanceId: string) {
    return this.driverSchedulesService.getSchedulesByAmbulance(ambulanceId);
  }

  @Get('date-range')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get schedules within a date range' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  async getSchedulesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.driverSchedulesService.getSchedulesByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('driver/:driverId/overtime')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get driver overtime for a date range' })
  @ApiResponse({ status: 200, description: 'Driver overtime calculated successfully' })
  async getDriverOvertime(
    @Param('driverId') driverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const overtime = await this.driverSchedulesService.getDriverOvertime(
      driverId,
      new Date(startDate),
      new Date(endDate),
    );
    return { driverId, overtimeHours: overtime };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get driver schedule by ID' })
  @ApiResponse({ status: 200, description: 'Driver schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver schedule not found' })
  async findOne(@Param('id') id: string) {
    return this.driverSchedulesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Update driver schedule' })
  @ApiResponse({ status: 200, description: 'Driver schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Driver schedule not found' })
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateDriverScheduleDto) {
    return this.driverSchedulesService.update(id, updateScheduleDto);
  }

  @Patch(':id/start-break')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Start break for driver schedule' })
  @ApiResponse({ status: 200, description: 'Break started successfully' })
  @ApiResponse({ status: 409, description: 'Break already started or schedule not active' })
  async startBreak(@Param('id') id: string) {
    return this.driverSchedulesService.startBreak(id);
  }

  @Patch(':id/end-break')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'End break for driver schedule' })
  @ApiResponse({ status: 200, description: 'Break ended successfully' })
  @ApiResponse({ status: 409, description: 'No active break to end' })
  async endBreak(@Param('id') id: string) {
    return this.driverSchedulesService.endBreak(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete driver schedule (soft delete)' })
  @ApiResponse({ status: 204, description: 'Driver schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Driver schedule not found' })
  async remove(@Param('id') id: string) {
    await this.driverSchedulesService.remove(id);
  }
}
