import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

interface StatPillProps {
    label: string;
    value: string | number;
    color: string;
    icon: React.ReactNode;
}

export const StatPill: React.FC<StatPillProps> = ({ label, value, color, icon }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 3,
            backgroundColor: alpha(color, 0.08),
            border: `1px solid ${alpha(color, 0.2)}`,
            transition: 'all 0.2s ease',
            cursor: 'default',
            '&:hover': {
                backgroundColor: alpha(color, 0.12),
                transform: 'translateY(-1px)',
            },
        }}
    >
        <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>
            {icon}
        </Box>
        <Typography sx={{ fontWeight: 700, color: color, fontSize: '1rem' }}>
            {value}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
            {label}
        </Typography>
    </Box>
);
