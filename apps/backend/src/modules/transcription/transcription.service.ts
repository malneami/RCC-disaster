import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as speech from '@google-cloud/speech';
import axios from 'axios';
import { Prisma, TranscriptProvider, TranscriptStatus } from '@prisma/client';
import { RecordingsService } from '../recordings/recordings.service';

/**
 * Interface for transcription provider results
 */
export interface TranscriptionResult {
    fullText: string;
    segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
    startMs: number;
    endMs: number;
    text: string;
    speakerLabel: string | null;
    confidence: number | null;
    isFinal: boolean;
    speakerUserId?: string | null; // Optional for batch
}

export interface LiveTranscriptionResult {
    text: string;
    isFinal: boolean;
    confidence?: number;
    language?: string;
}

export interface TranscriptionProvider {
    type: TranscriptProvider;
    initializeStream(
        roomId: string,
        participantId: string,
        language?: string,
    ): Promise<void>;
    processAudioChunk(
        roomId: string,
        participantId: string,
        audioData: ArrayBuffer | string,
    ): Promise<LiveTranscriptionResult | null>;
    closeStream(roomId: string, participantId: string): Promise<void>;
    transcribeRecording(
        recordingId: string,
        filePath: string,
        language?: string,
    ): Promise<TranscriptionResult>;
}

/**
 * GCP Speech-to-Text provider (streaming + batch)
 */
class GcpSpeechTranscriber implements TranscriptionProvider {
    public readonly type: TranscriptProvider = TranscriptProvider.GCP;
    private readonly logger = new Logger(GcpSpeechTranscriber.name);
    private speechClient?: speech.SpeechClient;
    private activeStreams = new Map<string, any>();

    constructor() {
        try {
            this.speechClient = new speech.SpeechClient();
        } catch (error) {
            this.logger.warn('Failed to initialize Speech client. Transcription will not work.', error as Error);
        }
    }

    async initializeStream(roomId: string, participantId: string, language: string = 'en-US') {
        const streamKey = `${roomId}-${participantId}`;

        if (this.activeStreams.has(streamKey)) {
            return;
        }

        try {
            if (!this.speechClient) {
                this.logger.warn(`Speech client not initialized, skipping stream initialization for ${streamKey}`);
                return;
            }

            const request: speech.protos.google.cloud.speech.v1.IStreamingRecognitionConfig = {
                config: {
                    encoding: 'LINEAR16' as unknown as speech.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
                    sampleRateHertz: 16000,
                    languageCode: language,
                    enableAutomaticPunctuation: true,
                    model: 'default',
                    useEnhanced: true,
                },
                interimResults: true,
            };

            const recognizeStream = this.speechClient
                .streamingRecognize(request)
                .on('error', (error) => {
                    this.logger.error(`Stream error for ${streamKey}:`, error);
                    this.activeStreams.delete(streamKey);
                })
                .on('data', (data) => {
                    // This will be handled by the gateway
                });

            this.activeStreams.set(streamKey, {
                stream: recognizeStream,
                lastActivity: Date.now(),
            });

        } catch (error) {
            this.logger.error(`Error initializing stream for ${streamKey}:`, error);
            throw error;
        }
    }

    async processAudioChunk(
        roomId: string,
        participantId: string,
        audioData: ArrayBuffer | string,
    ): Promise<LiveTranscriptionResult | null> {
        if (!this.speechClient) {
            return null;
        }

        const streamKey = `${roomId}-${participantId}`;
        const streamData = this.activeStreams.get(streamKey);

        if (!streamData) {
            return null;
        }

        try {
            let audioBuffer: Buffer;
            if (typeof audioData === 'string') {
                audioBuffer = Buffer.from(audioData, 'base64');
            } else {
                audioBuffer = Buffer.from(audioData);
            }

            streamData.stream.write(audioBuffer);
            streamData.lastActivity = Date.now();

            return new Promise((resolve) => {
                const dataHandler = (data: any) => {
                    if (data.results[0] && data.results[0].alternatives[0]) {
                        const result = data.results[0];
                        const alternative = result.alternatives[0];

                        const transcriptionResult: LiveTranscriptionResult = {
                            text: alternative.transcript,
                            isFinal: result.isFinal || false,
                            confidence: alternative.confidence,
                            language: data.results[0].languageCode,
                        };

                        streamData.stream.removeListener('data', dataHandler);
                        resolve(transcriptionResult);
                    }
                };

                streamData.stream.once('data', dataHandler);

                setTimeout(() => {
                    streamData.stream.removeListener('data', dataHandler);
                    resolve(null);
                }, 2000);
            });
        } catch (error) {
            this.logger.error(`Error processing audio chunk for ${streamKey}:`, error);
            return null;
        }
    }

