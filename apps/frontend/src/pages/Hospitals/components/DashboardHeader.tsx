import React from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Breadcrumbs,
    Link,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Hospital } from '../../../services/hospitalService';
import { useFullscreen } from '../../../contexts/FullscreenContext';
import { getAvailabilityPercentage } from '../utils/hospitalUtils';

interface DashboardHeaderProps {
    hospital: Hospital;
    onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    hospital,
    onRefresh,
}) => {
    const navigate = useNavigate();
    const { isFullscreen } = useFullscreen();

    const handleFullscreenToggle = async () => {
        try {
            if (!isFullscreen) {
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    const availabilityPercentage = getAvailabilityPercentage(hospital);

    return (
        <>
            <Breadcrumbs sx={{ mb: 3, display: isFullscreen ? 'none' : 'flex' }}>
                <Link
                    color="inherit"
                    href="/hospitals"
                    onClick={e => {
                        e.preventDefault();
                        navigate('/hospitals');
                    }}
                    sx={{ cursor: 'pointer' }}
                >
                    Hospitals
                </Link>
                <Typography color="text.primary">{hospital.name}</Typography>
            </Breadcrumbs>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {hospital.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {hospital.address || 'No address provided'}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                        <Chip label={hospital.status} color="primary" size="small" />
                        <Chip
                            label={`${availabilityPercentage}% Available`}
                            color={
                                availabilityPercentage <= 10
                                    ? 'error'
                                    : availabilityPercentage <= 25
                                        ? 'warning'
                                        : 'success'
                            }
                            size="small"
                        />
                        <Chip label={hospital.cluster} variant="outlined" size="small" />
                    </Box>
                </Box>
                <Box>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={onRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                        <IconButton onClick={handleFullscreenToggle}>
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Tooltip>
                    {!isFullscreen && (
                        <Tooltip title="Back to Hospitals">
                            <IconButton onClick={() => navigate('/hospitals')}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </>
    );
};
