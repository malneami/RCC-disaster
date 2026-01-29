import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EgressClient, RoomCompositeEgressRequest, EncodedFileOutput, EgressInfo } from 'livekit-server-sdk';
import * as ffmpeg from 'fluent-ffmpeg';
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
}

interface ActiveRecording {
    egressId: string;
    roomId: string;
    callerId: string;
    calleeIds: string[];
    recordingType: 'AUDIO' | 'VIDEO';
    startTime: number;
    filename: string;
    filePath: string;
}

@Injectable()
export class RecordingsService implements OnModuleInit {
    private readonly logger = new Logger(RecordingsService.name);
    private readonly recordingsDir = path.join(process.cwd(), 'uploads', 'recordings');
    private egressClient?: EgressClient;
    private activeRecordings = new Map<string, ActiveRecording>();
    private completedEgressIds = new Set<string>();
    private readonly baseUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        @Inject(forwardRef(() => TranscriptionService))
        private transcriptionService?: TranscriptionService,
    ) {
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
            this.egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
        }
    }

    onModuleInit() {
        this.ensureDirectoryExists();
    }

    private ensureDirectoryExists() {
        if (!fs.existsSync(this.recordingsDir)) {
            fs.mkdirSync(this.recordingsDir, { recursive: true });
        }

        // Fix permissions for LiveKit Egress (Docker container needs write access)
        try {
            if (process.platform === 'win32') {
                // Windows: Grant Everyone Full Control using icacls
                const { execSync } = require('child_process');
                // /T = recursive (though directory might be empty initially)
                // /Q = quiet
                execSync(`icacls "${this.recordingsDir}" /grant "Everyone:(OI)(CI)F" /T`, { stdio: 'ignore' });
            } else {
                // Linux/macOS: chmod 777 (read/write/execute for everyone)
                fs.chmodSync(this.recordingsDir, 0o777);
            }
        } catch (error) {
            this.logger.warn(`Failed to set permissions on recordings directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Start recording a call using LiveKit Egress
     * Ensures only one recording per room
     */
    async startRecording(
        roomId: string,
        callerId: string,
        calleeIds: string | string[],
        hasVideo: boolean = false
    ): Promise<string | null> {
        const calleeIdsArray = Array.isArray(calleeIds) ? calleeIds : [calleeIds];

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
                this.logger.warn(`Recording already in progress for room ${roomId} with egress ID: ${existingRecording.egressId}`);
                return existingRecording.egressId;
            }

            const recordingType = hasVideo ? 'VIDEO' as const : 'AUDIO' as const;
            const timestamp = Date.now();
            const filename = `${roomId}-${timestamp}.mp3`;
            const filePath = path.join(this.recordingsDir, filename);


            // Create egress request
            // Note: Egress runs in Docker with /out mounted to uploads/recordings
            // So we use the container path, not the host path
            const containerFilePath = `/out/${roomId}-${timestamp}.mp3`;

            const output = new EncodedFileOutput({
                filepath: containerFilePath,
                fileType: 3,
            });

            const egress = await this.egressClient.startRoomCompositeEgress(
                roomId,
                output,
                {
                    audioOnly: true,
                }
            );


            if (egress && egress.egressId) {
                // Track active recording - ONE PER ROOM
                this.activeRecordings.set(roomId, {
                    egressId: egress.egressId,
                    roomId,
                    callerId,
                    calleeIds: calleeIdsArray,
                    recordingType,
                    startTime: timestamp,
                    filename,
                    filePath,
                });

                // Create a PENDING recording row in the database immediately
                // This allows live transcripts to link to the recording before the file exists
                try {
                    await this.createPendingRecording({
                        egressId: egress.egressId,
                        roomId,
                        callerId,
                        calleeIds: calleeIdsArray,
                        recordingType,
                        filename,
                        filePath,
                    });
                } catch (dbError) {
                    this.logger.error(`Failed to create pending recording: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
                }

                return egress.egressId;
            } else {
                this.logger.error('Failed to start recording: no egress ID returned');
                return null;
            }
        } catch (error) {
            this.logger.error(`Error starting recording: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            return null;
        }
    }

    /**
     * Stop recording for a room
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

            if (allParticipantIds && callerId) {
                const calleeIds = allParticipantIds.filter(id => id !== callerId);
                activeRecording.calleeIds = calleeIds;
            }

            if (!this.egressClient) {
                this.logger.error('LiveKit Egress client not initialized');
                return;
            }

            await this.egressClient.stopEgress(activeRecording.egressId);

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
    private async calculateDurationFromFile(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                resolve(0);
                return;
            }

            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    this.logger.warn(`Failed to get duration from file ${filePath}: ${err.message}`);
                    resolve(0);
                    return;
                }

                const duration = metadata.format.duration;
                if (duration && !isNaN(duration)) {
                    resolve(Math.floor(duration * 1000));
                } else {
                    resolve(0);
                }
            });
        });
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

        const dataInput: Prisma.RecordingCreateInput = {
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
            participants: {
                create: [
                    { userId: data.callerId, role: 'caller' },
                    ...data.calleeIds.map(id => ({ userId: id, role: 'callee' }))
                ]
            }
        };

        await this.prisma.recording.create({
            data: dataInput,
        });
    }

    private async persistRecordingToDb(rec: ActiveRecording): Promise<string | null> {
        try {
            if (this.completedEgressIds.has(rec.egressId)) {
                return null;
            }
            const maxWaitMs = 30000;
            const pollMs = 1000;
            const deadline = Date.now() + maxWaitMs;

            while (Date.now() < deadline && !fs.existsSync(rec.filePath)) {
                await new Promise((r) => setTimeout(r, pollMs));
            }

            if (!fs.existsSync(rec.filePath)) {
                const files = fs.readdirSync(this.recordingsDir);
                const fallback = files.find((f) => f.includes(rec.roomId) && f.includes(String(rec.startTime)) && f.endsWith('.mp4'));
                if (fallback) {
                    rec.filename = fallback;
                    rec.filePath = path.join(this.recordingsDir, fallback);
                }
            }

            if (!fs.existsSync(rec.filePath)) {
                this.logger.error(`Recording file not found on disk for room ${rec.roomId}: ${rec.filePath}`);
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

            if (existing) {
                await this.prisma.recordingParticipant.deleteMany({
                    where: { recordingId: existing.id }
                });

                const updateData: Prisma.RecordingUpdateInput = {
                    callee: { connect: { id: primaryCalleeId } },
                    duration: duration > 0 ? duration : existing.duration,
                    size: stats.size,
                    participants: {
                        create: [
                            { userId: rec.callerId, role: 'caller' },
                            ...validCalleeIds.map(id => ({ userId: id, role: 'callee' }))
                        ]
                    }
                };

                await this.prisma.recording.update({
                    where: { id: existing.id },
                    data: updateData,
                });
                this.completedEgressIds.add(rec.egressId);
                return existing.id;
            }

            const createData: Prisma.RecordingCreateInput = {
                filename: rec.filename,
                path: rec.filePath,
                size: stats.size,
                duration: duration > 0 ? duration : 0,
                roomId: rec.roomId,
                egressId: rec.egressId,
                caller: { connect: { id: rec.callerId } },
                callee: { connect: { id: primaryCalleeId } },
                recordingType: rec.recordingType as RecordingType,
                fileFormat: 'mp3',
                participants: {
                    create: [
                        { userId: rec.callerId, role: 'caller' },
                        ...validCalleeIds.map(id => ({ userId: id, role: 'callee' }))
                    ]
                }
            };

            const recording = await this.prisma.recording.create({
                data: createData,
            });

            this.completedEgressIds.add(rec.egressId);
            return recording.id;
        } catch (error) {
            this.logger.error(`Failed to persist recording to DB: ${error instanceof Error ? error.message : String(error)}`);
            return null;
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
            await this.transcriptionService.runPostCallTranscription(recordingId, filePath);
        } catch (error) {
            this.logger.error(`Failed to run post-call transcription for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
        }
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
                const dbRec = await this.prisma.recording.findFirst({
                    where: { egressId },
                    include: { participants: true }
                });

                if (dbRec) {
                    activeRecording = {
                        egressId: dbRec.egressId!,
                        roomId: dbRec.roomId,
                        callerId: dbRec.callerId,
                        calleeIds: dbRec.participants
                            .filter(p => p.role === 'callee')
                            .map(p => p.userId),
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

            const recordingId = await this.persistRecordingToDb(activeRecording);

            if (recordingId) {
                this.triggerPostCallTranscription(recordingId, activeRecording.filePath).catch(error => {
                    this.logger.error(`Failed to trigger post-call transcription for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
                });
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

            const calleeIds = allParticipantIds.filter(id => id !== callerId);
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
