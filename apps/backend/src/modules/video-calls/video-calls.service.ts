import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VideoCallsService {
  private readonly logger = new Logger(VideoCallsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user information for video calls
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
}

