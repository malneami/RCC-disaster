import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SupportTicket, SupportTicketCategory, UserRole } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly frontendUrl: string;
  private readonly telegramBotToken: string;
  private readonly telegramApiUrl: string;
  private readonly supportPhoneNumber: string;
  private readonly supportChatId: string;
  private cachedChatId: string | null = null;
  private chatIdLookupAttempted: boolean = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.telegramApiUrl = `https://api.telegram.org/bot${this.telegramBotToken}`;
    this.supportPhoneNumber = this.configService.get<string>('TELEGRAM_SUPPORT_PHONE') || '';
    this.supportChatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
  }

 
  async sendNewTicketNotification(ticket: SupportTicket & { createdBy: { firstName: string; lastName: string; phoneNumber?: string | null } }): Promise<void> {
    try {
      const categoryName = this.getCategoryName(ticket.category);
      const descriptionPreview = ticket.description.length > 100 
        ? ticket.description.substring(0, 100) + '...' 
        : ticket.description;
      
      const message = `🚨 *New Support Ticket*\n\n` +
        `Ticket #${ticket.ticketNumber}\n` +
        `Category: ${categoryName}\n` +
        `Created by: ${ticket.createdBy.firstName} ${ticket.createdBy.lastName}\n` +
        `Description: ${descriptionPreview}\n\n` +
        `View: ${this.frontendUrl}/support-panel/${ticket.id}`;

      await this.sendTelegramMessage(message);

      this.logger.log(`Telegram message sent for ticket ${ticket.ticketNumber}`);
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`, error.stack);
    }
  }


  async sendNewMessageNotification(
    ticket: SupportTicket & { createdBy: { firstName: string; lastName: string; phoneNumber?: string | null } },
    messageContent: string
  ): Promise<void> {
    try {
      const messagePreview = messageContent.length > 100 
        ? messageContent.substring(0, 100) + '...' 
        : messageContent;
      
      const message = `💬 *New Message on Ticket*\n\n` +
        `Ticket #${ticket.ticketNumber}\n` +
        `From: ${ticket.createdBy.firstName} ${ticket.createdBy.lastName}\n` +
        `Message: ${messagePreview}\n\n` +
        `View: ${this.frontendUrl}/support-panel/${ticket.id}`;

      await this.sendTelegramMessage(message);

      this.logger.log(`Telegram message sent for new message on ticket ${ticket.ticketNumber}`);
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`, error.stack);
    }
  }

  private async sendTelegramMessage(message: string): Promise<void> {
    try {
      if (!this.telegramBotToken) {
        this.logger.warn('Telegram Bot Token not configured. Set TELEGRAM_BOT_TOKEN to enable sending.');
        this.logger.log(`Would send Telegram message: ${message.substring(0, 50)}...`);
        return;
      }

      let chatId: string | null = this.supportChatId || null;
      
      if (!chatId && this.supportPhoneNumber) {
        chatId = await this.getCachedChatId(this.supportPhoneNumber);
        if (chatId) {
          this.logger.debug(`Using cached Telegram chat_id from database: ${chatId}`);
        }
      }
      
      if (!chatId && this.supportPhoneNumber && !this.chatIdLookupAttempted) {
        this.logger.log(`Looking up Telegram chat_id for phone number: ${this.supportPhoneNumber}`);
        chatId = await this.getChatIdFromPhoneNumber(this.supportPhoneNumber);
        this.chatIdLookupAttempted = true;
        
        if (chatId) {
          await this.cacheChatId(this.supportPhoneNumber, chatId);
          this.cachedChatId = chatId;
          this.logger.log(`Successfully found and cached Telegram chat_id: ${chatId} for phone: ${this.supportPhoneNumber}`);
        } else {
          this.logger.warn(`Could not find Telegram chat_id for phone ${this.supportPhoneNumber}.`);
          this.logger.warn(`Please send a message (like /start) to your Telegram bot first, then the system will automatically find your chat_id.`);
        }
      }
      
      if (!chatId) {
        if (this.supportPhoneNumber) {
          this.logger.warn(`Telegram Chat ID not found for phone ${this.supportPhoneNumber}. Please send a message to your bot first, then the system will automatically find your chat_id.`);
        } else {
          this.logger.warn('Telegram Chat ID not configured. Set TELEGRAM_CHAT_ID or TELEGRAM_SUPPORT_PHONE to enable sending.');
        }
        this.logger.log(`Would send Telegram message: ${message.substring(0, 50)}...`);
        return;
      }

      await this.sendViaTelegramAPI(chatId, message);
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
    }
  }


  private async getCachedChatId(phoneNumber: string): Promise<string | null> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: `telegram_chat_id_${phoneNumber}` },
      });
      return config?.value || null;
    } catch (error: any) {
      this.logger.debug(`Failed to get cached chat_id: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache chat_id in database for persistence
   */
  private async cacheChatId(phoneNumber: string, chatId: string): Promise<void> {
    try {
      await this.prisma.systemConfig.upsert({
        where: { key: `telegram_chat_id_${phoneNumber}` },
        update: { value: chatId },
        create: {
          key: `telegram_chat_id_${phoneNumber}`,
          value: chatId,
          description: `Telegram chat_id for phone number ${phoneNumber}`,
        },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to cache chat_id in database: ${error.message}`);
    }
  }


  async getChatIdFromPhoneNumber(phoneNumber: string): Promise<string | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '').replace(/^00/, '');
      
      const updatesResponse = await axios.get(`${this.telegramApiUrl}/getUpdates`, {
        params: {
          limit: 100, 
        },
      });

      if (updatesResponse.data.ok && updatesResponse.data.result) {
        const updates = updatesResponse.data.result;
        
        for (const update of updates) {
          if (update.message?.from) {
            const user = update.message.from;
            if (user.phone_number) {
              const userPhone = user.phone_number.replace(/[\s\-\(\)\+]/g, '').replace(/^00/, '');
              if (userPhone === normalizedPhone || 
                  userPhone.slice(-9) === normalizedPhone.slice(-9) ||
                  normalizedPhone.slice(-9) === userPhone.slice(-9)) {
                this.logger.log(`Found Telegram chat_id ${user.id} for phone number ${phoneNumber}`);
                return user.id.toString();
              }
            }
          }
        }
      }

      this.logger.warn(`Could not find Telegram chat_id for phone number ${phoneNumber}. User must start a conversation with the bot first by sending /start to the bot.`);
      return null;
    } catch (error: any) {
      this.logger.error(`Failed to get chat_id from phone number: ${error.message}`);
      return null;
    }
  }

  private async sendViaTelegramAPI(chatId: string, message: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.telegramApiUrl}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }
      );

      this.logger.debug(`Telegram API response: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      if (error.response) {
        this.logger.error(`Telegram API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(`Telegram API error: ${error.message}`);
      }
      throw error;
    }
  }


  private getCategoryName(category: SupportTicketCategory): string {
    const categoryMap: Record<SupportTicketCategory, string> = {
      BUG: 'Bug',
      ENHANCEMENT: 'Enhancement',
      TECHNICAL_ISSUE: 'Technical Issue',
      FEATURE_REQUEST: 'Feature Request',
      OTHER: 'Other',
    };
    return categoryMap[category] || category;
  }
}

