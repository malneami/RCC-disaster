import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
    <Box sx={{ mt: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'white',
                }}
            >
                {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {title}
            </Typography>
        </Box>
        <Divider />
    </Box>
);
