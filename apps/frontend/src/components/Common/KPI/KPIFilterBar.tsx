import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    CircularProgress,
    Button,
    InputAdornment,
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { PortalType, getTheme } from './kpiStyles';

interface KPIFilterBarProps {
    filters: {
        hospitalId?: string;
        startDate?: string;
        endDate?: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    hospitals: Array<{ id: string; name: string }>;
    loading?: boolean;
    portalType?: PortalType;
}

const KPIFilterBar: React.FC<KPIFilterBarProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
    hospitals,
    loading = false,
    portalType = 'default',
}) => {
    const theme = getTheme(portalType);
    const hasActiveFilters = filters.hospitalId || filters.startDate || filters.endDate;

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                background: 'white',
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            <Box sx={{ minWidth: 200, flex: { xs: '1 1 100%', md: '0 1 prominent' } }}>
                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Hospital"
                    value={filters.hospitalId || ''}
                    onChange={(e) => onFilterChange('hospitalId', e.target.value)}
                    disabled={loading}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <LocationIcon fontSize="small" sx={{ color: theme.textSecondary }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: '#f8fafc',
                            '&.Mui-focused fieldset': {
                                borderColor: theme.primary,
                            }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: theme.primary,
                        }
                    }}
                >
                    <MenuItem value="">
                        <span style={{ color: theme.textMuted }}>All Hospitals</span>
                    </MenuItem>
                    {hospitals.map((hospital) => (
                        <MenuItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
                <TextField
                    type="date"
                    size="small"
                    label="From"
                    value={filters.startDate || ''}
                    onChange={(e) => onFilterChange('startDate', e.target.value)}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: filters.endDate || undefined }}
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: '#f8fafc',
                            '&.Mui-focused fieldset': {
                                borderColor: theme.primary,
                            }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: theme.primary,
                        }
                    }}
                />

                <TextField
                    type="date"
                    size="small"
                    label="To"
                    value={filters.endDate || ''}
                    onChange={(e) => onFilterChange('endDate', e.target.value)}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: filters.startDate || undefined }}
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: '#f8fafc',
                            '&.Mui-focused fieldset': {
                                borderColor: theme.primary,
                            }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: theme.primary,
                        }
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading && <CircularProgress size={20} sx={{ color: theme.primary }} />}

                <Button
                    variant="text"
                    size="small"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters || loading}
                    startIcon={<ClearIcon fontSize="small" />}
                    sx={{
                        color: theme.textSecondary,
                        opacity: hasActiveFilters ? 1 : 0,
                        transition: 'opacity 0.2s',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            color: theme.primary,
                            background: `${theme.primary}10`,
                        }
                    }}
                >
                    Clear
                </Button>
            </Box>
        </Box>
    );
};

export default KPIFilterBar;
