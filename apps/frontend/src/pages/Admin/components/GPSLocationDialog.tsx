import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLocationArrow,
  faTimes,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';

interface GPSAmbulance {
  imei: string;
  name?: string;
  [key: string]: any;
}

interface GPSLocationDialogProps {
  open: boolean;
  onClose: () => void;
  ambulance: GPSAmbulance | null;
  gpsData: any | null;
  loadingGPS: boolean;
  gpsError: string | null;
}

const GPSLocationDialog: React.FC<GPSLocationDialogProps> = ({
  open,
  onClose,
  ambulance,
  gpsData,
  loadingGPS,
  gpsError,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faLocationArrow} style={{ color: '#1976d2' }} />
            <Typography variant="h6">
              GPS Tracking Data
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            size="small"
          >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loadingGPS ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : gpsError ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {gpsError}
          </Alert>
        ) : gpsData ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Vehicle Information
            </Typography>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Name:</strong> {ambulance?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                <strong>IMEI:</strong> {ambulance?.imei}
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              GPS Coordinates
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {typeof gpsData.lat === 'number' ? gpsData.lat.toFixed(6) : gpsData.lat}, {typeof gpsData.lng === 'number' ? gpsData.lng.toFixed(6) : gpsData.lng}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Real-time location from TawasolMap GPS
              </Typography>
              {gpsData.lat && gpsData.lng && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${gpsData.lat},${gpsData.lng}`;
                    window.open(url, '_blank');
                  }}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  View on Google Maps
                </Button>
              )}
            </Box>

            {gpsData.speed !== undefined && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Speed:</strong> {gpsData.speed} km/h
                </Typography>
              </Box>
            )}

            {gpsData.direction !== undefined && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Direction:</strong> {gpsData.direction}°
                </Typography>
              </Box>
            )}

            {gpsData.timestamp && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Last Update:</strong> {new Date(gpsData.timestamp).toLocaleString()}
                </Typography>
              </Box>
            )}

            {gpsData && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>API Source:</strong> TawasolMap GPS (http://gps3.tawasolmap.com/new_api/)
                </Typography>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GPSLocationDialog;

