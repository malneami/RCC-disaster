import React from 'react';
import { Box, Typography } from '@mui/material';
import { Info } from '@mui/icons-material';
import { GRADIENT_COLORS } from './AccessLogConstants';

const AccessLogEmptyState: React.FC = () => {
    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '60px 20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                textAlign: 'center',
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: GRADIENT_COLORS.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 6px 20px rgba(66, 165, 245, 0.4)',
                }}
            >
                <Info sx={{ fontSize: 48, color: '#ffffff' }} />
            </Box>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 600,
                    color: '#424242',
                    mb: 1.5,
                }}
            >
                No Access Logs Found
            </Typography>
            <Typography
                sx={{
                    color: '#42a5f5',
                    fontSize: '0.9375rem',
                    maxWidth: '400px',
                    margin: '0 auto',
                    fontWeight: 500,
                }}
            >
                There are no access logs matching your filters.
            </Typography>
        </Box>
    );
};

export default AccessLogEmptyState;
