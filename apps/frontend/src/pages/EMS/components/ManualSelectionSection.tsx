import React from 'react';
import {
    Grid,
    Typography,
    Autocomplete,
    TextField,
    CircularProgress,
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
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Driver (Optional)</Typography>
                <Autocomplete
                    options={allDrivers}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    value={allDrivers.find(d => d.id === selectedDriverId) || null}
                    onChange={(_, newValue) => onDriverChange(newValue)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Driver"
                            size="small"
                            placeholder="Optional"
                        />
                    )}
                />
            </Grid>
        </>
    );
};

export default ManualSelectionSection;
