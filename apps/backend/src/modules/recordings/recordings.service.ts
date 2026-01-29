import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EgressClient, RoomCompositeEgressRequest, EncodedFileOutput, EgressInfo, EncodedFileType } from 'livekit-server-sdk';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';
import * as ffprobeStatic from 'ffprobe-static';
import { Prisma, RecordingType } from '@prisma/client';
import { TranscriptionService } from '../transcription/transcription.service';
import { RecordingQueryDto } from './dto/recording-query.dto';

export interface RecordingFile {
    id: string;
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
    roomId: string;
    callerId: string;
    calleeId: string | string[];
    recordingType: 'AUDIO' | 'VIDEO';
    duration?: number;
    callerName?: string;
    calleeNames?: string[];
    transcriptionStatus?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null;
    videoFilename?: string;
}

interface ActiveRecording {
    egressId: string;
    videoEgressId?: string;
    roomId: string;
    callerId: string;
    calleeIds: string[];
    recordingType: 'AUDIO' | 'VIDEO';
    startTime: number;
    filename: string;
    videoFilename?: string;
    filePath: string;
    videoFilePath?: string;
    pendingVideoStart?: boolean;
    upgradedToVideo?: boolean;
}

@Injectable()
export class RecordingsService implements OnModuleInit {
    private readonly logger = new Logger(RecordingsService.name);
    private readonly recordingsDir = path.join(process.cwd(), 'uploads', 'recordings');
    private egressClient?: EgressClient;
    private activeRecordings = new Map<string, ActiveRecording>();
    private pendingVideoStarts = new Set<string>();
    private completedEgressIds = new Set<string>();
    private readonly baseUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        @Inject(forwardRef(() => TranscriptionService))
        private transcriptionService?: TranscriptionService,
    ) {
        const ffmpegPath = typeof ffmpegStatic === 'string' ? ffmpegStatic : (ffmpegStatic as any)?.default || (ffmpegStatic as any)?.path;
        if (ffmpegPath) {
            (ffmpeg as any).setFfmpegPath(ffmpegPath);
        } else {
            this.logger.warn('ffmpeg-static path was not found');
        }
        const fp = typeof ffprobeStatic === 'string' ? ffprobeStatic : (ffprobeStatic as any)?.default || (ffprobeStatic as any)?.path;
        if (fp) {
            (ffmpeg as any).setFfprobePath(fp);
            process.env.FFPROBE_PATH = fp;
        } else {
            this.logger.warn('ffprobe-static path was not found');
        }

        const port = this.configService.get('PORT') || 3001;
        const host = this.configService.get('HOST') || 'localhost';
        const protocol = this.configService.get('PROTOCOL') || 'http';
        this.baseUrl = this.configService.get('BACKEND_URL') || `${protocol}://${host}:${port}`;
        const apiKey = this.configService.get('LIVEKIT_API_KEY');
        const apiSecret = this.configService.get('LIVEKIT_API_SECRET');
        const livekitUrl = this.configService.get('LIVEKIT_URL') || 'http://localhost:7880';

        if (!apiKey || !apiSecret) {
            this.logger.warn('LiveKit credentials not configured. Recording will not work.');
        } else {
            this.egressClient = new EgressClient(livekitUrl, apiKey, apiSecret, { requestTimeout: 60 }); // 60s timeout for stability
        }
    }

    onModuleInit() {
        this.ensureDirectoryExists();
    }

    private ensureDirectoryExists() {
        const uploadsDir = path.dirname(this.recordingsDir);

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Ensure recordings directory exists
        if (!fs.existsSync(this.recordingsDir)) {
            fs.mkdirSync(this.recordingsDir, { recursive: true });
        }
        const directoriesToFix = [uploadsDir, this.recordingsDir];
        for (const dir of directoriesToFix) {
            try {
                if (process.platform === 'win32') {
                    const { execSync } = require('child_process');
                    execSync(`icacls "${dir}" /grant "Everyone:(OI)(CI)F" /T`, { stdio: 'ignore' });
                } else {
                    fs.chmodSync(dir, 0o777);
                }

                // Verify write access by creating a temporary file
                const testFile = path.join(dir, '.permission_test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
            } catch (error) {
                this.logger.warn(`Failed to set or verify permissions on directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    async startRecording(
        roomId: string,
        callerId: string,
        calleeIds: string | string[],
        hasVideo: boolean = false
    ): Promise<string | null> {
        let calleeIdsArray = Array.isArray(calleeIds) ? calleeIds : [calleeIds];

        if (this.pendingVideoStarts.has(roomId)) {
            hasVideo = true;
            this.pendingVideoStarts.delete(roomId);
        }
        calleeIdsArray = calleeIdsArray
            .filter(id => id && !id.startsWith('EG_'));

        if (calleeIdsArray.length === 0) {
            this.logger.error(`Cannot start recording: no callees provided for room ${roomId}`);
            return null;
        }
        try {
            if (!this.egressClient) {
                this.logger.error('LiveKit Egress client not initialized');
                return null;
            }

            const existingRecording = this.activeRecordings.get(roomId);
            if (existingRecording) {
                return existingRecording.egressId;
            }

            const timestamp = Date.now();
            let egressId: string | null = null;
            let finalFilename: string = "";
            let finalFilePath: string = "";
            let finalVideoEgressId: string | undefined;
            let finalVideoFilename: string | undefined;
            let finalVideoFilePath: string | undefined;

            finalFilename = `${roomId}-${timestamp}-Unified.mp4`;
            finalFilePath = path.join(this.recordingsDir, finalFilename);
            const containerPath = `/out/${finalFilename}`;

            const fileOutput = new EncodedFileOutput({
                filepath: containerPath,
                fileType: EncodedFileType.MP4,
            });

            const egress = await this.egressClient.startRoomCompositeEgress(
                roomId,
                fileOutput,
                {
                    audioOnly: false,
                    videoOnly: false, // Explicitly capture both
                }
            );
            egressId = egress.egressId!;

            finalVideoFilename = finalFilename;
            finalVideoFilePath = finalFilePath;
            finalVideoEgressId = egressId;

            const initialRecordingType = hasVideo ? 'VIDEO' as const : 'AUDIO' as const;

            this.activeRecordings.set(roomId, {
                egressId: egressId!,
                videoEgressId: egressId, // Same ID for both
                roomId,
                callerId,
                calleeIds: calleeIdsArray,
                recordingType: initialRecordingType,
                startTime: timestamp,
                filename: finalFilename,
                videoFilename: finalFilename,
                filePath: finalFilePath,
                videoFilePath: finalFilePath,
            });

            try {
                await this.createPendingRecording({
                    egressId: egressId!,
                    roomId,
                    callerId,
                    calleeIds: calleeIdsArray,
                    recordingType: initialRecordingType,
                    filename: finalFilename,
                    filePath: finalFilePath,
                    videoFilename: finalFilename,
                    videoPath: finalFilePath,
                    videoEgressId: egressId,
                });
            } catch (dbError) {
                this.logger.error(`Failed to create pending recording: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
            }

            return egressId!;

        } catch (error) {
            this.logger.error(`Error starting recording: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            return null;
        }
    }

    /**
     * Start video recording for an active call (dynamic mid-call video start)
     * @param roomId - Room ID
     * @returns Video egress ID or null
     */
    async startVideoRecording(roomId: string): Promise<string | null> {
        if (!this.egressClient) {
            this.logger.error('LiveKit Egress client not initialized');
            return null;
        }

        const activeRecording = this.activeRecordings.get(roomId);
        if (!activeRecording) {
            this.pendingVideoStarts.add(roomId);
            return 'PENDING';
        }

        if (activeRecording.videoEgressId) {
            if (activeRecording.recordingType !== 'VIDEO') {
                activeRecording.recordingType = 'VIDEO';
                activeRecording.upgradedToVideo = true;

                try {
                    await this.prisma.recording.updateMany({
                        where: { egressId: activeRecording.egressId },
                        data: {
                            recordingType: 'VIDEO',
                            upgradedToVideo: true
                        } as any
                    });
                } catch (e) {
                    this.logger.warn(`Failed to update pending recording type: ${e}`);
                }
            }
            return activeRecording.videoEgressId;
        }

        this.logger.warn(`Unexpected state: Active recording has no videoEgressId in unified mode`);
        return null;
    }

    /**
     * Stop video recording for a room (dynamic mid-call video stop)
     * Audio recording continues
     * @param roomId - Room ID
     */
    async stopVideoRecording(roomId: string): Promise<void> {
        try {
            const activeRecording = this.activeRecordings.get(roomId);
            if (!activeRecording || !activeRecording.videoEgressId) {
                this.logger.warn(`No active video recording for room ${roomId}`);
                return;
            }

            if (activeRecording.egressId === activeRecording.videoEgressId) {
                return;
            }

            if (this.egressClient) {
                await this.egressClient.stopEgress(activeRecording.videoEgressId);
            }

            if (activeRecording.videoFilePath && activeRecording.videoFilename) {
                await this.updateRecordingWithVideoData(activeRecording);
            }
            activeRecording.videoEgressId = undefined;
            activeRecording.videoFilename = undefined;
            activeRecording.videoFilePath = undefined;
            activeRecording.recordingType = 'AUDIO';

        } catch (error) {
            this.logger.error(`Error stopping video recording: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Stop recording for a room
     * Stops both audio and video recordings if active
     * @param roomId - Room ID
     * @param allParticipantIds - Optional: All current participant IDs to ensure final callees list is up to date
     * @param callerId - Optional: Caller ID to filter out from callees
     */
    async stopRecording(roomId: string, allParticipantIds?: string[], callerId?: string): Promise<void> {
        try {
            const activeRecording = this.activeRecordings.get(roomId);
            if (!activeRecording) {
                this.logger.warn(`No active recording found for room: ${roomId}`);
                return;
            }

            // Prevent EGRESS_ABORTED for short calls (LiveKit needs time to start)
            const MIN_RECORDING_DURATION = 10000; // 10 seconds
            const elapsed = Date.now() - activeRecording.startTime;
            if (elapsed < MIN_RECORDING_DURATION) {
                const waitTime = MIN_RECORDING_DURATION - elapsed;
                this.logger.log(`Short call detected (${Math.round(elapsed / 1000)}s), waiting ${Math.round(waitTime / 1000)}s before stopping egress to ensure stability...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            if (allParticipantIds && callerId) {
                const calleeIds = allParticipantIds.filter(id => id !== callerId && id && !id.startsWith('EG_'));
                if (calleeIds.length > 0) {
                    activeRecording.calleeIds = calleeIds;
                }
            }

            if (!this.egressClient) {
                this.logger.error('LiveKit Egress client not initialized');
                return;
            }

            try {
                await this.egressClient.stopEgress(activeRecording.egressId);
            } catch (error) {
                this.logger.warn(`Error stopping audio egress (might be already complete): ${error instanceof Error ? error.message : String(error)}`);
            }

            if (activeRecording.videoEgressId && activeRecording.videoEgressId !== activeRecording.egressId) {
                try {
                    await this.egressClient.stopEgress(activeRecording.videoEgressId);
                } catch (error) {
                    this.logger.warn(`Error stopping video egress (might be already complete): ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            // Persist recording to DB (includes both audio and video data if available)
            const recordingId = await this.persistRecordingToDb(activeRecording);

            this.activeRecordings.delete(roomId);

            if (recordingId) {
                this.triggerPostCallTranscription(recordingId, activeRecording.filePath).catch(error => {
                    this.logger.error(`Failed to trigger post-call transcription for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
                });
            }
        } catch (error) {
            this.logger.error(`Error stopping recording: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    private async calculateDurationFromFile(filePath: string, retries: number = 3): Promise<number> {
        for (let i = 0; i < retries; i++) {
            try {
                return await new Promise((resolve, reject) => {
                    if (!fs.existsSync(filePath)) {
                        return resolve(0);
                    }
                    ffmpeg.ffprobe(filePath, (err, metadata) => {
                        if (err) return reject(err);
                        const duration = metadata.format.duration;
                        if (duration && !isNaN(duration)) {
                            resolve(Math.floor(duration * 1000));
                        } else {
                            resolve(0);
                        }
                    });
                });
            } catch (error) {
                if (i === retries - 1) {
                    return 0;
                }
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        return 0;
    }


    /**
     * Create a pending recording row in the database at call start.
     * This allows live transcripts to link to the recording before the file exists.
     */
    private async createPendingRecording(data: {
        egressId: string;
        roomId: string;
        callerId: string;
        calleeIds: string[];
        recordingType: string;
        filename: string;
        filePath: string;
        videoFilename?: string;
        videoPath?: string;
        videoEgressId?: string;
    }): Promise<void> {
        const caller = await this.prisma.user.findUnique({
            where: { id: data.callerId },
            select: { firstName: true, lastName: true, email: true }
        });

        if (!caller) {
            throw new Error(`Caller not found: ${data.callerId}`);
        }

        const callerName = `${caller.firstName ?? ''} ${caller.lastName ?? ''}`.trim() || caller.email || 'Unknown';
        const primaryCalleeId = data.calleeIds[0];

        const existing = await this.prisma.recording.findFirst({ where: { egressId: data.egressId } });
        if (existing) {
            return;
        }

        const dataInput = {
            filename: data.filename,
            path: data.filePath,
            size: 0,
            duration: 0,
            roomId: data.roomId,
            egressId: data.egressId,
            caller: { connect: { id: data.callerId } },
            callee: { connect: { id: primaryCalleeId } },
            recordingType: data.recordingType as RecordingType,
            fileFormat: 'mp3',
            videoFilename: data.videoFilename,
            videoPath: data.videoPath,
            videoEgressId: data.videoEgressId,
            participants: {
                create: [
                    { userId: data.callerId, role: 'caller' },
                    ...data.calleeIds.map(id => ({ userId: id, role: 'callee' }))
                ]
            }
        };

        await this.prisma.recording.create({
            data: dataInput as any,
        });
    }

    private async persistRecordingToDb(rec: ActiveRecording, actualEgressId?: string): Promise<string | null> {
        try {
            const currentEgressId = actualEgressId || rec.egressId;
            if (this.completedEgressIds.has(currentEgressId)) {
                return null;
            }
            if (!await this.waitForFileStability(rec.filePath)) {
                const files = fs.readdirSync(this.recordingsDir);
                const fallback = files.find((f) => f.includes(rec.roomId) && f.includes(String(rec.startTime)) && f.endsWith('.mp4'));
                if (fallback) {
                    rec.filename = fallback;
                    rec.filePath = path.join(this.recordingsDir, fallback);
                    await this.waitForFileStability(rec.filePath);
                }
            }

            if (!fs.existsSync(rec.filePath)) {
                const elapsedS = Math.round((Date.now() - rec.startTime) / 1000);
                if (elapsedS < 15) {
                    this.logger.warn(`Recording file not found for room ${rec.roomId}. The call was very short (${elapsedS}s), so LiveKit likely aborted the egress without saving. This is expected.`);
                } else {
                    this.logger.error(`Recording file not found on disk for room ${rec.roomId} after ${elapsedS}s: ${rec.filePath}`);
                }
                return null;
            }

            const stats = fs.statSync(rec.filePath);
            if (stats.size <= 0) {
                this.logger.warn(`Recording file exists but is empty for room ${rec.roomId}: ${rec.filePath}`);
            }

            const duration = await this.calculateDurationFromFile(rec.filePath);


            const caller = await this.prisma.user.findUnique({
                where: { id: rec.callerId },
                select: { id: true, firstName: true, lastName: true, email: true }
            });

            if (!caller) {
                this.logger.error(`Cannot save recording to DB: caller not found. callerId=${rec.callerId}`);
                return null;
            }

            const callees = await Promise.all(
                rec.calleeIds.map(calleeId =>
                    this.prisma.user.findUnique({
                        where: { id: calleeId },
                        select: { id: true, firstName: true, lastName: true, email: true }
                    })
                )
            );

            const missingCallees = rec.calleeIds.filter((_, index) => !callees[index]);
            if (missingCallees.length > 0) {
                this.logger.warn(`Some callees not found for recording ${rec.egressId}. Missing: ${missingCallees.join(', ')}. Proceeding with available callees.`);
            }

            const validCallees = callees.filter((c): c is NonNullable<typeof c> => c !== null);
            if (validCallees.length === 0) {
                this.logger.error(`Cannot save recording to DB: no valid callees found. calleeIds=${rec.calleeIds.join(', ')}`);
                return null;
            }

            const callerName = `${caller.firstName ?? ''} ${caller.lastName ?? ''}`.trim() || caller.email || 'Unknown';

            const validCalleeIds = validCallees.map(c => c.id);
            const primaryCalleeId = validCalleeIds[0];
            const calleeIdsJson = JSON.stringify(validCalleeIds);

            const existing = await this.prisma.recording.findFirst({
                where: { egressId: rec.egressId },
                include: { participants: true }
            });

            let videoStats = null;
            let videoDuration = 0;

            if (existing) {
                await this.prisma.recordingParticipant.deleteMany({
                    where: { recordingId: existing.id }
                });

                if (rec.videoFilePath && fs.existsSync(rec.videoFilePath)) {
                    videoStats = fs.statSync(rec.videoFilePath);
                    videoDuration = await this.calculateDurationFromFile(rec.videoFilePath);
                }

                const participantIds = new Set([rec.callerId, ...validCalleeIds]);

                await this.prisma.recordingParticipant.deleteMany({
                    where: { recordingId: existing.id }
                });

                const participantsToCreate = Array.from(participantIds).map(userId => ({
                    userId,
                    role: userId === rec.callerId ? 'caller' : 'callee'
                }));

                const updateData = {
                    callee: { connect: { id: primaryCalleeId } },
                    duration: duration > 0 ? duration : existing.duration,
                    size: stats.size,
                    fileFormat: rec.filePath.split('.').pop() || 'mp4',
                    videoFilename: rec.videoFilename || null,
                    videoPath: rec.videoFilePath || null,
                    videoEgressId: rec.videoEgressId || null,
                    videoSize: videoStats ? videoStats.size : null,
                    videoDuration: videoDuration > 0 ? videoDuration : null,
                    upgradedToVideo: rec.upgradedToVideo || false,
                    participants: {
                        create: participantsToCreate
                    }
                };

                await this.prisma.recording.update({
                    where: { id: existing.id },
                    data: updateData as any,
                });
                this.completedEgressIds.add(currentEgressId);
                return existing.id;
            }

            if (!existing) {
                if (rec.videoFilePath && fs.existsSync(rec.videoFilePath)) {
                    videoStats = fs.statSync(rec.videoFilePath);
                    videoDuration = await this.calculateDurationFromFile(rec.videoFilePath);
                }
            }

            const createParticipantIds = new Set([rec.callerId, ...validCalleeIds]);
            const createParticipants = Array.from(createParticipantIds).map(userId => ({
                userId,
                role: userId === rec.callerId ? 'caller' : 'callee'
            }));

            const createData = {
                filename: rec.filename,
                path: rec.filePath,
                size: stats.size,
                duration: duration > 0 ? duration : 0,
                roomId: rec.roomId,
                egressId: rec.egressId,
                caller: { connect: { id: rec.callerId } },
                callee: { connect: { id: primaryCalleeId } },
                recordingType: rec.recordingType as RecordingType,
                fileFormat: rec.filePath.split('.').pop() || 'mp4',
                videoFilename: rec.videoFilename || undefined,
                videoPath: rec.videoFilePath || undefined,
                videoEgressId: rec.videoEgressId || undefined,
                videoSize: videoStats ? videoStats.size : undefined,
                videoDuration: videoDuration > 0 ? videoDuration : undefined,
                upgradedToVideo: rec.upgradedToVideo || false,
                participants: {
                    create: createParticipants
                }
            };

            const recording = await this.prisma.recording.create({
                data: createData as any,
            });

            this.completedEgressIds.add(currentEgressId);
            return recording.id;
        } catch (error) {
            this.logger.error(`Failed to persist recording to DB: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Update an existing recording record with video metadata (called when video stops mid-call)
     */
    private async updateRecordingWithVideoData(rec: ActiveRecording): Promise<void> {
        try {
            if (!rec.videoEgressId || !rec.videoFilePath || !rec.videoFilename) {
                return;
            }

            const maxWaitMs = 15000;
            const pollMs = 1000;
            const deadline = Date.now() + maxWaitMs;

            while (Date.now() < deadline && !fs.existsSync(rec.videoFilePath)) {
                await new Promise((r) => setTimeout(r, pollMs));
            }

            if (!fs.existsSync(rec.videoFilePath)) {
                this.logger.error(`Video file not found for update: ${rec.videoFilePath}`);
                return;
            }

            const stats = fs.statSync(rec.videoFilePath);
            const duration = await this.calculateDurationFromFile(rec.videoFilePath);

            const existing = await this.prisma.recording.findFirst({
                where: { roomId: rec.roomId, egressId: rec.egressId },
            });

            if (existing) {
                await this.prisma.recording.update({
                    where: { id: existing.id },
                    data: {
                        videoFilename: rec.videoFilename,
                        videoPath: rec.videoFilePath,
                        videoEgressId: rec.videoEgressId,
                        videoSize: stats.size,
                        videoDuration: duration > 0 ? duration : null,
                    } as any,
                });
            } else {
                this.logger.warn(`Could not find existing record for room ${rec.roomId} to add video data`);
            }
        } catch (error) {
            this.logger.error(`Failed to update recording with video data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Trigger post-call transcription as a background job
     */
    private async triggerPostCallTranscription(recordingId: string, filePath: string): Promise<void> {
        if (!this.transcriptionService) {
            this.logger.warn(`TranscriptionService not available, skipping post-call transcription for ${recordingId}`);
            return;
        }

        try {
            const recording = await this.prisma.recording.findUnique({
                where: { id: recordingId }
            });

            const isUpgraded = (recording as any)?.upgradedToVideo || false;
            const isVideoType = recording?.recordingType === 'VIDEO';
            const shouldKeepVideo = isUpgraded || isVideoType;

            let finalTranscriptionPath = filePath;

            if (filePath.endsWith('.mp4')) {
                const audioPath = await this.extractAudioFromVideo(filePath);
                if (audioPath) {
                    finalTranscriptionPath = audioPath;
                    try {
                        const stats = fs.statSync(audioPath);
                        const updateData: any = {
                            path: audioPath,
                            filename: path.basename(audioPath),
                            size: stats.size,
                            fileFormat: 'mp3',
                        };

                        if (shouldKeepVideo) {
                            updateData.videoPath = filePath;
                            updateData.videoFilename = path.basename(filePath);
                            updateData.videoSize = fs.statSync(filePath).size;
                        } else {
                            updateData.videoPath = null;
                            updateData.videoFilename = null;
                            updateData.videoSize = null;
                            updateData.videoDuration = null;
                            updateData.videoEgressId = null;

                            try {
                                if (fs.existsSync(filePath)) {
                                    fs.unlinkSync(filePath);
                                }
                            } catch (unlinkError) {
                                this.logger.error(`Failed to delete original video file: ${unlinkError}`);
                            }
                        }

                        await this.prisma.recording.update({
                            where: { id: recordingId },
                            data: updateData
                        });
                    } catch (dbError) {
                        this.logger.error(`Failed to update recording with audio path: ${dbError}`);
                    }
                }
            }

            await this.transcriptionService.runPostCallTranscription(recordingId, finalTranscriptionPath);
        } catch (error) {
            this.logger.error(`Failed to run post-call transcription for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extracts audio from a video file using ffmpeg
     */
    private async extractAudioFromVideo(videoPath: string): Promise<string | null> {
        try {
            if (!await this.waitForFileStability(videoPath)) {
                return null;
            }

            const audioPath = videoPath.replace('.mp4', '.mp3');

            if (fs.existsSync(audioPath)) {
                return audioPath;
            }

            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .toFormat('mp3')
                    .audioBitrate('128k')
                    .on('end', () => {
                        resolve(audioPath);
                    })
                    .on('error', (err) => {
                        this.logger.error(`FFmpeg error extracting audio: ${err.message}`);
                        resolve(null);
                    })
                    .save(audioPath);
            });
        } catch (error) {
            this.logger.error(`Error in extractAudioFromVideo: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Helper to wait until a file's size stops changing (finalization)
     */
    private async waitForFileStability(filePath: string, maxWaitMs: number = 30000): Promise<boolean> {
        const pollMs = 1000;
        const deadline = Date.now() + maxWaitMs;
        let lastSize = -1;
        let stableCount = 0;

        while (Date.now() < deadline && !fs.existsSync(filePath)) {
            await new Promise(r => setTimeout(r, pollMs));
        }

        if (!fs.existsSync(filePath)) return false;

        while (Date.now() < deadline) {
            try {
                const stats = fs.statSync(filePath);
                if (stats.size > 0 && stats.size === lastSize) {
                    stableCount++;
                    if (stableCount >= 3) return true; // Stable for 3 seconds
                } else {
                    stableCount = 0;
                    lastSize = stats.size;
                }
            } catch (e) {
                return false;
            }
            await new Promise(r => setTimeout(r, pollMs));
        }
        return lastSize > 0;
    }

    /**
     * Handle egress webhook completion (called when LiveKit finishes encoding the recording)
     */
    async handleEgressCompleted(egressId: string, egressInfo?: EgressInfo): Promise<void> {
        try {

            // 1. Try to find in active recordings map (recording still in progress or just stopped)
            let activeRecording = Array.from(this.activeRecordings.values()).find(
                (rec) => rec.egressId === egressId
            );

            // 2. If not found in map (maybe stopRecording already cleared it), look in DB for the pending record
            if (!activeRecording) {
                this.logger.debug(`Egress ${egressId} not found in active recordings map, checking DB...`);
                const dbRec = await (this.prisma.recording as any).findFirst({
                    where: {
                        OR: [
                            { egressId },
                            { videoEgressId: egressId }
                        ]
                    },
                    include: { participants: true }
                });

                if (dbRec) {
                    activeRecording = {
                        egressId: dbRec.egressId!,
                        roomId: dbRec.roomId,
                        callerId: dbRec.callerId,
                        calleeIds: (dbRec as any).participants
                            .filter((p: any) => p.role === 'callee')
                            .map((p: any) => p.userId),
                        recordingType: dbRec.recordingType as 'AUDIO' | 'VIDEO',
                        startTime: dbRec.createdAt.getTime(),
                        filename: dbRec.filename,
                        filePath: dbRec.path,
                    };
                    this.logger.debug(`Reconstructed active recording from DB for egress ${egressId}`);
                }
            }

            if (!activeRecording) {
                this.logger.warn(`No active recording or DB record found for egress: ${egressId}`);
                return;
            }


            const recordingId = await this.persistRecordingToDb(activeRecording, egressId);

            if (recordingId) {
                if (egressId === activeRecording.egressId) {
                    this.triggerPostCallTranscription(recordingId, activeRecording.filePath).catch(error => {
                        this.logger.error(`Failed to trigger post-call transcription for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
                    });
                }
            }

            this.activeRecordings.delete(activeRecording.roomId);
        } catch (error) {
            this.logger.error(
                `Error handling egress completion: ${error instanceof Error ? error.message : String(error)}`
            );
            if (error instanceof Error && error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
        }
    }

    /**
     * Update callees for an active recording when someone joins the room
     */
    async updateRecordingCallees(roomId: string, allParticipantIds: string[], callerId: string): Promise<void> {
        try {
            const activeRecording = this.activeRecordings.get(roomId);
            if (!activeRecording) {
                this.logger.debug(`No active recording found for room ${roomId}, skipping callee update`);
                return;
            }

            const calleeIds = allParticipantIds
                .filter(id => id !== callerId && !id.startsWith('EG_'));
            activeRecording.calleeIds = calleeIds;


            const existing = await this.prisma.recording.findFirst({
                where: { egressId: activeRecording.egressId }
            });

            if (existing) {
                const primaryCalleeId = calleeIds.length > 0 ? calleeIds[0] : (existing as any).calleeId;

                await this.prisma.recordingParticipant.deleteMany({
                    where: { recordingId: existing.id }
                });

                await this.prisma.recording.update({
                    where: { id: existing.id },
                    data: {
                        callee: { connect: { id: primaryCalleeId } },
                        participants: {
                            create: [
                                { userId: callerId, role: 'caller' },
                                ...calleeIds.map(id => ({ userId: id, role: 'callee' }))
                            ]
                        }
                    } as any,
                });
            }
        } catch (error) {
            this.logger.error(`Error updating recording callees: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get all recordings with user names
     * @param userId - Current user ID for filtering
     * @param userRole - Current user role for access control
     */
    async getRecordings(userId?: string, userRole?: string, query: RecordingQueryDto = {}): Promise<{ recordings: RecordingFile[], total: number }> {
        try {
            const { limit = 20, offset = 0, status, callerId, calleeId, search } = query;
            const isAdminOrRCC = userRole === 'ADMIN' || userRole === 'RCC';

            const where: Prisma.RecordingWhereInput = {
                deletedAt: null,
            };

            // Access control: Non-admins only see recordings they are part of
            if (!isAdminOrRCC && userId) {
                where.participants = {
                    some: { userId: userId }
                };
            }

            // Filters
            if (callerId) {
                where.callerId = callerId;
            }

            if (calleeId) {
                // If calleeId is provided, ensure they are a participant with 'callee' role
                where.participants = {
                    some: {
                        userId: calleeId,
                        role: 'callee'
                    }
                };
            }

            if (status) {
                where.transcripts = {
                    some: {
                        status: status as any
                    }
                };
            }

            if (search) {
                where.OR = [
                    { filename: { contains: search, mode: 'insensitive' } },
                    { caller: { firstName: { contains: search, mode: 'insensitive' } } },
                    { caller: { lastName: { contains: search, mode: 'insensitive' } } },
                    { participants: { some: { user: { firstName: { contains: search, mode: 'insensitive' } } } } },
                    { participants: { some: { user: { lastName: { contains: search, mode: 'insensitive' } } } } },
                ];
            }

            const [total, allRecordings] = await Promise.all([
                this.prisma.recording.count({ where }),
                this.prisma.recording.findMany({
                    where,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: limit,
                    skip: offset,
                    include: {
                        caller: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    }
                                }
                            }
                        },
                        transcripts: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 1,
                            select: {
                                status: true
                            }
                        }
                    } as any,
                })
            ]);

            const mappedRecordings = (allRecordings as any[]).map((rec: any) => {
                const callerName = rec.caller
                    ? (`${rec.caller.firstName ?? ''} ${rec.caller.lastName ?? ''}`.trim() || rec.caller.email || undefined)
                    : undefined;

                const calleeParticipants = rec.participants.filter((p: any) => p.role === 'callee');
                const calleeIds = calleeParticipants.map((p: any) => p.userId);
                const calleeNames = calleeParticipants
                    .map((p: any) => {
                        if (p.user) {
                            const name = `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim();
                            return name || p.user.email || p.userId; // Fallback to email or ID
                        }
                        return p.userId;
                    })
                    .filter((name: any): name is string => !!name);

                const recordingUrl = `${this.baseUrl}/api/v1/recordings/${rec.filename}`;

                const transcriptionStatus = rec.transcripts?.[0]?.status as any;

                return {
                    id: rec.id,
                    filename: rec.filename,
                    path: recordingUrl,
                    size: rec.size,
                    createdAt: rec.createdAt,
                    roomId: rec.roomId,
                    callerId: rec.callerId,
                    calleeId: calleeIds.length === 1 ? calleeIds[0] : calleeIds,
                    recordingType: rec.recordingType as RecordingType,
                    duration: rec.duration ?? 0,
                    callerName,
                    calleeNames: calleeNames,
                    transcriptionStatus: transcriptionStatus || null,
                    videoFilename: rec.videoFilename || undefined,
                    upgradedToVideo: (rec as any).upgradedToVideo || false,
                };
            });

            return {
                recordings: mappedRecordings,
                total
            };
        } catch (error) {
            this.logger.error('Error listing recordings from DB', error);
            return {
                recordings: [],
                total: 0
            };
        }
    }

    /**
     * Get recording file path
     */
    getRecordingPath(filename: string): string {
        const safeFilename = path.basename(filename);
        return path.join(this.recordingsDir, safeFilename);
    }

    /**
     * Get caller ID for an active recording (used by main.ts Socket.IO handlers)
     */
    getCallerIdForRoom(roomId: string): string | null {
        const activeRecording = this.activeRecordings.get(roomId);
        return activeRecording?.callerId || null;
    }

    /**
     * Soft delete a recording
     */
    async deleteRecording(id: string): Promise<void> {
        const recording = await this.prisma.recording.findUnique({
            where: { id },
        });

        if (!recording) {
            throw new Error('Recording not found');
        }

        if (recording.deletedAt) {
            throw new Error('Recording already deleted');
        }

        await this.prisma.recording.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        this.logger.log(`Recording ${id} soft deleted`);
    }
}
