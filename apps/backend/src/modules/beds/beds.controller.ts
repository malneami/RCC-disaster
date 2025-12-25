import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { BedsService } from './beds.service';
import { GetBedsDto } from './dto/get-beds.dto';
import { BedResponseDto } from './dto/bed-response.dto';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Beds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get()
  @Roles(UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR, UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get beds list with optional filters' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID (admin only)' })
  @ApiQuery({ name: 'unitId', required: false, description: 'Filter by unit ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by bed status', enum: ['OCCUPIED', 'VACANT', 'CLEANING', 'BLOCKED', 'RESERVED'] })
  @ApiResponse({ status: 200, description: 'List of beds', type: [BedResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(
    @Query() query: GetBedsDto,
    @Request() req: any,
  ): Promise<BedResponseDto[]> {
    return this.bedsService.findAll(
      query,
      req.user?.hospitalId || null,
      req.user?.role,
    );
  }

  @Get('units')
  @Roles(UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR, UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get units for a hospital' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID (admin only, defaults to user\'s hospital)' })
  @ApiResponse({ status: 200, description: 'List of units' })
  async getUnits(@Query('hospitalId') hospitalId?: string, @Request() req?: any) {
    // For admin/RCC, allow filtering by hospitalId
    // For HOSPITAL_USER, use their hospitalId
    const targetHospitalId = hospitalId || req?.user?.hospitalId;
    if (!targetHospitalId) {
      return [];
    }
    
    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(req?.user?.role);
    
    if (isHospitalUser && hospitalId && hospitalId !== req.user.hospitalId) {
      return [];
    }
    
    return this.bedsService.getUnitsByHospital(targetHospitalId);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR, UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get bed by ID' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed details', type: BedResponseDto })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<BedResponseDto> {
    return this.bedsService.findOne(
      id,
      req.user?.hospitalId || null,
      req.user?.role,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR, UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Update bed status' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed status updated', type: BedResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBedStatusDto,
    @Request() req: any,
  ): Promise<BedResponseDto> {
    return this.bedsService.updateStatus(
      id,
      updateDto,
      req.user?.id,
      req.user?.hospitalId || null,
      req.user?.role,
    );
  }

  @Get(':id/history')
  @Roles(UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR, UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get bed status history' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed status history' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getBedStatusHistory(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.bedsService.getBedStatusHistory(
      id,
      req.user?.hospitalId || null,
      req.user?.role,
    );
  }
}