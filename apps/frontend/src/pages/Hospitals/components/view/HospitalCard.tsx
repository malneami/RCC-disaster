import React from 'react';
import { Box, Paper, Typography, Tooltip, useTheme, alpha } from '@mui/material';
import {
    Favorite as StemiIcon,
    Psychology as StrokeIcon,
    LocalFireDepartment as TraumaIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';

interface HospitalCardProps {
    hospital: Hospital;
    isSelected?: boolean;
    onClick: () => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
    hospital,
    isSelected,
    onClick,
}) => {
    const theme = useTheme();

    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
        hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds + (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
        hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
        hospital.pediatricBedsAvailable + hospital.standardBedsAvailable + (hospital.nicuBedsAvailable || 0);
    const percentage = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    const getCapacityColor = () => {
        if (percentage <= 15) return '#ef4444';
        if (percentage <= 35) return '#f59e0b';
        return '#10b981';
    };

    const capacityColor = getCapacityColor();

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: theme.palette.primary.light,
                    boxShadow: `0 4px 20px ${alpha('#000', 0.06)}`,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                {/* Hospital Avatar */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        flexShrink: 0,
                    }}
                >
                    {hospital.name?.charAt(0) || 'H'}
                </Box>

                {/* Hospital Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                        {hospital.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📍 {hospital.cluster || 'Unassigned'}
                    </Typography>
                </Box>

                {/* Bed Stats */}
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
                            {hospital.icuBedsAvailable}/{hospital.icuBeds}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
                            ICU
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>
                            {hospital.picuBedsAvailable}/{hospital.picuBeds}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
                            PICU
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {availableBeds}/{totalBeds}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
                            Total
                        </Typography>
                    </Box>
                </Box>

                {/* Capacity Bar */}
                <Box sx={{ width: 140 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Capacity</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: capacityColor }}>{percentage}%</Typography>
                    </Box>
                    <Box
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(capacityColor, 0.15),
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                height: '100%',
                                width: `${percentage}%`,
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${capacityColor} 0%, ${alpha(capacityColor, 0.7)} 100%)`,
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </Box>
                </Box>

                {/* Services */}
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                    {hospital.hasStemiService && (
                        <Tooltip title="STEMI Service" arrow>
                            <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#ef4444', 0.1) }}>
                                <StemiIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                            </Box>
                        </Tooltip>
                    )}
                    {hospital.hasStrokeService && (
                        <Tooltip title="Stroke Center" arrow>
                            <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#3b82f6', 0.1) }}>
                                <StrokeIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                            </Box>
                        </Tooltip>
                    )}
                    {hospital.hasTraumaService && (
                        <Tooltip title="Trauma Center" arrow>
                            <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#f59e0b', 0.1) }}>
                                <TraumaIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};
