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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SupportTicketFilterDto } from './dto/support-ticket-filter.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Create a new support ticket
   */
  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
    @Request() req: any
  ) {
    return this.supportService.createTicket(dto, req.user.id);
  }

  /**
   * Get user's tickets
   */
  @Get('tickets')
  @ApiOperation({ summary: 'Get user\'s support tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getUserTickets(
    @Query() filters: SupportTicketFilterDto,
    @Request() req: any
  ) {
    return this.supportService.getUserTickets(req.user.id, filters);
  }

  /**
   * Get ticket by ID
   */
  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTicket(
    @Param('id') ticketId: string,
    @Request() req: any
  ) {
    return this.supportService.getTicket(ticketId, req.user.id, req.user.role);
  }

  /**
   * Create a message on a ticket
   */
  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Send a message on a ticket' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async createMessage(
    @Param('id') ticketId: string,
    @Body() dto: CreateSupportMessageDto,
    @Request() req: any
  ) {
    return this.supportService.createMessage(ticketId, dto, req.user.id, req.user.role);
  }

  /**
   * Upload attachment to ticket
   */
  @Post('tickets/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload attachment to ticket' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async uploadAttachment(
    @Param('id') ticketId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image|video|application\/pdf)/ }),
        ],
      })
    ) file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Request() req: any
  ) {
    return this.supportService.uploadAttachment(ticketId, null, file, req.user.id, req.user.role);
  }

  /**
   * Upload attachment to message
   */
  @Post('tickets/:ticketId/messages/:messageId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload attachment to message' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Ticket or message not found' })
  async uploadMessageAttachment(
    @Param('ticketId') ticketId: string,
    @Param('messageId') messageId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image|video|application\/pdf)/ }),
        ],
      })
    ) file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Request() req: any
  ) {
    return this.supportService.uploadAttachment(ticketId, messageId, file, req.user.id, req.user.role);
  }

  // ========== Support Team Endpoints ==========

  /**
   * Support Team: Get all tickets
   */
  @Get('admin/tickets')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get all tickets (Support Team)' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getAllTickets(@Query() filters: SupportTicketFilterDto) {
    return this.supportService.getAllTickets(filters);
  }

  /**
   * Support Team: Get ticket by ID
   */
  @Get('admin/tickets/:id')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get ticket by ID (Support Team)' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketAdmin(@Param('id') ticketId: string, @Request() req: any) {
    return this.supportService.getTicketAdmin(ticketId, req.user.id);
  }

  /**
   * Support Team: Reply to ticket
   */
  @Post('admin/tickets/:id/messages')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Reply to ticket (Support Team)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async replyToTicket(
    @Param('id') ticketId: string,
    @Body() dto: CreateSupportMessageDto,
    @Request() req: any
  ) {
    return this.supportService.replyToTicket(ticketId, dto, req.user.id);
  }

  /**
   * Support Team: Update ticket status
   */
  @Patch('admin/tickets/:id/status')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Update ticket status (Support Team)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
    @Request() req: any
  ) {
    return this.supportService.updateTicketStatus(ticketId, dto, req.user.id);
  }

  /**
   * Support Team: Get statistics
   */
  @Get('admin/stats')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get support ticket statistics (Support Team)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.supportService.getStatistics();
  }

  /**
   * Support Team: Get Telegram chat_id from phone number
   */
  @Get('admin/telegram/chat-id/:phoneNumber')
  @Roles(UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get Telegram chat_id from phone number (Support Team)' })
  @ApiResponse({ status: 200, description: 'Chat ID retrieved successfully' })
  async getTelegramChatId(@Param('phoneNumber') phoneNumber: string) {
    const chatId = await this.supportService.getTelegramChatIdFromPhone(phoneNumber);
    return { phoneNumber, chatId, found: !!chatId };
  }
}

