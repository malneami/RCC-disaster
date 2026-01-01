import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
    LocalHospital as HospitalIcon,
    Warning as WarningIcon,
    Error as CriticalIcon,
    CheckCircle as HealthyIcon,
    Hotel as BedIcon,
} from '@mui/icons-material';
import { StatPill } from './StatPill';

interface HospitalsMetricsProps {
    stats: {
        total: number;
        critical: number;
        warning: number;
        healthy: number;
        totalBeds: number;
        availableBeds: number;
    };
}

export const HospitalsMetrics: React.FC<HospitalsMetricsProps> = ({ stats }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                px: 4,
                py: 2,
                backgroundColor: 'white',
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            <StatPill label="Total" value={stats.total} color="#3b82f6" icon={<HospitalIcon sx={{ fontSize: 18 }} />} />
            <StatPill label="Critical" value={stats.critical} color="#ef4444" icon={<CriticalIcon sx={{ fontSize: 18 }} />} />
            <StatPill label="Warning" value={stats.warning} color="#f59e0b" icon={<WarningIcon sx={{ fontSize: 18 }} />} />
            <StatPill label="Healthy" value={stats.healthy} color="#10b981" icon={<HealthyIcon sx={{ fontSize: 18 }} />} />
            <StatPill
                label="Available Beds"
                value={`${stats.availableBeds}/${stats.totalBeds}`}
                color="#8b5cf6"
                icon={<BedIcon sx={{ fontSize: 18 }} />}
            />
        </Box>
    );
};