    async closeStream(roomId: string, participantId: string) {
        const streamKey = `${roomId}-${participantId}`;
        const streamData = this.activeStreams.get(streamKey);

        if (streamData) {
            try {
                streamData.stream.end();
                this.activeStreams.delete(streamKey);
            } catch (error) {
                this.logger.error(`Error closing stream for ${streamKey}:`, error);
            }
        }
    }

    /**
     * Clean up inactive streams (call periodically)
     */
    cleanupInactiveStreams(maxInactiveMs: number = 300000) {
        const now = Date.now();
        const toDelete: string[] = [];

        this.activeStreams.forEach((streamData, key) => {
            if (now - streamData.lastActivity > maxInactiveMs) {
                toDelete.push(key);
            }
        });

        toDelete.forEach((key) => {
            const streamData = this.activeStreams.get(key);
            if (streamData) {
                streamData.stream.end();
                this.activeStreams.delete(key);
            }
        });
    }

    /**
     * Batch transcription for a saved recording file.
     * NOTE: This is a simplified implementation using longRunningRecognize.
     */
    async transcribeRecording(
        recordingId: string,
        filePath: string,
        language: string = 'en-US',
    ): Promise<TranscriptionResult> {
        if (!this.speechClient) {
            this.logger.warn('Speech client not initialized, cannot run batch transcription');
            return { fullText: '', segments: [] };
        }

        const fs = await import('fs');
        if (!fs.existsSync(filePath)) {
            this.logger.warn(`Recording file not found for transcription: ${filePath}`);
            return { fullText: '', segments: [] };
        }

        const file = fs.readFileSync(filePath);
        const audioBytes = file.toString('base64');

        const request: speech.protos.google.cloud.speech.v1.ILongRunningRecognizeRequest = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'LINEAR16' as unknown as speech.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
                sampleRateHertz: 16000,
                languageCode: language,
                enableAutomaticPunctuation: true,
                model: 'default',
                useEnhanced: true,
            },
        };

        const [operation] = await this.speechClient.longRunningRecognize(request);
        const [response] = await operation.promise();

        const segments: TranscriptionSegment[] = [];
        const allTexts: string[] = [];

        let lastEndTimeMs = 0;
        (response.results || []).forEach((result) => {
            const alternative = result.alternatives && result.alternatives[0];
            if (!alternative) return;

            const endTimeSeconds = Number(result.resultEndTime?.seconds || 0);
            const endTimeNanos = Number(result.resultEndTime?.nanos || 0);
            const currentEndTimeMs = (endTimeSeconds * 1000) + Math.round(endTimeNanos / 1000000);

            const transcription: TranscriptionSegment = {
                text: alternative.transcript || '',
                isFinal: true,
                confidence: alternative.confidence ?? null,
                startMs: lastEndTimeMs,
                endMs: currentEndTimeMs,
                speakerLabel: null, // GCP batch doesn't provide speaker labels directly
            };
            segments.push(transcription);
            allTexts.push(alternative.transcript || '');
            lastEndTimeMs = currentEndTimeMs;
        });

        return {
            fullText: allTexts.join(' ').trim(),
            segments,
        };
    }
}

/**
 * Arazn-LLM HTTP provider for batch transcription.
 * Uses the arazn-llm service via multipart file upload.
 * Live streaming support can be added later via socket connection.
 */
