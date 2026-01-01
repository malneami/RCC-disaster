import React, { useState, useMemo, useEffect } from 'react';
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
  faSatelliteDish,
} from '@fortawesome/free-solid-svg-icons';
import { emsService } from '../../EMS/services/emsService';
import GPSLocationDialog from './GPSLocationDialog';
import AmbulanceTrackingTable from './AmbulanceTrackingTable';
import '../styles/ambulance-tracking.css';

interface GPSAmbulance {
  imei: string;
  name?: string;
  callSign?: string; // From database ambulances
  [key: string]: any;
}

const AmbulanceTrackingData: React.FC = () => {
  const [ambulances, setAmbulances] = useState<GPSAmbulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<GPSAmbulance | null>(null);
  const [gpsData, setGpsData] = useState<any>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGPSData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allGPSData = await emsService.getAmbulancesGPS();

        // Extract array of GPS data from API response
        if (allGPSData?.data && Array.isArray(allGPSData.data)) {
          // Deduplicate by IMEI - keep the first occurrence (external API data takes priority)
          const uniqueAmbulances = allGPSData.data.reduce((acc: GPSAmbulance[], current: GPSAmbulance) => {
            const exists = acc.find(item => item.imei === current.imei);
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, []);
          console.log(`Loaded ${allGPSData.data.length} ambulances, ${uniqueAmbulances.length} unique`);
          setAmbulances(uniqueAmbulances);
        } else {
          setError('Invalid GPS data format');
        }
      } catch (error: any) {
        console.error('Failed to fetch GPS data:', error);
        setError(error.response?.data?.message || 'Failed to fetch GPS data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGPSData();
  }, []);

  const handleViewGPS = async (ambulance: GPSAmbulance) => {
    setSelectedAmbulance(ambulance);
    setGpsDialogOpen(true);
    setLoadingGPS(true);
    setGpsError(null);
    setGpsData(null);

    try {
      // GPS data is already fetched, just use it
      setGpsData(ambulance);
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
    console.log('=== FILTER DEBUG ===');
    console.log('searchQuery:', JSON.stringify(searchQuery));
    console.log('ambulances count:', ambulances?.length || 0);

    if (!ambulances || ambulances.length === 0) {
      console.log('No ambulances, returning empty array');
      return [];
    }

    // If no search query, return all ambulances
    if (!searchQuery.trim()) {
      console.log('Empty search query, returning all ambulances:', ambulances.length);
      return ambulances;
    }

    const query = searchQuery.toLowerCase().trim();
    console.log('Searching for:', query);

    const results = ambulances.filter((ambulance: GPSAmbulance) => {
      // Check IMEI
      const imeiMatch = ambulance.imei?.toLowerCase().includes(query);
      // Check name (from external GPS API)
      const nameMatch = ambulance.name?.toLowerCase().includes(query);
      // Check callSign (from database ambulances)
      const callSignMatch = ambulance.callSign?.toLowerCase().includes(query);

      return imeiMatch || nameMatch || callSignMatch;
    });

    console.log('Filtered results count:', results.length);
    return results;
  }, [ambulances, searchQuery]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        gap={3}
      >
        <CircularProgress
          size={48}
          thickness={4}
          sx={{ color: '#0056b3' }}
        />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Loading ambulance tracking data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: 3,
          py: 2,
          '& .MuiAlert-message': { fontWeight: 500 }
        }}
      >
        Failed to load ambulances data. Please try again later.
      </Alert>
    );
  }

  return (
    <Card className="ambulance-tracking-card" elevation={0}>
      <CardContent>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0056b3 0%, #003d80 100%)',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0, 86, 179, 0.25)',
              }}
            >
              <FontAwesomeIcon icon={faSatelliteDish} style={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1f2937',
                  letterSpacing: '-0.02em',
                }}
              >
                Ambulance Tracking Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time GPS tracking and vehicle monitoring
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by IMEI or vehicle name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ambulance-search-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ color: '#9ca3af', fontSize: 16 }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 4,
            '& .MuiOutlinedInput-root': {
              py: 0.5,
              fontSize: '0.9375rem',
            },
            '& .MuiOutlinedInput-input': {
              py: 1.75,
            }
          }}
        />

        {/* Content */}
        {filteredAmbulances.length === 0 ? (
          <Box className="empty-state">
            <Box className="empty-state-icon">
              <FontAwesomeIcon
                icon={faAmbulance}
                style={{ fontSize: 32 }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#374151',
                mb: 1
              }}
            >
              No Ambulances Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? 'No ambulances match your search criteria. Try adjusting your search.'
                : 'No ambulances are currently being tracked.'}
            </Typography>
          </Box>
        ) : (
          <AmbulanceTrackingTable
            ambulances={filteredAmbulances}
            onViewGPS={handleViewGPS}
          />
        )}

        {/* Results Counter */}
        {filteredAmbulances.length > 0 && (
          <Box className="results-counter" sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
              Showing <strong style={{ color: '#0056b3' }}>{filteredAmbulances.length}</strong> of{' '}
              <strong>{ambulances?.length || 0}</strong> vehicles
            </Typography>
          </Box>
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
