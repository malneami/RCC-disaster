import React from 'react';
import { Box, Paper, Typography, TextField, Grid, Card, CardContent, Button, Avatar, Chip, IconButton } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { User, getUserDisplayName, getUserInitials } from '../utils/videoCallUtils';

interface UserListProps {
  users: User[];
  emailToCall: string;
  setEmailToCall: (email: string) => void;
  callUser: (targetUser?: User, email?: string) => void;
  callUserByEmail: () => void;
  stream: MediaStream | null;
  socket: any;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  emailToCall,
  setEmailToCall,
  callUser,
  callUserByEmail,
  stream,
  socket,
}) => {
  return (
    <Box>
      {/* Email calling section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Call by Email
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            label="Email to call"
            variant="outlined"
            value={emailToCall}
            onChange={(e) => setEmailToCall(e.target.value)}
            placeholder="Enter email address"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                callUserByEmail();
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={callUserByEmail}
            disabled={!stream || !socket || !emailToCall.trim()}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
            }}
            size="large"
          >
            <PhoneIcon />
          </IconButton>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Or select from users
      </Typography>
      <Grid container spacing={2}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {getUserInitials(user)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {getUserDisplayName(user)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Chip label={user.role} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<PhoneIcon />}
                  onClick={() => callUser(user)}
                  disabled={!stream || !socket}
                >
                  Call
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
