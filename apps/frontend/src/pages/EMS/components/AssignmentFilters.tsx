
import React from 'react';
import {
    Box,
    Grid,
    MenuItem,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Chip,
    Typography,
    Autocomplete,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { AssignmentFilter } from '../types/ems';

interface AssignmentFiltersProps {
    open: boolean;
    onClose: () => void;
    filters: AssignmentFilter;
    onChange: (filters: AssignmentFilter) => void;
    ambulances: any[];
    drivers: any[];
}

const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
    open,
    onClose,
    filters,
    onChange,
    ambulances,
    drivers,
}) => {
    // Local state to handle changes before applying? 
    // The current implementation in parent updates immediately. 
    // If we want "Apply" button behavior, we need local state here or change parent.
    // For now, let's just style it to LOOK like PatientFilters but keep live update (or add local state if needed).
    // User asked for "design of the filters", typically implies the look & feel.

    // Actually, to support "Apply", we normally need local state. 
    // But since the parent controls it, I'll stick to the visual elements:

    const activeDataFilters = Object.entries(filters).filter(([key, value]) =>
        value !== undefined && value !== '' && key !== 'search'
    );
    const activeCount = activeDataFilters.length;

    const handleChange = (field: keyof AssignmentFilter, value: any) => {
        const newFilters = { ...filters, [field]: value };
        if (!value) delete newFilters[field];
        onChange(newFilters);
    };

    const handleClear = () => {
        onChange({});
    };

    if (!open) return null;

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                backgroundColor: '#fdfdfd',
                border: '1px solid #e0e0e0'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon color="primary" />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Filters</Typography>
                </Box>
                {activeCount > 0 && (
                    <Chip
                        label={`${activeCount} active`}
                        size="small"
                        color="primary"
                        onDelete={handleClear}
                    />
                )}
                <Button
                    size="small"
                    onClick={onClose}
                    sx={{ minWidth: 'auto', p: 0.5, ml: 1, color: 'text.secondary' }}
                >
                    <FilterIcon sx={{ transform: 'rotate(180deg)' }} fontSize="small" />
                </Button>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.status || ''}
                            label="Status"
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="EMS_CONTACT">EMS Contact</MenuItem>
                            <MenuItem value="EN_ROUTE">En Route</MenuItem>
                            <MenuItem value="EMS_ARRIVAL">EMS Arrival</MenuItem>
                            <MenuItem value="DEPARTED">Departed</MenuItem>
                            <MenuItem value="ARRIVED">Arrived</MenuItem>
                            <MenuItem value="COMPLETED">Completed</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                        options={ambulances}
                        getOptionLabel={(option) => option.callSign || ''}
                        value={ambulances.find(a => a.id === filters.ambulanceId) || null}
                        onChange={(_, newValue) => handleChange('ambulanceId', newValue ? newValue.id : '')}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Ambulance"
                                size="small"
                                fullWidth
                                placeholder="Search ambulance..."
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                <Box>
                                    <Typography variant="body2">{option.callSign}</Typography>
                                    {option.plateNumber && (
                                        <Typography variant="caption" color="text.secondary">
                                            {option.plateNumber}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                        options={drivers}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={drivers.find(d => d.id === filters.driverId) || null}
                        onChange={(_, newValue) => handleChange('driverId', newValue ? newValue.id : '')}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Driver"
                                size="small"
                                fullWidth
                                placeholder="Search driver..."
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                <Typography variant="body2">
                                    {option.firstName} {option.lastName}
                                </Typography>
                            </Box>
                        )}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="From"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.assignedFrom || ''}
                        onChange={(e) => handleChange('assignedFrom', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="To"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.assignedTo || ''}
                        onChange={(e) => handleChange('assignedTo', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            size="small"
                            onClick={handleClear}
                            disabled={activeCount === 0}
                            color="inherit"
                        >
                            Clear
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={onClose}
                        >
                            Done
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default AssignmentFilters;
