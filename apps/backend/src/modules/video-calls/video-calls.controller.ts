import { BadRequestException, Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { VideoCallsService } from './video-calls.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('video-calls')
@UseGuards(JwtAuthGuard)
export class VideoCallsController {
    constructor(private readonly videoCallsService: VideoCallsService) { }

    @Post('token')
    async getToken(@Body() body: { roomId: string }, @Req() req: any) {
        const user = req.user;
        const roomId = body.roomId;

        if (!roomId) {
            throw new BadRequestException('roomId is required');
        }

        const participantName = this.videoCallsService.getUserDisplayName(user);
        const participantIdentity = String(user?.id ?? user?.sub ?? user?.userId ?? participantName);

        const token = await this.videoCallsService.createToken(roomId, participantName, participantIdentity);

        return { token };
    }
}
