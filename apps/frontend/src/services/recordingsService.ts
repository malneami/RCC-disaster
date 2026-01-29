import apiClient from './apiClient';

export interface Recording {
    id: string;
    filename: string;
    path: string; // URL to the recording file
    size: number;
    createdAt: string;
    roomId: string;
    callerId: string;
    calleeId: string | string[]; // Support single or multiple callees
    recordingType: 'AUDIO' | 'VIDEO';
    duration: number;
    callerName?: string;
    calleeNames?: string[]; // Array of callee names
    transcriptionStatus?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null;
}

export interface RecordingTranscriptSegment {
    id: string;
    transcriptId: string;
    speakerUserId?: string | null;
    speakerLabel?: string | null;
    startMs: number;
    endMs: number;
    text: string;
    confidence?: number | null;
    isFinal: boolean;
    createdAt: string;
}

export interface RecordingTranscript {
    id: string;
    recordingId?: string | null;
    roomId: string;
    provider: 'GCP' | 'ARAZN' | string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    languageCode: string;
    fullText?: string | null;
    errorMessage?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    segments: RecordingTranscriptSegment[];
}

export interface PaginatedRecordings {
    recordings: Recording[];
    total: number;
}

export const recordingsService = {
    getAll: async (params?: {
        limit?: number;
        offset?: number;
        status?: string;
        callerId?: string;
        calleeId?: string;
        search?: string;
    }) => {
        const response = await apiClient.get<PaginatedRecordings>('/recordings', { params });
        return response.data;
    },

    getTranscript: async (recordingId: string) => {
        const response = await apiClient.get<RecordingTranscript>(`/recordings/${recordingId}/transcript`);
        return response.data;
    },

    runTranscript: async (recordingId: string) => {
        const response = await apiClient.post<{ success: boolean }>(`/recordings/${recordingId}/transcript/run`);
        return response.data;
    },

    getStreamUrl: (filename: string) => {
        // Construct full URL manually since media elements need absolute URL
        const baseURL = apiClient.defaults.baseURL;
        return `${baseURL}/recordings/${filename}`;
    },

    getDownloadUrl: (filename: string) => {
        const baseURL = apiClient.defaults.baseURL;
        return `${baseURL}/recordings/${filename}/download`;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/recordings/${id}`);
        return response.data;
    },
};

