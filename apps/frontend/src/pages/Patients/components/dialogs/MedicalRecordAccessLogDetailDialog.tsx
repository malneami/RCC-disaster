import React from 'react';
import { Dialog, Box, Typography, IconButton, DialogContent, Avatar, Chip, Grid, DialogActions, Button } from '@mui/material';
import { Close, Person, Email, Badge, Computer } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { MedicalRecordAccessLog } from './MedicalRecordAccessLogsTab';
import { GRADIENT_COLORS, getAccessTypeGradient, getAccessTypeColor } from '../access-logs/AccessLogConstants';
import { getAccessTypeIcon } from '../access-logs/AccessLogUtils';
import { alpha } from '@mui/material/styles';

interface MedicalRecordAccessLogDetailDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLog: MedicalRecordAccessLog | null;
}

const MedicalRecordAccessLogDetailDialog: React.FC<MedicalRecordAccessLogDetailDialogProps> = ({ open, onClose, selectedLog }) => {
  if (!selectedLog) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box
        sx={{
          background: GRADIENT_COLORS.primary,
          padding: '20px 24px',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1.25rem' }}>
            Access Log Details
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#ffffff',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Box>
          <Box
            sx={{
              background: getAccessTypeGradient(selectedLog.accessType),
              borderRadius: '16px',
              padding: '24px',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              boxShadow: `0 4px 16px ${getAccessTypeColor(selectedLog.accessType)}40`,
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: 'rgba(255, 255, 255, 0.3)',
                fontSize: '2rem',
                fontWeight: 700,
                border: '3px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              {getAccessTypeIcon(selectedLog.accessType)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Chip
                label={selectedLog.accessType}
                size="medium"
                icon={getAccessTypeIcon(selectedLog.accessType)}
                sx={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  height: '32px',
                  mb: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                {format(new Date(selectedLog.timestamp), 'PPpp')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                {formatDistanceToNow(new Date(selectedLog.timestamp), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '2px solid rgba(66, 165, 245, 0.4)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: GRADIENT_COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person sx={{ color: '#ffffff', fontSize: '20px' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    User Information
                  </Typography>
                </Box>
                {selectedLog.user ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, background: GRADIENT_COLORS.primary, fontSize: '1.4rem', fontWeight: 700 }}>
                        {selectedLog.user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        {selectedLog.user.lastName?.charAt(0)?.toUpperCase() || ''}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5, fontSize: '1.125rem' }}>
                          {selectedLog.user.firstName} {selectedLog.user.lastName}
                        </Typography>
                        <Chip label={selectedLog.user.role} size="small" sx={{ background: alpha('#42a5f5', 0.12), color: '#42a5f5', fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Email sx={{ fontSize: '18px', color: '#42a5f5' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
                            {selectedLog.user.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Badge sx={{ fontSize: '18px', color: '#42a5f5' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>
                            User ID
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
                            {selectedLog.user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                    No user information available
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(66, 165, 245, 0.25)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2 }}>
                  Access Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(66, 165, 245, 0.2)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Computer sx={{ fontSize: '20px', color: '#42a5f5' }} />
                        <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 500 }}>
                          Access Method
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#424242', fontWeight: 600, fontSize: '0.9375rem' }}>
                        {selectedLog.accessMethod}
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedLog.ipAddress && (
                    <Grid item xs={12}>
                      <Box sx={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(66, 165, 245, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Computer sx={{ fontSize: '20px', color: '#42a5f5' }} />
                          <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 500 }}>
                            IP Address
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#424242', fontWeight: 600, fontSize: '0.9375rem' }}>
                          {selectedLog.ipAddress}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>

            {selectedLog.reason && (
              <Grid item xs={12}>
                <Box sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(66, 165, 245, 0.25)' }}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                    Reason
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#424242', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                    {selectedLog.reason}
                  </Typography>
                </Box>
              </Grid>
            )}

            {selectedLog.userAgent && (
              <Grid item xs={12}>
                <Box sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(66, 165, 245, 0.25)' }}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: GRADIENT_COLORS.primary,
            color: '#ffffff',
            borderRadius: '12px',
            padding: '8px 24px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
              boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicalRecordAccessLogDetailDialog;

