import React from 'react';
import { Box, Typography, IconButton, Chip, LinearProgress, alpha, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';

interface DetailDrawerHeaderProps {
    hospital: Hospital;
    onClose: () => void;
}

export const DetailDrawerHeader: React.FC<DetailDrawerHeaderProps> = ({ hospital, onClose }) => {
    const theme = useTheme();

    const getStatusConfig = () => {
        const status = hospital.status?.toLowerCase() || '';
        if (status === 'active' || status === 'operational') {
            return { color: '#10b981', label: 'Active', bg: 'rgba(16, 185, 129, 0.1)' };
        }
        if (status === 'maintenance') {
            return { color: '#f59e0b', label: 'Maintenance', bg: 'rgba(245, 158, 11, 0.1)' };
        }
        return { color: '#ef4444', label: 'Inactive', bg: 'rgba(239, 68, 68, 0.1)' };
    };

    const statusConfig = getStatusConfig();

    // Calculate totals
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
        hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds +
        (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
        hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
        hospital.pediatricBedsAvailable + hospital.standardBedsAvailable +
        (hospital.nicuBedsAvailable || 0);
    const overallPercentage = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    const getCapacityColor = () => {
        if (overallPercentage <= 15) return '#ef4444';
        if (overallPercentage <= 35) return '#f59e0b';
        return '#10b981';
    };

    return (
        <Box
            sx={{
                p: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {hospital.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                backgroundColor: statusConfig.bg,
                            }}
                        >
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusConfig.color }} />
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: statusConfig.color }}>
                                {statusConfig.label}
                            </Typography>
                        </Box>
                        {hospital.cluster && (
                            <Chip label={hospital.cluster} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                        )}
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Overall Capacity Card */}
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(getCapacityColor(), 0.08),
                    border: `1px solid ${alpha(getCapacityColor(), 0.2)}`,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.secondary' }}>
                        Overall Availability
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: getCapacityColor() }}>
                        {overallPercentage}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={overallPercentage}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(getCapacityColor(), 0.15),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: getCapacityColor(),
                        },
                    }}
                />
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.75 }}>
                    {availableBeds} available of {totalBeds} total beds
                </Typography>
            </Box>
        </Box>
    );
};
