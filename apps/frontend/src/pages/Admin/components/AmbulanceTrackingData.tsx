import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { useAmbulances } from '../../EMS/hooks/useAmbulances';
import { Ambulance } from '../../EMS/types/ems';
import { emsService } from '../../EMS/services/emsService';
import GPSLocationDialog from './GPSLocationDialog';
import AmbulanceTrackingTable from './AmbulanceTrackingTable';

const AmbulanceTrackingData: React.FC = () => {
  const { ambulances, isLoading, error } = useAmbulances();
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [gpsData, setGpsData] = useState<any>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleViewGPS = async (ambulance: Ambulance) => {
    setSelectedAmbulance(ambulance);
    setGpsDialogOpen(true);
    setLoadingGPS(true);
    setGpsError(null);
    setGpsData(null);

    try {
      const allGPSData = await emsService.getAmbulancesGPS();
      
      // Find the GPS data for this specific ambulance by IMEI
      if (allGPSData?.data && Array.isArray(allGPSData.data)) {
        const ambulanceGPS = allGPSData.data.find((item: any) => item.imei === ambulance.vehicleImei);
        if (ambulanceGPS) {
          setGpsData(ambulanceGPS);
        } else {
          setGpsError('No GPS data found for this ambulance');
        }
      } else {
        setGpsError('Invalid GPS data format');
      }
    } catch (error: any) {
      console.error('Failed to fetch GPS data:', error);
      setGpsError(error.response?.data?.message || 'Failed to fetch GPS location data');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleCloseGPSDialog = () => {
    setGpsDialogOpen(false);
    setSelectedAmbulance(null);
    setGpsData(null);
    setGpsError(null);
  };

  const filteredAmbulances = useMemo(() => {
    if (!ambulances) return [];
    
    const query = searchQuery.toLowerCase();
    return ambulances.filter((ambulance: Ambulance) => {
      return (
        ambulance.callSign.toLowerCase().includes(query) ||
        ambulance.plateNumber.toLowerCase().includes(query) ||
        ambulance.vehicleImei.toLowerCase().includes(query) ||
        ambulance.driver?.firstName.toLowerCase().includes(query) ||
        ambulance.driver?.lastName.toLowerCase().includes(query)
      );
    });
  }, [ambulances, searchQuery]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load ambulances data. Please try again later.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Ambulance Tracking Data
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search by call sign, plate number, IMEI, or driver name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faSearch} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {filteredAmbulances.length === 0 ? (
          <Box textAlign="center" py={4}>
            <FontAwesomeIcon 
              icon={faAmbulance} 
              style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }}
            />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No ambulances found matching your search.' : 'No ambulances found.'}
            </Typography>
          </Box>
        ) : (
          <AmbulanceTrackingTable
            ambulances={filteredAmbulances}
            onViewGPS={handleViewGPS}
          />
        )}

        {filteredAmbulances.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Showing {filteredAmbulances.length} of {ambulances?.length || 0} ambulances
          </Typography>
        )}
      </CardContent>

      {/* GPS Location Dialog */}
      <GPSLocationDialog
        open={gpsDialogOpen}
        onClose={handleCloseGPSDialog}
        ambulance={selectedAmbulance}
        gpsData={gpsData}
        loadingGPS={loadingGPS}
        gpsError={gpsError}
      />
    </Card>
  );
};

export default AmbulanceTrackingData;

