import React from 'react';
import {
    Grid,
    Typography,
    Autocomplete,
    TextField,
    CircularProgress,
    Box,
} from '@mui/material';
import { AmbulanceRecommendation } from '../types/recommendations';

interface ManualSelectionSectionProps {
    recommendations: AmbulanceRecommendation[];
    selectedAmbulanceRec: AmbulanceRecommendation | undefined;
    onAmbulanceChange: (newValue: AmbulanceRecommendation | null) => void;
    loading: boolean;
    allDrivers: any[];
    selectedDriverId: string | null;
    onDriverChange: (newValue: any | null) => void;
}

const ManualSelectionSection: React.FC<ManualSelectionSectionProps> = ({
    recommendations,
    selectedAmbulanceRec,
    onAmbulanceChange,
    loading,
    allDrivers,
    selectedDriverId,
    onDriverChange,
}) => {
    return (
        <>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Manual Selection</Typography>
                <Autocomplete
                    options={recommendations}
                    getOptionLabel={(option) => `${option.ambulance.callSign} - ${option.ambulance.plateNumber}`}
                    value={selectedAmbulanceRec || null}
                    onChange={(_, newValue) => onAmbulanceChange(newValue)}
                    loading={loading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Ambulance"
                            size="small"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props}>
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {option.ambulance.callSign}
                                    </Typography>
                                    {option.etaToOrigin !== null && option.etaToOrigin !== undefined && (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Box sx={{
                                                bgcolor: option.etaToOrigin < 10 ? 'error.lighter' : option.etaToOrigin < 20 ? 'warning.lighter' : 'success.lighter',
                                                color: option.etaToOrigin < 10 ? 'error.main' : option.etaToOrigin < 20 ? 'warning.main' : 'success.main',
                                                px: 1,
                                                py: 0.2,
                                                borderRadius: 1,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5
                                            }}>
                                                <span>Pickup:</span>
                                                {option.etaToOrigin} min
                                            </Box>

                                            {option.etaToDestination !== null && (
                                                <Box sx={{
                                                    bgcolor: 'grey.100',
                                                    color: 'text.secondary',
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'medium',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}>
                                                    <span>Dropoff:</span>
                                                    {option.etaToDestination} min
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.ambulance.plateNumber} • {option.ambulance.status}
                                    </Typography>
                                    {option.distanceKm !== null && option.distanceKm !== undefined && (
                                        <Typography variant="caption" color="text.secondary">
                                            Distance to Pickup: <strong>{option.distanceKm.toFixed(1)} km</strong>
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </li>
                    )}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Driver (Optional)</Typography>
                <Autocomplete
                    options={allDrivers}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    value={allDrivers.find(d => d.id === selectedDriverId) || null}
                    onChange={(_, newValue) => onDriverChange(newValue)}
                    loading={loading}
                    noOptionsText={loading ? "Loading drivers..." : "No drivers available"}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Driver"
                            size="small"
                            placeholder="Optional"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            </Grid>
        </>
    );
};

export default ManualSelectionSection;
