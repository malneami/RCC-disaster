import React from 'react';
import {
    Box,
    Typography,
    Paper,
    InputBase,
    IconButton,
    Button,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
} from '@mui/icons-material';

interface HospitalsHeaderProps {
    totalHospitals: number;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onAddHospital: () => void;
}

export const HospitalsHeader: React.FC<HospitalsHeaderProps> = ({
    totalHospitals,
    searchQuery,
    onSearchChange,
    onRefresh,
    onAddHospital,
}) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                px: { xs: 2, md: 4 },
                py: { xs: 2, md: 2.5 },
                backgroundColor: 'white',
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 2, md: 3 }
            }}>
                {/* Title */}
                <Box sx={{ flexShrink: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                        Hospital Network
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {totalHospitals} facilities in the network
                    </Typography>
                </Box>

                {/* Search */}
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        maxWidth: { xs: '100%', md: 400 },
                        order: { xs: 3, md: 0 },
                        px: 2,
                        py: 1,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: '#f8fafc',
                        '&:focus-within': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: 'white',
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                    }}
                >
                    <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                    <InputBase
                        placeholder="Search hospitals..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        sx={{ flex: 1, fontSize: '0.875rem' }}
                    />
                    {searchQuery && (
                        <IconButton size="small" onClick={() => onSearchChange('')}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Paper>

                {/* Actions */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-end', md: 'flex-start' },
                    gap: 1.5,
                    flexShrink: 0,
                }}>
                    <IconButton
                        size="small"
                        onClick={onRefresh}
                        sx={{
                            backgroundColor: alpha('#000', 0.04),
                            '&:hover': { backgroundColor: alpha('#000', 0.08) },
                        }}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                    <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AddIcon />}
                        onClick={onAddHospital}
                        sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: { xs: 2, md: 2.5 },
                            boxShadow: 'none',
                            '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Hospital</Box>
                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
