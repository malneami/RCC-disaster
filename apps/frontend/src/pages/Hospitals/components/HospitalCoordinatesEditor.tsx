import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { hospitalService, Hospital } from '../../../services/hospitalService';

interface HospitalCoordinatesEditorProps {
  hospital: Hospital;
  onHospitalUpdate: (updatedHospital: Hospital) => void;
}

const HospitalCoordinatesEditor: React.FC<HospitalCoordinatesEditorProps> = ({
  hospital,
  onHospitalUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [coordinates, setCoordinates] = useState({
    latitude: hospital.latitude || '',
    longitude: hospital.longitude || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCoordinates({
      latitude: hospital.latitude || '',
      longitude: hospital.longitude || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate coordinates
      const lat = parseFloat(coordinates.latitude.toString());
      const lng = parseFloat(coordinates.longitude.toString());

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Please enter valid numeric coordinates');
      }

      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }

      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }

      // Update hospital coordinates
      const updatedHospital = await hospitalService.updateHospital(hospital.id, {
        latitude: lat,
        longitude: lng,
      });

      onHospitalUpdate(updatedHospital);
      setIsEditing(false);
      setSuccess('Hospital coordinates updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update hospital coordinates');
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    setCoordinates(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setLoading(false);
      },
      (error) => {
        setError(`Failed to get current location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const formatCoordinate = (coord: number | string | undefined) => {
    if (coord === null || coord === undefined || coord === '') {
      return 'Not set';
    }
    return `${coord}°`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon color="primary" />
            <Typography variant="h6" component="h3">
              Hospital Coordinates
            </Typography>
          </Box>
          
          {!isEditing && (
            <Tooltip title="Edit coordinates">
              <IconButton onClick={handleEdit} color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {isEditing ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={coordinates.latitude}
                  onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  inputProps={{
                    step: '0.000001',
                    min: '-90',
                    max: '90',
                  }}
                  helperText="Range: -90 to 90 degrees"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={coordinates.longitude}
                  onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  inputProps={{
                    step: '0.000001',
                    min: '-180',
                    max: '180',
                  }}
                  helperText="Range: -180 to 180 degrees"
                />
              </Grid>
            </Grid>

            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={getCurrentLocation}
                disabled={loading}
              >
                Use Current Location
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                Save Coordinates
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Latitude
                  </Typography>
                  <Typography variant="h6" component="div">
                    {formatCoordinate(hospital.latitude)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Longitude
                  </Typography>
                  <Typography variant="h6" component="div">
                    {formatCoordinate(hospital.longitude)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {hospital.latitude && hospital.longitude && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Location Preview
                </Typography>
                <Typography variant="body2">
                  {hospital.latitude}, {hospital.longitude}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HospitalCoordinatesEditor;
