import { Controller, Get, Post, Param, Res, Body, NotFoundException, Logger, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { Response, Request } from 'express';
import { RecordingsService } from './recordings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';
import { TranscriptionService } from '../transcription/transcription.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('recordings')
@UseGuards(JwtAuthGuard)
export class RecordingsController {
    private readonly logger = new Logger(RecordingsController.name);

    constructor(
        private readonly recordingsService: RecordingsService,
        private readonly transcriptionService: TranscriptionService,
    ) { }

    @Get()
    async findAll(@Req() req: Request) {
        const user = (req as any).user;
        return this.recordingsService.getRecordings(user?.id, user?.role);
    }

    /**
     * Get transcript and segments for a specific recording
     */
    @Get(':id/transcript')
    async getTranscript(@Param('id') id: string, @Req() req: Request) {
        const user = (req as any).user;
        const userId = user?.id;
        const userRole = user?.role;

        // Load recording first to enforce same access rules as list
        const allRecordings = await this.recordingsService.getRecordings(userId, userRole);
        const recording = allRecordings.find((r) => r.id === id);

        if (!recording) {
            throw new NotFoundException('Recording not found or not accessible');
        }

        const transcript = await this.transcriptionService.getTranscriptForRecording(id);
        return transcript || null;
    }

    /**
     * Trigger (or re-trigger) transcription for a recording.
     * Only ADMIN/RCC or participants in the call can run this.
     */
    @Post(':id/transcript/run')
    async runTranscript(@Param('id') id: string, @Req() req: Request, @Body() body?: { language?: string }) {
        const user = (req as any).user;
        const userId = user?.id;
        const userRole = user?.role;

        const isAdminOrRcc = userRole === 'ADMIN' || userRole === 'RCC';

        // Reuse recordingsService access rules
        const accessible = await this.recordingsService.getRecordings(userId, userRole);
        const recording = accessible.find((r) => r.id === id);

        if (!recording) {
            throw new ForbiddenException('You are not allowed to transcribe this recording');
        }

        // Get the actual file path on disk
        const filePath = this.recordingsService.getRecordingPath(recording.filename);
        const language = body?.language || 'en-US';

        // Run in background to avoid frontend timeouts
        this.transcriptionService.runPostCallTranscription(
            id,
            filePath,
            language,
        ).catch(err => {
            this.logger.error(`Background transcription failed for ${id}:`, err);
        });

        return { success: true };
    }

    /**
     * Webhook endpoint for LiveKit egress completion
     */
    @Post('webhook')
    async handleEgressWebhook(@Body() body: any) {

        try {
            const { event, egress_info } = body;

            if (event === 'egress_ended' || event === 'egress_updated') {
                const egressId = egress_info?.egress_id;
                const status = egress_info?.status;

                if (status === 'EGRESS_COMPLETE' && egressId) {
                    await this.recordingsService.handleEgressCompleted(egressId, egress_info);
                }
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Error handling webhook: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, error: 'Internal server error' };
        }
    }

    /**
     * Stream or download recording file
     */
    @Get(':filename')
    @Public()
    async streamRecording(@Param('filename') filename: string, @Res() res: Response) {
        if (res.req.method === 'OPTIONS') {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, Content-Type',
            });
            res.end();
            return;
        }
        const filePath = this.recordingsService.getRecordingPath(filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Recording not found');
        }

        const stat = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.mp4') {
            contentType = 'video/mp4';
        } else if (ext === '.webm') {
            contentType = 'video/webm';
        } else if (ext === '.mp3') {
            contentType = 'audio/mpeg';
        } else if (ext === '.ogg') {
            contentType = 'audio/ogg';
        } else if (ext === '.wav') {
            contentType = 'audio/wav';
        }

        const range = res.req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunksize = end - start + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, Content-Type',
            });

            const readStream = fs.createReadStream(filePath, { start, end });
            readStream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, Content-Type',
            });

            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
        }
    }

    /**
     * Download recording file
     */
    @Get(':filename/download')
    async downloadRecording(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = this.recordingsService.getRecordingPath(filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Recording not found');
        }

        res.download(filePath, filename);
    }
}
