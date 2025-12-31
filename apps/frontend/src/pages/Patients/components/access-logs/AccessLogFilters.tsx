import React from 'react';
import { Box, Grid, TextField, Button, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { GRADIENT_COLORS } from './AccessLogConstants';

interface AccessLogFiltersProps {
    patientIdFilter: string;
    setPatientIdFilter: (value: string) => void;
    userIdFilter: string;
    setUserIdFilter: (value: string) => void;
    accessTypeFilter: string;
    setAccessTypeFilter: (value: string) => void;
    startDate: Date | null;
    setStartDate: (date: Date | null) => void;
    endDate: Date | null;
    setEndDate: (date: Date | null) => void;
    handleResetFilters: () => void;
    accessTypes: string[];
}

const AccessLogFilters: React.FC<AccessLogFiltersProps> = ({
    patientIdFilter,
    setPatientIdFilter,
    userIdFilter,
    setUserIdFilter,
    accessTypeFilter,
    setAccessTypeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetFilters,
    accessTypes,
}) => {
    return (
        <Box
            sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(66, 165, 245, 0.25)',
            }}
        >
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="Patient ID"
                        value={patientIdFilter}
                        onChange={(e) => setPatientIdFilter(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                    },
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                        borderWidth: '2px',
                                    },
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="User ID"
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                    },
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                        borderWidth: '2px',
                                    },
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        select
                        label="Access Type"
                        value={accessTypeFilter}
                        onChange={(e) => setAccessTypeFilter(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                    },
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#42a5f5',
                                        borderWidth: '2px',
                                    },
                                },
                            },
                        }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {accessTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                sx: {
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        '&:hover': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#42a5f5',
                                            },
                                        },
                                        '&.Mui-focused': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#42a5f5',
                                                borderWidth: '2px',
                                            },
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                sx: {
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        '&:hover': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#42a5f5',
                                            },
                                        },
                                        '&.Mui-focused': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#42a5f5',
                                                borderWidth: '2px',
                                            },
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        onClick={handleResetFilters}
                        sx={{
                            background: GRADIENT_COLORS.primary,
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '8px 24px',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                                boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                            },
                        }}
                    >
                        Reset Filters
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AccessLogFilters;
