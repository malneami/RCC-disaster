import React, { useState, useCallback } from 'react';
import { Box, Card, CardContent, Button, Typography } from '@mui/material';
import { Videocam } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { disasterService } from '../../../../services/disasterService';
import { LiveKitCallInterface } from '../../../VideoCall/components/LiveKitCallInterface';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

interface CommandRoomVideoPanelProps {
  incidentId: string;
  theme: ReturnType<typeof getTheme>;
  enabled: boolean;
}

export const CommandRoomVideoPanel: React.FC<CommandRoomVideoPanelProps> = ({
  incidentId,
  theme,
  enabled,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!incidentId || !enabled) return;
    setLoading(true);
    try {
      const { token: newToken } = await disasterService.getCommandRoomVideoToken(incidentId);
      setToken(newToken);
      enqueueSnackbar('Joined war room call', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to join war room call',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  }, [incidentId, enabled, enqueueSnackbar]);

  const handleDisconnected = useCallback(() => {
    setToken(null);
    enqueueSnackbar('Left war room call', { variant: 'info' });
  }, [enqueueSnackbar]);

  if (!enabled) return null;

  const roomId = `command-room:${incidentId}`;

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Videocam sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            War Room Call
          </Typography>
        </Box>
        {!token ? (
          <Button
            variant="contained"
            startIcon={<Videocam />}
            disabled={loading}
            onClick={handleJoin}
            sx={{
              bgcolor: theme.primary,
              '&:hover': { bgcolor: theme.gradientStart },
            }}
          >
            {loading ? 'Joining…' : 'Join War Room Call'}
          </Button>
        ) : (
          <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <LiveKitCallInterface
              token={token}
              serverUrl={LIVEKIT_URL}
              roomId={roomId}
              onDisconnected={handleDisconnected}
              onInviteUser={() => {}}
              height="400px"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
