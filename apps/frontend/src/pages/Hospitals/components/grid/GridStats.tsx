import React from 'react';
import {
    Box,
    Typography,
    alpha,
    Paper,
} from '@mui/material';
import {
    LocalHospital as HospitalIcon,
    CheckCircle as ActiveIcon,
    Hotel as BedIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface GridStatsProps {
    stats: {
        total: number;
        active: number;
        totalBeds: number;
        availableBeds: number;
    };
}

export const GridStats: React.FC<GridStatsProps> = ({ stats }) => {
    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
                { label: 'المستشفيات', value: stats.total, icon: HospitalIcon, color: '#667eea' },
                { label: 'نشط', value: stats.active, icon: ActiveIcon, color: '#10b981' },
                { label: 'إجمالي الأسرّة', value: stats.totalBeds, icon: BedIcon, color: '#3b82f6' },
                { label: 'أسرّة متاحة', value: stats.availableBeds, icon: TrendingIcon, color: '#f59e0b' },
            ].map((stat, i) => (
                <Paper
                    key={i}
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2.5,
                        py: 1.5,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'divider',
                        minWidth: 140,
                    }}
                >
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            backgroundColor: alpha(stat.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <stat.icon sx={{ fontSize: 18, color: stat.color }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {stat.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            {stat.label}
                        </Typography>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
};
