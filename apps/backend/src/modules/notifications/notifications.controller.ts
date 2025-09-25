import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationFilterDto, MarkNotificationReadDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Test endpoint to check if notifications module is working
   */
  @Post('test')
  @Public()
  async testEndpoint() {
    return { message: 'Notifications module is working', timestamp: new Date().toISOString() };
  }

  /**
   * Create a new notification
   */
  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.createNotification(createNotificationDto, userId);
  }

  /**
   * Get notifications with filtering and pagination
   */
  @Get()
  async getNotifications(
    @Query() filterDto: NotificationFilterDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.getNotifications(filterDto, userId);
  }

  /**
   * Get notification summary statistics
   */
  @Get('summary')
  async getNotificationSummary(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationsService.getNotificationSummary(userId);
  }

  /**
   * Soft delete notification for current user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotificationForUser(
    @Param('id') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.deleteNotificationForUser(notificationId, userId);
  }

  /**
   * Get notification categories distribution
   */
  @Get('categories')
  async getNotificationCategories(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationsService.getNotificationCategories(userId);
  }

  /**
   * Get notification by ID
   */
  @Get(':id')
  async getNotificationById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.getNotificationById(id, userId);
  }

  /**
   * Mark notifications as read
   */
  @Put('mark-read')
  @HttpCode(HttpStatus.OK)
  async markNotificationsAsRead(
    @Body() markReadDto: MarkNotificationReadDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.markNotificationsAsRead(markReadDto, userId);
  }

  /**
   * Delete notification (archive)
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.deleteNotification(id, userId);
  }
}
