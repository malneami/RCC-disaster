import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ flex: 1, overflow: 'auto' }}>
        {value === index && children}
    </Box>
);

export const BedRow: React.FC<{
    label: string;
    available: number;
    total: number;
    color: string;
}> = ({ label, available, total, color }) => {
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1,
                '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>
                {label}
            </Typography>
            <Box sx={{ width: 80, textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color }}>{available}</span>
                    <span style={{ color: '#94a3b8' }}> / {total}</span>
                </Typography>
            </Box>
            <Box sx={{ width: 80 }}>
                <Box
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(color, 0.15),
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            borderRadius: 3,
                            backgroundColor: color,
                            transition: 'width 0.3s ease',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export const ServiceBadge: React.FC<{
    active: boolean;
    label: string;
    icon: React.ReactNode;
    color: string;
}> = ({ active, label, icon, color }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                backgroundColor: active ? alpha(color, 0.1) : alpha(theme.palette.grey[500], 0.05),
                border: `1px solid ${active ? alpha(color, 0.25) : 'transparent'}`,
                opacity: active ? 1 : 0.4,
                transition: 'all 0.2s ease',
            }}
        >
            <Box sx={{ color: active ? color : theme.palette.grey[400], display: 'flex' }}>
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: active ? 'text.primary' : 'text.disabled',
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};
