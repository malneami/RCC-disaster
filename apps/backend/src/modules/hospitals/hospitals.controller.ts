import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Body, 
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HospitalStatus } from '@prisma/client';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { UpdateHospitalCapacityDto } from './dto/update-hospital-capacity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@Controller('hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hospital' })
  @ApiResponse({ status: 201, description: 'Hospital created successfully' })
  @ApiResponse({ status: 409, description: 'Hospital already exists' })
  @Roles(UserRole.ADMIN, UserRole.RCC)
  async create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all hospitals with optional filters' })
  @ApiQuery({ name: 'status', enum: HospitalStatus, required: false })
  @ApiQuery({ name: 'cluster', required: false })
  @ApiQuery({ name: 'hasStemiService', type: Boolean, required: false })
  @ApiQuery({ name: 'hasStrokeService', type: Boolean, required: false })
  @ApiQuery({ name: 'hasTraumaService', type: Boolean, required: false })
  async findAll(
    @Query('status') status?: HospitalStatus,
    @Query('cluster') cluster?: string,
    @Query('hasStemiService') hasStemiService?: boolean,
    @Query('hasStrokeService') hasStrokeService?: boolean,
    @Query('hasTraumaService') hasTraumaService?: boolean,
  ) {
    return this.hospitalsService.findAll({
      status,
      cluster,
      hasStemiService,
      hasStrokeService,
      hasTraumaService,
    });
  }

  @Get('for-registration')
  @Public()
  @ApiOperation({ summary: 'Get hospitals for user registration (id and name only)' })
  @ApiResponse({ status: 200, description: 'List of hospitals with basic info' })
  async getForRegistration() {
    return this.hospitalsService.getForRegistration();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get capacity alerts for all hospitals' })
  async getCapacityAlerts() {
    return this.hospitalsService.getCapacityAlerts();
  }

  @Get('my-hospital')
  @Roles(UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR)
  @ApiOperation({ summary: 'Get the hospital assigned to the current user' })
  @ApiResponse({ status: 200, description: 'Hospital found' })
  @ApiResponse({ status: 404, description: 'No hospital assigned to user' })
  async getMyHospital(@Request() req: any) {
    const user = req.user;
    
    if (!user.hospitalId) {
      throw new ForbiddenException('No hospital assigned to this user.');
    }
    
    return this.hospitalsService.findById(user.hospitalId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR)
  @ApiOperation({ summary: 'Get hospital by ID' })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Hospital found' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this hospital' })
  async findById(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    
    // Check if hospital-specific roles can only access their assigned hospital
    const hospitalSpecificRoles = [UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR];
    if (hospitalSpecificRoles.includes(user.role) && user.hospitalId !== id) {
      throw new ForbiddenException('Access denied. You can only access your assigned hospital.');
    }
    
    return this.hospitalsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update hospital' })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this hospital' })
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.HOSPITAL_USER)
  async update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto, @Request() req: any) {
    const user = req.user;
    
    // Check if HOSPITAL_USER can only update their assigned hospital
    if (user.role === UserRole.HOSPITAL_USER && user.hospitalId !== id) {
      throw new ForbiddenException('Access denied. You can only update your assigned hospital.');
    }
    
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hospital (soft delete)' })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Hospital deleted successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Roles(UserRole.ADMIN, UserRole.RCC)
  async remove(@Param('id') id: string) {
    return this.hospitalsService.remove(id);
  }

  @Put(':id/capacity')
  @ApiOperation({ summary: 'Update hospital capacity' })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Capacity updated successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @ApiResponse({ status: 400, description: 'Invalid capacity data' })
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  async updateCapacity(
    @Param('id') id: string, 
    @Body() updateCapacityDto: UpdateHospitalCapacityDto
  ) {
    return this.hospitalsService.updateCapacity(id, updateCapacityDto);
  }

  @Post('bulk/capacity')
  @ApiOperation({ summary: 'Bulk update hospital capacity' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  @Roles(UserRole.ADMIN, UserRole.RCC)
  async bulkUpdateCapacity(@Body() updates: Array<{ hospitalId: string; capacity: UpdateHospitalCapacityDto }>) {
    return this.hospitalsService.bulkUpdateCapacity(updates);
  }
}