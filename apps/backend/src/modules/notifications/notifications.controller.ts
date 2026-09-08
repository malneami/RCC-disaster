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
  HttpException,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationFilterDto, MarkNotificationReadDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

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
    try {
      this.logger.log('=== createNotification called ===');
      this.logger.log('Request body:', JSON.stringify(createNotificationDto, null, 2));
      this.logger.log('User from request:', JSON.stringify(req.user, null, 2));
      
      const userId = req.user?.id;
      if (!userId) {
        this.logger.error('No user ID found in request');
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      
      // Extract request context for audit logging
      const requestContext = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      };
      
      this.logger.log('Creating notification for user:', userId);
      const result = await this.notificationsService.createNotification(
        createNotificationDto, 
        userId, 
        requestContext
      );
      this.logger.log('Notification created successfully:', result.id);
      
      return result;
    } catch (error) {
      this.logger.error('=== Error in createNotification ===');
      this.logger.error('Error:', error);
      this.logger.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to create notification',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get notifications with filtering and pagination
   */
  @Get()
  async getNotifications(
    @Query() filterDto: NotificationFilterDto,
    @Request() req: any,
  ) {
    try {
      this.logger.log('=== getNotifications called ===');
      this.logger.log('Query params:', JSON.stringify(filterDto, null, 2));
      this.logger.log('User from request:', JSON.stringify(req.user, null, 2));
      
      const userId = req.user?.id;
      if (!userId) {
        this.logger.error('No user ID found in request');
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      
      this.logger.log('Getting notifications for user:', userId);
      const result = await this.notificationsService.getNotifications(filterDto, userId);
      this.logger.log('Notifications retrieved successfully, count:', result.notifications.length);
      
      return result;
    } catch (error) {
      this.logger.error('=== Error in getNotifications ===');
      this.logger.error('Error:', error);
      this.logger.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to get notifications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get unified notifications (case + disaster) for the current user
   */
  @Get('unified')
  async getUnifiedNotifications(
    @Query('limit') limitStr: string | undefined,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.notificationsService.getUnifiedNotifications(userId, limit);
  }

  /**
   * Get unified notification summary including disaster counts
   */
  @Get('unified-summary')
  async getUnifiedSummary(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.notificationsService.getUnifiedSummary(userId);
  }

  /**
   * Mark a disaster notification as read
   */
  @Put('disaster/:id/read')
  @HttpCode(HttpStatus.OK)
  async markDisasterNotificationRead(
    @Param('id') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.notificationsService.markDisasterNotificationRead(notificationId, userId);
  }

  /**
   * Get notification summary statistics with optional filters
   */
  @Get('summary')
  async getNotificationSummary(
    @Query() filterDto: NotificationFilterDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.getNotificationSummary(userId, filterDto);
  }

  /**
   * Soft delete notification for current user
   */
  @Delete(':id/user')
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
   * Get case type counts for notification tabs
   */
  @Get('case-type-counts')
  async getCaseTypeCounts(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationsService.getCaseTypeCounts(userId);
  }

  /**
   * Get user notification preferences
   */
  @Get('preferences')
  async getUserNotificationPreferences(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationsService.getUserNotificationPreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  @Put('preferences')
  async updateUserNotificationPreferences(
    @Body() preferences: any,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationsService.updateUserNotificationPreferences(userId, preferences);
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
