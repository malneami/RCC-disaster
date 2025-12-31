import React from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { GRADIENT_COLORS } from './DuplicateDetectionConstants';

const DuplicateEmptyState: React.FC = () => {
    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '60px 20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                textAlign: 'center',
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: GRADIENT_COLORS.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 6px 20px rgba(141, 216, 143, 0.3)',
                }}
            >
                <CheckCircle sx={{ fontSize: 48, color: '#ffffff' }} />
            </Box>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 600,
                    color: '#424242',
                    mb: 1.5,
                }}
            >
                No Duplicates Found
            </Typography>
            <Typography
                sx={{
                    color: '#6ec6ff',
                    fontSize: '0.9375rem',
                    maxWidth: '400px',
                    margin: '0 auto',
                    fontWeight: 500,
                }}
            >
                All patient records appear to be unique.
            </Typography>
        </Box>
    );
};

export default DuplicateEmptyState;
