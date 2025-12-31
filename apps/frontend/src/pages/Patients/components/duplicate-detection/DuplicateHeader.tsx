import React from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { GRADIENT_COLORS } from './DuplicateDetectionConstants';

interface DuplicateHeaderProps {
    error: string | null;
    setError: (error: string | null) => void;
    confidenceThreshold: number;
    setConfidenceThreshold: (value: number) => void;
    loadDuplicates: () => void;
}

const DuplicateHeader: React.FC<DuplicateHeaderProps> = ({
    error,
    setError,
    confidenceThreshold,
    setConfidenceThreshold,
    loadDuplicates,
}) => {
    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                mb: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: '#1a237e',
                        fontSize: '1.5rem',
                    }}
                >
                    Duplicate Patient Detection
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        label="Confidence Threshold"
                        type="number"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.8)}
                        inputProps={{ min: 0, max: 1, step: 0.1 }}
                        size="small"
                        sx={{
                            width: 200,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#6ec6ff',
                                    },
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#6ec6ff',
                                        borderWidth: '2px',
                                    },
                                },
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={loadDuplicates}
                        sx={{
                            background: GRADIENT_COLORS.primary,
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '8px 24px',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(110, 198, 255, 0.35)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4db8ff 0%, #6ec6ff 100%)',
                                boxShadow: '0 6px 16px rgba(110, 198, 255, 0.45)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                    }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default DuplicateHeader;