class AraznHttpTranscriber implements TranscriptionProvider {
    public readonly type: TranscriptProvider = TranscriptProvider.ARAZN;
    private readonly logger = new Logger(AraznHttpTranscriber.name);
    private readonly araznUrl: string;
    private readonly araznApiKey?: string;
    private activeStreams = new Map<string, any>();
    private streamBuffers = new Map<string, Buffer[]>();

    constructor(araznUrl?: string, araznApiKey?: string) {
        const rawUrl = araznUrl || process.env.ARAZN_TRANSCRIBER_URL || 'http://localhost:8888';
        this.araznUrl = rawUrl.replace(/\/$/, '');
        this.araznApiKey = araznApiKey || process.env.ARAZN_TRANSCRIBER_API_KEY;
    }

    async initializeStream(roomId: string, participantId: string, _language?: string): Promise<void> {
        const streamKey = `${roomId}-${participantId}`;

        if (this.activeStreams.has(streamKey)) {
            this.logger.warn(`Stream already exists for ${streamKey}`);
            return;
        }

        // Socket-based streaming would be implemented here
        // For now, we'll log and skip live streaming
        this.logger.warn(`Arazn live streaming not yet implemented for ${streamKey}`);
        this.activeStreams.set(streamKey, { lastActivity: Date.now() });
    }

    async processAudioChunk(
        roomId: string,
        participantId: string,
        audioData: ArrayBuffer | string,
    ): Promise<LiveTranscriptionResult | null> {
        const streamKey = `${roomId}-${participantId}`;

        if (!this.activeStreams.has(streamKey)) {
            this.logger.warn(`No active stream for ${streamKey}`);
            return null;
        }

        const streamData = this.activeStreams.get(streamKey);
        if (streamData) {
            streamData.lastActivity = Date.now();
        }

        try {
            let buffer: Buffer;
            if (typeof audioData === 'string') {
                buffer = Buffer.from(audioData, 'base64');
            } else {
                buffer = Buffer.from(audioData);
            }

            if (!this.streamBuffers.has(streamKey)) {
                this.streamBuffers.set(streamKey, []);
            }
            const currentChunks = this.streamBuffers.get(streamKey)!;
            currentChunks.push(buffer);

            const totalSize = currentChunks.reduce((acc, chunk) => acc + chunk.length, 0);

            if (totalSize < 96000) {
                return null;
            }

            const fullBuffer = Buffer.concat(currentChunks);
            this.streamBuffers.set(streamKey, []);

            const formData = new (require('form-data'))();
            formData.append('file', fullBuffer, { filename: 'chunk.wav', contentType: 'audio/wav' });

            const response = await axios.post(`${this.araznUrl}/transcribe`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    ...(this.araznApiKey ? { 'X-API-Key': this.araznApiKey } : {}),
                },
                timeout: 30000,
            });

