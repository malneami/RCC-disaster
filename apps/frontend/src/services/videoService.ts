import { apiClient } from './apiClient';

export interface VideoTokenResponse {
  token: string;
}

export const videoService = {
  /**
   * Get a LiveKit access token for a specific room
   * Retry logic is handled by React Query in useVideoCallToken hook
   */
  async getToken(roomId: string): Promise<string> {
    const response = await apiClient.post<VideoTokenResponse>('/video-calls/token', { roomId });
    return response.data.token;
  },
};
