import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Divider,
  Chip,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { BedStatusChip } from './BedStatusChip';
import { useBed } from '../hooks/useBed';

interface ViewBedDialogProps {
  open: boolean;
  onClose: () => void;
  bedId: string | null;
}

const ViewBedDialog: React.FC<ViewBedDialogProps> = ({
  open,
  onClose,
  bedId,
}) => {
  const { bed, loading, error } = useBed(bedId);

  if (!bedId) return null;

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!bed) return null;

  const isOccupied = bed.status === 'OCCUPIED' && bed.currentPatient;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ color: '#1976d2', fontWeight: 600 }}>
            {bed.bedNumber}
          </Typography>
          <BedStatusChip status={bed.status} />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {isOccupied && bed.currentPatient && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                        Current Patient
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {bed.currentPatient.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {bed.currentPatient.nationalId && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          National ID
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {bed.currentPatient.nationalId}
                        </Typography>
                      </Grid>
                    )}
                    {bed.currentPatient.mrn && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          MRN
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {bed.currentPatient.mrn}
                        </Typography>
                      </Grid>
                    )}
                    {bed.currentPatient.age !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Age
                        </Typography>
                        <Typography variant="body1">
                          {bed.currentPatient.age} years
                        </Typography>
                      </Grid>
                    )}
                    {bed.currentPatient.gender && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Gender
                        </Typography>
                        <Typography variant="body1">
                          {bed.currentPatient.gender}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                  Bed Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Bed Number
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {bed.bedNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <BedStatusChip status={bed.status} />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {bed.location || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Operational Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={bed.isOperational ? 'Operational' : 'Not Operational'}
                        color={bed.isOperational ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                  Unit Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Unit Name
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {bed.unit.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Bed Type
                    </Typography>
                    <Typography variant="body1">
                      {bed.unit.bedType.replace(/_/g, ' ')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                  Hospital Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hospital Name
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {bed.hospital.name}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewBedDialog;