            if (response.data && response.data.transcription) {
                return {
                    text: response.data.transcription,
                    isFinal: true,
                    language: 'ar-EG',
                };
            }
            return null;
        } catch (error) {
            this.logger.error(`Arazn real-time transcription error: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    async closeStream(roomId: string, participantId: string): Promise<void> {
        const streamKey = `${roomId}-${participantId}`;
        this.activeStreams.delete(streamKey);
        this.streamBuffers.delete(streamKey);
    }

    /**
     * Batch transcription using Arazn HTTP API with support for large files via chunking.
     */
    async transcribeRecording(
        recordingId: string,
        filePath: string,
        language: string = 'en-US',
    ): Promise<TranscriptionResult> {
        try {
            if (!fs.existsSync(filePath)) {
                return { fullText: '', segments: [] };
            }

            const stats = fs.statSync(filePath);
            const durationSeconds = await this.getAudioDuration(filePath);

            // Revised chunking strategy:
            // 1. If duration detection failed but file is > 100KB, assume it needs chunking.
            // 2. If duration is > 30s, chunk it.
            // 3. The 100KB threshold ensures that even slightly long recordings (which Arazn handles slowly) are split.
            const shouldChunk = durationSeconds >= 30 || (durationSeconds === 0 && stats.size > 100 * 1024);

            if (!shouldChunk) {
                return await this.transcribeSingleFile(recordingId, filePath);
            }

            const chunkDuration = 30;
            const chunks = await this.splitAudioIntoChunks(filePath, chunkDuration);

            const allSegments: TranscriptionSegment[] = [];
            let fullText = '';
            const maxRetries = 5;

            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = chunks[i];
                const startTimeOffsetMs = i * chunkDuration * 1000;

                let result: TranscriptionResult | null = null;
                let lastError = null;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        result = await this.transcribeSingleFile(recordingId, chunkPath);
                        break; // Success, exit retry loop
                    } catch (error) {
                        lastError = error;
                        if (attempt < maxRetries) {
                            const waitTime = attempt * 2000; // 2s, 4s backoff
                            this.logger.warn(`Chunk ${i + 1}/${chunks.length} failed (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${waitTime}ms...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            this.logger.error(`Chunk ${i + 1}/${chunks.length} failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }
                }

                if (result && result.fullText) {
                    fullText += (fullText ? ' ' : '') + result.fullText;

                    const adjustedSegments = result.segments.map(s => ({
                        ...s,
                        startMs: s.startMs + startTimeOffsetMs,
                        endMs: s.endMs + startTimeOffsetMs,
                    }));
                    allSegments.push(...adjustedSegments);
                } else if (!result) {
                    this.logger.error(`Skipping chunk ${i + 1}/${chunks.length} - all retry attempts failed`);
                }

                try { fs.unlinkSync(chunkPath); } catch (e) { }
            }

            return {
                fullText,
                segments: allSegments,
            };
        } catch (error) {
            this.logger.error(`Arazn HTTP transcription error for ${recordingId}: ${error instanceof Error ? error.message : String(error)}`);
            return { fullText: '', segments: [] };
        }
    }

    private async transcribeSingleFile(
        recordingId: string,
        filePath: string
    ): Promise<TranscriptionResult> {
        const fileBuffer = fs.readFileSync(filePath);
        const FormData = require('form-data');
        const formData = new FormData();

        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'audio/wav';
        if (ext === '.mp3') contentType = 'audio/mpeg';
        else if (ext === '.ogg') contentType = 'audio/ogg';
        else if (ext === '.m4a') contentType = 'audio/mp4';

        formData.append('file', fileBuffer, {
            filename: path.basename(filePath),
            contentType: contentType,
        });


        try {
            const response = await axios.post(`${this.araznUrl}/transcribe`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    ...(this.araznApiKey ? { 'X-API-Key': this.araznApiKey } : {}),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000,
            });

            if (response.data && response.data.transcription) {
                const text = response.data.transcription;
                return {
                    fullText: text,
                    segments: [
                        {
                            text: text,
                            startMs: 0,
                            endMs: 0,
                            isFinal: true,
                            confidence: 1.0,
                            speakerLabel: null,
                        },
                    ],
                };
            }

            throw new Error('Arazn server returned empty transcription');
        } catch (error) {
            throw error;
        }
    }

    private async getAudioDuration(filePath: string): Promise<number> {
        const ffmpeg = require('fluent-ffmpeg');
        try {
            const ffmpegPath = require('ffmpeg-static');
            const ffprobePath = require('ffprobe-static').path;
            ffmpeg.setFfmpegPath(ffmpegPath);
            ffmpeg.setFfprobePath(ffprobePath);
        } catch (e) {
            this.logger.warn(`Failed to set static ffmpeg/ffprobe paths: ${e}`);
        }

        return new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
                if (err) {
                    this.logger.warn(`ffprobe failed for ${filePath}: ${err.message}. Duration assuming 0.`);
                    return resolve(0);
                }
                const duration = metadata.format.duration || 0;
                resolve(duration);
            });
        });
    }

    private async splitAudioIntoChunks(filePath: string, chunkDurationSeconds: number): Promise<string[]> {
        const ffmpeg = require('fluent-ffmpeg');
        try {
            const ffmpegPath = require('ffmpeg-static');
            ffmpeg.setFfmpegPath(ffmpegPath);
        } catch (e) {
            this.logger.warn(`Failed to set static ffmpeg path: ${e}`);
        }

        const tempDir = os.tmpdir();
        const baseName = path.basename(filePath, path.extname(filePath));

        return new Promise((resolve, reject) => {
            const outputPattern = path.join(tempDir, `${baseName}_chunk_%03d${path.extname(filePath)}`);

            ffmpeg(filePath)
                .outputOptions([
                    `-f segment`,
                    `-segment_time ${chunkDurationSeconds}`,
                    `-reset_timestamps 1`
                ])
                .output(outputPattern)
                .on('end', () => {
                    const files = fs.readdirSync(tempDir)
                        .filter((f: string) => f.startsWith(`${baseName}_chunk_`))
                        .map((f: string) => path.join(tempDir, f))
                        .sort();
                    resolve(files);
                })
                .on('error', (err: Error) => {
                    this.logger.error(`Error splitting audio: ${err.message}`);
                    reject(err);
                })
                .run();
        });
    }
}

@Injectable()
export class TranscriptionService implements OnModuleInit {
    private readonly logger = new Logger(TranscriptionService.name);
    private provider!: TranscriptionProvider;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        @Inject(forwardRef(() => RecordingsService))
        private recordingsService: RecordingsService,
    ) { }

    onModuleInit() {
        const providerName = (this.configService.get<string>('TRANSCRIBER_PROVIDER') || 'gcp').toLowerCase();
        if (providerName === 'arazn') {
            const araznUrl = this.configService.get<string>('ARAZN_TRANSCRIBER_URL');
            const araznApiKey = this.configService.get<string>('ARAZN_TRANSCRIBER_API_KEY');
            this.provider = new AraznHttpTranscriber(araznUrl, araznApiKey);
        } else {
            this.provider = new GcpSpeechTranscriber();
        }
    }

    getProviderType(): TranscriptProvider {
        const config = this.configService.get('TRANSCRIBER_PROVIDER') || 'GCP';
        return config.toUpperCase() === 'GCP' ? TranscriptProvider.GCP : TranscriptProvider.ARAZN;
    }

    async initializeStream(roomId: string, participantId: string, language: string = 'en-US') {
        await this.provider.initializeStream(roomId, participantId, language);
    }

    /**
     * Process audio chunk and return transcription (delegates to provider)
     */
    async processAudioChunk(
        roomId: string,
        participantId: string,
        audioData: ArrayBuffer | string,
    ): Promise<LiveTranscriptionResult | null> {
        return this.provider.processAudioChunk(roomId, participantId, audioData);
    }

    /**
     * Close transcription stream for a participant (delegates to provider)
     */
    async closeStream(roomId: string, participantId: string) {
        await this.provider.closeStream(roomId, participantId);
    }

    /**
     * Persist a live transcription segment to the database, linked by roomId.
     * recordingId will be backfilled later when the recording row exists.
     */
    async saveLiveTranscriptionSegment(params: {
        roomId: string;
        participantId: string;
        participantName: string;
        text: string;
        isFinal: boolean;
        confidence?: number;
        language?: string;
    }) {
        const {
            roomId,
            participantId,
            participantName,
            text,
            isFinal,
            confidence,
            language,
        } = params;

        const provider = this.getProviderType();

        const whereInput: Prisma.RecordingTranscriptWhereInput = {
            roomId: roomId,
            provider: provider,
            deletedAt: null
        };

        let transcript = await this.prisma.recordingTranscript.findFirst({
            where: whereInput,
        });

        if (!transcript) {
            const createData: Prisma.RecordingTranscriptCreateInput = {
                roomId,
                provider,
                status: TranscriptStatus.PENDING,
                languageCode: '',
            };

            transcript = await this.prisma.recordingTranscript.create({
                data: createData,
            });
        }

        const now = Date.now();

        await this.prisma.recordingTranscriptSegment.create({
            data: {
                transcriptId: transcript.id,
                speakerUserId: participantId,
                speakerLabel: participantName,
                startMs: now,
                endMs: now,
                text,
                confidence: confidence ?? null,
                isFinal,
            },
        });
    }

    /**
     * Trigger batch transcription for a completed recording.
     * This runs in-process and updates RecordingTranscript/segments.
     */
    async runPostCallTranscription(recordingId: string, filePath: string, language: string = 'en-US') {
        const provider = this.getProviderType();

        const whereInput: Prisma.RecordingTranscriptWhereInput = {
            recordingId,
            provider,
            deletedAt: null
        };

        let transcript = await this.prisma.recordingTranscript.findFirst({
            where: whereInput,
        });

        if (!transcript) {
            const recording = await this.prisma.recording.findUnique({
                where: { id: recordingId },
            });

            if (recording) {
                const upsertData: Prisma.RecordingTranscriptUpdateInput = {
                    recording: { connect: { id: recordingId } },
                    roomId: recording.roomId,
                    provider: provider,
                    status: TranscriptStatus.PENDING,
                    languageCode: language,
                };

                const createData: Prisma.RecordingTranscriptCreateInput = {
                    roomId: recording.roomId,
                    recording: { connect: { id: recordingId } },
                    provider,
                    status: TranscriptStatus.PENDING,
                    languageCode: language,
                };

                transcript = await this.prisma.recordingTranscript.upsert({
                    where: {
                        id: 'dummy',
                    },
                    update: upsertData,
                    create: createData,
                });
            }
        }

        if (!transcript) {
            const createData: Prisma.RecordingTranscriptCreateInput = {
                roomId: '', // unknown room; should not normally happen
                recording: { connect: { id: recordingId } },
                provider,
                status: TranscriptStatus.PENDING,
                languageCode: language,
            };

            transcript = await this.prisma.recordingTranscript.create({
                data: createData,
            });
        }

        const runningUpdate: Prisma.RecordingTranscriptUpdateInput = {
            status: TranscriptStatus.RUNNING,
            startedAt: new Date(),
            errorMessage: null,
        };

        transcript = await this.prisma.recordingTranscript.update({
            where: { id: transcript.id },
            data: runningUpdate,
        });

        try {
            const result = await this.provider.transcribeRecording(recordingId, filePath, language);

            await this.prisma.recordingTranscriptSegment.deleteMany({
                where: { transcriptId: transcript.id },
            });

            if (result.segments.length > 0) {
                const segmentData: Prisma.RecordingTranscriptSegmentCreateManyInput[] = result.segments.map((s) => ({
                    transcriptId: transcript!.id,
                    speakerUserId: null,
                    speakerLabel: null,
                    startMs: s.startMs,
                    endMs: s.endMs,
                    text: s.text,
                    confidence: s.confidence ?? null,
                    isFinal: s.isFinal,
                }));

                await this.prisma.recordingTranscriptSegment.createMany({
                    data: segmentData,
                });
            }

            const completedUpdate: Prisma.RecordingTranscriptUpdateInput = {
                status: TranscriptStatus.COMPLETED,
                completedAt: new Date(),
                fullText: result.fullText,
            };

            await this.prisma.recordingTranscript.update({
                where: { id: transcript.id },
                data: completedUpdate,
            });
        } catch (error) {
            this.logger.error(`Post-call transcription failed for recording ${recordingId}`, error as Error);
            const failedUpdate: Prisma.RecordingTranscriptUpdateInput = {
                status: TranscriptStatus.FAILED,
                errorMessage: error instanceof Error ? error.message : String(error),
                completedAt: new Date(),
            };

            await this.prisma.recordingTranscript.update({
                where: { id: transcript.id },
                data: failedUpdate,
            });
        }
    }

    /**
     * Fetch transcript with segments for a given recording.
     */
    async getTranscriptForRecording(recordingId: string) {
        const provider = this.getProviderType();
        const transcript = await this.prisma.recordingTranscript.findFirst({
            where: {
                recordingId,
                provider,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                segments: {
                    orderBy: {
                        startMs: 'asc',
                    },
                },
            },
        });

        return transcript;
    }
}