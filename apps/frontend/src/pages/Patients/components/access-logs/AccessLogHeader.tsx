import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FilterList, GetApp, Refresh } from '@mui/icons-material';
import { GRADIENT_COLORS } from './AccessLogConstants';

interface AccessLogHeaderProps {
    total: number;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    handleExport: () => void;
    loadLogs: () => void;
    hasActiveFilters: boolean;
    activeFilterCount: number;
    children?: React.ReactNode;
}

const AccessLogHeader: React.FC<AccessLogHeaderProps> = ({
    total,
    showFilters,
    setShowFilters,
    handleExport,
    loadLogs,
    hasActiveFilters,
    activeFilterCount,
    children,
}) => {
    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                mb: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(66, 165, 245, 0.25), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: '#1a237e',
                        fontSize: '1.5rem',
                    }}
                >
                    Patient Access Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<FilterList />}
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{
                            background: showFilters ? GRADIENT_COLORS.primary : 'rgba(66, 165, 245, 0.12)',
                            color: showFilters ? '#ffffff' : '#42a5f5',
                            borderRadius: '12px',
                            padding: '8px 20px',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: showFilters ? '0 4px 12px rgba(66, 165, 245, 0.4)' : 'none',
                            '&:hover': {
                                background: GRADIENT_COLORS.primary,
                                color: '#ffffff',
                                boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Filters {hasActiveFilters && `(${activeFilterCount})`}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<GetApp />}
                        onClick={handleExport}
                        sx={{
                            background: GRADIENT_COLORS.export,
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '8px 20px',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(38, 166, 154, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1e9b8f 0%, #26a69a 100%)',
                                boxShadow: '0 6px 16px rgba(38, 166, 154, 0.5)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={loadLogs}
                        sx={{
                            background: GRADIENT_COLORS.primary,
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '8px 20px',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                                boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>



            {children}

            <Typography
                variant="body2"
                sx={{
                    mt: 2,
                    color: '#6ec6ff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                }}
            >
                Total: {total} access logs
            </Typography>
        </Box >
    );
};

export default AccessLogHeader;
