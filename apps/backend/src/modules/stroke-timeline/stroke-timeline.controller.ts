import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StrokeTimelineService } from './stroke-timeline.service';
import { CreateStrokeTimelineDto, UpdateStrokeTimelineDto } from './dto/create-stroke-timeline.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, StrokeEventType } from '@prisma/client';

@Controller('stroke-timeline')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StrokeTimelineController {
  constructor(private readonly strokeTimelineService: StrokeTimelineService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  create(@Body() createStrokeTimelineDto: CreateStrokeTimelineDto, @Request() req: any) {
    return this.strokeTimelineService.create(createStrokeTimelineDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  findAll(
    @Query('strokeCaseId') strokeCaseId?: string,
    @Query('ticketId') ticketId?: string,
    @Query('eventType') eventType?: StrokeEventType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};
    
    if (strokeCaseId) filters.strokeCaseId = strokeCaseId;
    if (ticketId) filters.ticketId = ticketId;
    if (eventType) filters.eventType = eventType;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.strokeTimelineService.findAll(filters);
  }

  @Get('critical-events')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  getCriticalEvents(
    @Query('hospitalId') hospitalId?: string,
    @Query('hoursBack', new ParseIntPipe({ optional: true })) hoursBack?: number,
  ) {
    return this.strokeTimelineService.getCriticalEvents(hospitalId, hoursBack);
  }

  @Get('case/:strokeCaseId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  getTimelineForCase(@Param('strokeCaseId') strokeCaseId: string) {
    return this.strokeTimelineService.getTimelineForCase(strokeCaseId);
  }

  @Get('ticket/:ticketId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  getTimelineForTicket(@Param('ticketId') ticketId: string) {
    return this.strokeTimelineService.getTimelineForTicket(ticketId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  findOne(@Param('id') id: string) {
    return this.strokeTimelineService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  update(
    @Param('id') id: string,
    @Body() updateStrokeTimelineDto: UpdateStrokeTimelineDto,
    @Request() req: any,
  ) {
    return this.strokeTimelineService.update(id, updateStrokeTimelineDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  remove(@Param('id') id: string) {
    return this.strokeTimelineService.remove(id);
  }
}
