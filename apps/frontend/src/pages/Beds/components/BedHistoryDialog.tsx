import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { History as HistoryIcon } from '@mui/icons-material';
import { BedStatusHistoryItem } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';
import { getBedStatusColor } from '../utils/bedStatusUtils';
import { useBedHistory } from '../hooks/useBedHistory';
import { useBed } from '../hooks/useBed';

interface BedHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  bedId: string | null;
}

const BedHistoryDialog: React.FC<BedHistoryDialogProps> = ({
  open,
  onClose,
  bedId,
}) => {
  const { bed, loading: bedLoading } = useBed(bedId);
  const { history, loading, error, refetch } = useBedHistory(bedId, open && !!bedId);

  useEffect(() => {
    if (open && bedId) {
      refetch();
    }
  }, [open, bedId, refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (user: BedStatusHistoryItem['changedBy']) => {
    return `${user.firstName} ${user.lastName}`;
  };

  if (!bedId) return null;

  if (bedLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!bed) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon color="primary" />
          <Box>
            <Typography variant="h6" component="span" sx={{ color: '#1976d2', fontWeight: 600 }}>
              Bed History - {bed.bedNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {bed.unit.name} • {bed.hospital.name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No status history available for this bed.
            </Typography>
          </Box>
        ) : (
          <Timeline sx={{ mt: 2 }}>
            {history.map((item, index) => (
              <TimelineItem key={item.id}>
                <TimelineSeparator>
                  <TimelineDot
                    sx={{
                      bgcolor: getBedStatusColor(item.newStatus),
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px ' + getBedStatusColor(item.newStatus),
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'white',
                      }}
                    />
                  </TimelineDot>
                  {index < history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 3 }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {item.previousStatus ? (
                        <>
                          <BedStatusChip status={item.previousStatus} />
                          <Typography variant="body2" color="text.secondary">
                            →
                          </Typography>
                        </>
                      ) : null}
                      <BedStatusChip status={item.newStatus} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatDate(item.changedAt)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Changed by: <strong>{getUserName(item.changedBy)}</strong>
                    </Typography>
                    {item.reason && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reason:
                        </Typography>
                        <Typography variant="body2">{item.reason}</Typography>
                      </Box>
                    )}
                    {item.notes && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notes:
                        </Typography>
                        <Typography variant="body2">{item.notes}</Typography>
                      </Box>
                    )}
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BedHistoryDialog;

