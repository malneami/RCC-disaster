import { useMutation } from 'react-query';
import { videoService } from '../../../services/videoService';

/**
 * Hook for fetching LiveKit tokens with React Query
 * Provides loading, error, and success states automatically
 */
export const useVideoCallToken = () => {
  return useMutation(
    (roomId: string) => videoService.getToken(roomId),
    {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};
