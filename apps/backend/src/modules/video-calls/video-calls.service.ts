import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AccessToken } from 'livekit-server-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoCallsService {
  private readonly logger = new Logger(VideoCallsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  /**
   * Get user information for Communication
   */
  async getUserInfo(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Error fetching user info: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; email: string | null }): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  }

  /**
   * Create a LiveKit access token
   */
  async createToken(roomName: string, participantName: string, participantIdentity: string) {
    const apiKey = this.configService.get('LIVEKIT_API_KEY')
    const apiSecret = this.configService.get('LIVEKIT_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit API keys are not configured');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName });

    return at.toJwt();
  }
}

