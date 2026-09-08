import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DisasterService } from './disaster.service';
import {
  CreateDisasterIncidentDto,
  CreateAnnouncementDto,
  AssignAmbulanceDto,
  UpdateDestinationDto,
  UpdateTriageCategoryDto,
  BulkDestinationDto,
  AssignCommandRoleDto,
  EscalateCommandRoomDto,
  LogCommandDecisionDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('disasters')
@Controller('disasters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisasterController {
  constructor(
    private readonly disasterService: DisasterService,
  ) {}

  @Get('resolve-map-url')
  @ApiOperation({ summary: 'Resolve Google Maps URL to coordinates (incl. short links)' })
  async resolveMapUrl(@Query('url') url: string) {
    return this.disasterService.resolveMapUrl(url || '');
  }

  @Post('incidents')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Create a new disaster incident' })
  async createIncident(@Body() dto: CreateDisasterIncidentDto, @Request() req: any) {
    return this.disasterService.createIncident(dto, req.user.id);
  }

  @Get('incidents/active')
  @ApiOperation({ summary: 'Get all active disaster incidents' })
  async getActiveIncidents() {
    return this.disasterService.getActiveIncidents();
  }

  @Get('incidents/:id/messages')
  @ApiOperation({ summary: 'Get messages for an incident' })
  async getMessages(@Param('id') id: string) {
    return this.disasterService.getMessages(id);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get incident by ID' })
  async getIncident(@Param('id') id: string) {
    return this.disasterService.getIncidentById(id);
  }

  @Post('incidents/:id/assign-ambulance')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Assign ambulance to incident' })
  async assignAmbulance(
    @Param('id') id: string,
    @Body() dto: AssignAmbulanceDto,
    @Request() req: any,
  ) {
    return this.disasterService.assignAmbulance(id, dto, req.user.id);
  }

  @Patch('incidents/:id/assignments/:assignmentId/arrived')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Mark ambulance arrived at MCI scene' })
  async markArrived(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    return this.disasterService.markAmbulanceArrived(id, assignmentId, req.user.id);
  }

  @Patch('incidents/:id/assignments/:assignmentId/destination')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Set destination hospital for assignment' })
  async setDestination(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateDestinationDto,
    @Request() req: any,
  ) {
    return this.disasterService.updateAssignmentDestination(id, assignmentId, dto.destinationHospitalId, req.user.id);
  }

  @Patch('incidents/:id/assignments/:assignmentId/triage-category')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Update triage category for assignment (no arrival required)' })
  async updateTriageCategory(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateTriageCategoryDto,
    @Request() req: any,
  ) {
    return this.disasterService.updateAssignmentTriageCategory(id, assignmentId, dto.triageCategory, req.user.id);
  }

  @Post('incidents/:id/assignments/bulk-destination')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Bulk set destination for all assignments in a category' })
  async bulkDestination(
    @Param('id') id: string,
    @Body() dto: BulkDestinationDto,
    @Request() req: any,
  ) {
    return this.disasterService.bulkSetDestinationByCategory(id, dto.triageCategory, dto.hospitalId, req.user.id);
  }

  @Patch('incidents/:id/assignments/:assignmentId/patient-loaded')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Mark patient loaded in ambulance' })
  async markPatientLoaded(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    return this.disasterService.markPatientLoaded(id, assignmentId, req.user.id);
  }

  @Patch('incidents/:id/assignments/:assignmentId/departed')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Mark ambulance departed to hospital' })
  async markDeparted(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    return this.disasterService.markDepartedToHospital(id, assignmentId, req.user.id);
  }

  @Patch('incidents/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Resolve incident' })
  async resolveIncident(@Param('id') id: string, @Request() req: any) {
    return this.disasterService.resolveIncident(id, req.user.id);
  }

  @Post('announcements')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Create announcement for incident' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto, @Request() req: any) {
    return this.disasterService.createAnnouncement(dto, req.user.id);
  }

  @Patch('announcements/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Approve and broadcast announcement' })
  async approveAnnouncement(@Param('id') id: string, @Request() req: any) {
    return this.disasterService.approveAnnouncement(id, req.user.id);
  }

  @Post('incidents/:id/messages')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Post a message to incident chat' })
  async createMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    return this.disasterService.createMessage(id, body.content, req.user.id);
  }

  @Get('incidents/:id/command-room')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get command room for incident' })
  async getCommandRoom(@Param('id') id: string) {
    return this.disasterService.getCommandRoom(id);
  }

  @Get('incidents/:id/command-room/situational-awareness')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get situational awareness for command room' })
  async getSituationalAwareness(@Param('id') id: string) {
    return this.disasterService.getSituationalAwareness(id);
  }

  @Get('incidents/:id/command-room/operational-actions')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get operational action log for incident' })
  async getOperationalActions(@Param('id') id: string) {
    return this.disasterService.getOperationalActions(id);
  }

  @Post('incidents/:id/command-room/video-token')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get LiveKit token for command room video call' })
  async getCommandRoomVideoToken(@Param('id') id: string, @Request() req: any) {
    return this.disasterService.getCommandRoomVideoToken(id, req.user.id);
  }

  @Post('incidents/:id/command-room/activate')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Activate command room for incident' })
  async activateCommandRoom(@Param('id') id: string, @Request() req: any) {
    return this.disasterService.activateCommandRoom(id, req.user.id);
  }

  @Post('incidents/:id/command-room/assign-role')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Assign user to command role (Commander or Admin only)' })
  async assignCommandRole(
    @Param('id') id: string,
    @Body() dto: AssignCommandRoleDto,
    @Request() req: any,
  ) {
    return this.disasterService.assignCommandRole(id, dto, req.user.id);
  }

  @Patch('incidents/:id/command-room/escalate')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Escalate command room level (Commander or Admin only)' })
  async escalateCommandRoom(
    @Param('id') id: string,
    @Body() dto: EscalateCommandRoomDto,
    @Request() req: any,
  ) {
    return this.disasterService.escalateCommandRoom(id, dto, req.user.id);
  }

  @Post('incidents/:id/command-room/decisions')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Log a command decision (Commander or Recorder only)' })
  async logCommandDecision(
    @Param('id') id: string,
    @Body() dto: LogCommandDecisionDto,
    @Request() req: any,
  ) {
    return this.disasterService.logCommandDecision(id, dto, req.user.id);
  }

  @Patch('incidents/:id/command-room/close')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Close command room (Commander or Admin only)' })
  async closeCommandRoom(@Param('id') id: string, @Request() req: any) {
    return this.disasterService.closeCommandRoom(id, req.user.id);
  }
}
