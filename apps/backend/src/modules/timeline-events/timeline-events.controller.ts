import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineEventsService } from './timeline-events.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Timeline Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timeline-events')
export class TimelineEventsController {
  constructor(private readonly timelineEventsService: TimelineEventsService) {}

  @Get('ticket/:ticketId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get timeline events for a specific ticket' })
  @ApiResponse({ status: 200, description: 'Timeline events retrieved successfully' })
  async getEventsByTicket(@Param('ticketId') ticketId: string) {
    return this.timelineEventsService.getEventsByTicket(ticketId);
  }

  @Get('ambulance/:ambulanceId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get timeline events for a specific ambulance' })
  @ApiResponse({ status: 200, description: 'Timeline events retrieved successfully' })
  async getEventsByAmbulance(
    @Param('ambulanceId') ambulanceId: string,
    @Query('limit') limit?: string
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.timelineEventsService.getEventsByAmbulance(ambulanceId, limitNumber);
  }

  @Get('driver/:driverId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get timeline events for a specific driver' })
  @ApiResponse({ status: 200, description: 'Timeline events retrieved successfully' })
  async getEventsByDriver(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: string
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.timelineEventsService.getEventsByDriver(driverId, limitNumber);
  }
}

