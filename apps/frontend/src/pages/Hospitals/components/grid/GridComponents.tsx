import React from 'react';
import { Box, Typography, Tooltip, alpha } from '@mui/material';
import {
    CheckCircle as ActiveIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

// Circular capacity indicator
export const CapacityRing: React.FC<{ available: number; total: number; size?: number }> = ({
    available,
    total,
    size = 56
}) => {
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage <= 15) return '#ef4444';
        if (percentage <= 35) return '#f59e0b';
        return '#10b981';
    };

    return (
        <Box sx={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
                <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: 'stroke-dashoffset 0.8s ease-out',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                    }}
                />
            </svg>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        color: getColor(),
                        lineHeight: 1,
                    }}
                >
                    {percentage}%
                </Typography>
            </Box>
        </Box>
    );
};

// Status badge component
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getConfig = () => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'active' || statusLower === 'operational') {
            return { icon: ActiveIcon, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'نشط' };
        }
        if (statusLower === 'maintenance') {
            return { icon: WarningIcon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'صيانة' };
        }
        return { icon: ErrorIcon, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'متوقف' };
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                backgroundColor: config.bg,
            }}
        >
            <Icon sx={{ fontSize: 14, color: config.color }} />
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: config.color, fontSize: '0.7rem' }}
            >
                {config.label}
            </Typography>
        </Box>
    );
};

// Service tag component
export const ServiceTag: React.FC<{ icon: React.ElementType; label: string; color: string }> = ({
    icon: Icon,
    label,
    color
}) => (
    <Tooltip title={label} arrow placement="top">
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                backgroundColor: alpha(color, 0.1),
                transition: 'all 0.2s ease',
                cursor: 'default',
                '&:hover': {
                    backgroundColor: alpha(color, 0.2),
                    transform: 'scale(1.05)',
                },
            }}
        >
            <Icon sx={{ fontSize: 12, color }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color }}>{label}</Typography>
        </Box>
    </Tooltip>
);
