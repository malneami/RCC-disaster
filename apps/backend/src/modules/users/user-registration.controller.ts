import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, RegistrationRequestStatus } from '@prisma/client';
import { UserRegistrationService } from './user-registration.service';
import { CreateUserRegistrationRequestDto, ApproveUserRegistrationRequestDto, RejectUserRegistrationRequestDto } from './dto/user-registration.dto';

@ApiTags('User Registration')
@Controller('user-registration')
export class UserRegistrationController {
  constructor(private readonly userRegistrationService: UserRegistrationService) {}

  @Post('request')
  @ApiOperation({ summary: 'Create a new user registration request' })
  @ApiResponse({ status: 201, description: 'Registration request created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists or pending request exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createRegistrationRequest(@Body() dto: CreateUserRegistrationRequestDto) {
    return this.userRegistrationService.createRegistrationRequest(dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user registration requests (Admin/RCC only)' })
  @ApiResponse({ status: 200, description: 'Registration requests retrieved successfully' })
  async getAllRegistrationRequests(
    @Query('status') status?: RegistrationRequestStatus,
  ) {
    return this.userRegistrationService.getAllRegistrationRequests(status);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific registration request (Admin/RCC only)' })
  @ApiResponse({ status: 200, description: 'Registration request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Registration request not found' })
  async getRegistrationRequestById(@Param('id') id: string) {
    return this.userRegistrationService.getRegistrationRequestById(id);
  }

  @Patch('requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a registration request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Registration request approved and user created' })
  @ApiResponse({ status: 404, description: 'Registration request not found' })
  @ApiResponse({ status: 400, description: 'Request is not pending' })
  async approveRegistrationRequest(
    @Param('id') id: string,
    @Body() dto: ApproveUserRegistrationRequestDto,
    @Request() req: any,
  ) {
    return this.userRegistrationService.approveRegistrationRequest(id, req.user.id, dto);
  }

  @Patch('requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a registration request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Registration request rejected' })
  @ApiResponse({ status: 404, description: 'Registration request not found' })
  @ApiResponse({ status: 400, description: 'Request is not pending' })
  async rejectRegistrationRequest(
    @Param('id') id: string,
    @Body() dto: RejectUserRegistrationRequestDto,
    @Request() req: any,
  ) {
    return this.userRegistrationService.rejectRegistrationRequest(id, req.user.id, dto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get registration request statistics (Admin/RCC only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getRegistrationRequestStats() {
    return this.userRegistrationService.getRegistrationRequestStats();
  }
}

