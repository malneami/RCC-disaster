import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from '@mui/material';
import { Hospital } from '../../../services/hospitalService';

interface HospitalMapProps {
  hospitals: Hospital[];
}

const HospitalMap: React.FC<HospitalMapProps> = ({ hospitals }) => {
  const hospitalsWithCoordinates = hospitals.filter(
    hospital => hospital.latitude && hospital.longitude
  );

  const getAvailabilityPercentage = (hospital: Hospital) => {
    const totalBeds = (hospital.icuBeds || 0) + (hospital.picuBeds || 0) + 
                     (hospital.maleBeds || 0) + (hospital.femaleBeds || 0) + 
                     (hospital.pediatricBeds || 0) + (hospital.standardBeds || 0) + 
                     (hospital.nicuBeds || 0);
    const availableBeds = (hospital.icuBedsAvailable || 0) + (hospital.picuBedsAvailable || 0) + 
                         (hospital.maleBedsAvailable || 0) + (hospital.femaleBedsAvailable || 0) + 
                         (hospital.pediatricBedsAvailable || 0) + (hospital.standardBedsAvailable || 0) + 
                         (hospital.nicuBedsAvailable || 0);
    return totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0;
  };

  const getAvailabilityColor = (hospital: Hospital) => {
    const percentage = getAvailabilityPercentage(hospital);
    if (percentage <= 10) return '#f44336'; // Critical
    if (percentage <= 25) return '#ff9800'; // Warning
    return '#4caf50'; // Good
  };

  const getTotalBeds = (hospital: Hospital) => {
    return (hospital.icuBeds || 0) + (hospital.picuBeds || 0) + 
           (hospital.maleBeds || 0) + (hospital.femaleBeds || 0) + 
           (hospital.pediatricBeds || 0) + (hospital.standardBeds || 0) + 
           (hospital.nicuBeds || 0);
  };

  const getAvailableBeds = (hospital: Hospital) => {
    return (hospital.icuBedsAvailable || 0) + (hospital.picuBedsAvailable || 0) + 
           (hospital.maleBedsAvailable || 0) + (hospital.femaleBedsAvailable || 0) + 
           (hospital.pediatricBedsAvailable || 0) + (hospital.standardBedsAvailable || 0) + 
           (hospital.nicuBedsAvailable || 0);
  };

  if (hospitalsWithCoordinates.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hospitals with coordinates available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add latitude and longitude coordinates to hospitals to display them on the map
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Hospital Network Map
      </Typography>
      
      <Card>
        <CardContent>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '600px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {/* Map placeholder - in a real implementation, you would use a mapping library like Leaflet or Google Maps */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h5" color="text.secondary">
                Interactive Map View
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                This would display an interactive map with hospital locations.<br />
                Each hospital would be represented by a marker with color coding based on capacity status.
              </Typography>
              
              {/* Legend */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  backgroundColor: 'white',
                  padding: 2,
                  borderRadius: 1,
                  boxShadow: 2,
                  minWidth: 200,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Legend
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#4caf50',
                      }}
                    />
                    <Typography variant="body2">Available ({'>'}25% capacity)</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#ff9800',
                      }}
                    />
                    <Typography variant="body2">Limited (10-25% capacity)</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#f44336',
                      }}
                    />
                    <Typography variant="body2">Critical (≤10% capacity)</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#9e9e9e',
                      }}
                    />
                    <Typography variant="body2">Offline</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Hospital markers simulation */}
              {hospitalsWithCoordinates.map((hospital, index) => (
                <Tooltip
                  key={hospital.id}
                  title={
                    <Box>
                      <Typography variant="subtitle2">{hospital.name}</Typography>
                      <Typography variant="body2">
                        {getAvailableBeds(hospital)}/{getTotalBeds(hospital)} beds available
                      </Typography>
                      <Typography variant="body2">
                        Status: {hospital.status}
                      </Typography>
                      <Typography variant="body2">
                        Cluster: {hospital.cluster}
                      </Typography>
                      {hospital.address && (
                        <Typography variant="body2">
                          {hospital.address}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${20 + (index % 5) * 15}%`,
                      top: `${20 + Math.floor(index / 5) * 15}%`,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: getAvailabilityColor(hospital),
                      border: '2px solid white',
                      boxShadow: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Hospital list for reference */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Hospitals with Coordinates ({hospitalsWithCoordinates.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {hospitalsWithCoordinates.map((hospital) => {
            const totalBeds = getTotalBeds(hospital);
            const availableBeds = getAvailableBeds(hospital);
            const percentage = getAvailabilityPercentage(hospital);
            
            return (
              <Chip
                key={hospital.id}
                label={`${hospital.name} (${availableBeds}/${totalBeds})`}
                color={
                  percentage <= 10 ? 'error' : percentage <= 25 ? 'warning' : 'success'
                }
                variant="outlined"
                size="small"
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default HospitalMap;
