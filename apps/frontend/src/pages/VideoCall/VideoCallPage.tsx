import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { useVideoCallSocket } from '../../contexts/VideoCallSocketContext';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { UserList } from './components/UserList';
import { User } from './utils/videoCallUtils';

/**
 * Video Call Page - User list and call initiation interface
 * The actual video call UI is rendered in PersistentCallPanel
 */
const VideoCallPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { connectionError } = useVideoCallSocket();
  const { startCall, inviteMode, setInviteMode, liveKitToken } = useVideoCall();

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users/for-communication?page=1&limit=100');
        const allUsers = response.data.data || [];
        const otherUsers = allUsers.filter((u: User) => u.id !== currentUser?.id);
        setUsers(otherUsers);
      } catch (error) {
        enqueueSnackbar('Failed to load users', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchUsers();
  }, [currentUser, enqueueSnackbar]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (liveKitToken) {
    return null;
  }

  return (
    <Box sx={{ p: 3, height: '100%', position: 'relative' }}>
      {!liveKitToken && (
        <>
          <Typography variant="h4" gutterBottom>
            Communication
          </Typography>

          {connectionError && (
            <Alert severity="error" sx={{ mb: 2 }}>{connectionError}</Alert>
          )}

          <Box>
            <UserList
              users={users}
              callUser={(user: User | undefined) => user && startCall(user)}
              stream={null}
              socket={null}
            />
          </Box>
        </>
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteMode} onClose={() => setInviteMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Invite Participant
            <IconButton onClick={() => setInviteMode(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <UserList
            users={users}
            callUser={(user: User | undefined) => {
              if (user) {
                startCall(user);
                setInviteMode(false);
              }
            }}
            stream={null}
            socket={null}
            actionLabel="Invite"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VideoCallPage;
