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
                px: 4,
                py: 2.5,
                backgroundColor: 'white',
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                {/* Title */}
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
                        maxWidth: 400,
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                            px: 2.5,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
                        }}
                    >
                        Add Hospital
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
