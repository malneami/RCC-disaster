import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Chip, alpha, Collapse } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExpand,
    faCompress,
    faLayerGroup,
    faFilter,
    faSearchPlus,
    faSearchMinus,
    faLocationArrow,
    faAmbulance,
    faCheckCircle,
    faClock,
} from '@fortawesome/free-solid-svg-icons';

import { LiveAmbulanceMap } from '../../../components/LiveTracking';
import { useEMSDashboard } from '../../EMS/hooks/useEMSDashboard';
import { EMS_TOKENS, cardStyles } from '../styles/emsDesignTokens';

const EMSMapContainer: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const { data: dashboardData } = useEMSDashboard();

    const summary = dashboardData?.summary || {
        availableAmbulances: 0,
        activeAmbulances: 0,
        totalAmbulances: 0,
    };

    // Status indicators for the map header
    const statusIndicators = [
        {
            label: 'Available',
            value: summary.availableAmbulances || 0,
            color: EMS_TOKENS.colors.status.success,
            bgColor: EMS_TOKENS.colors.status.successLight,
            icon: faCheckCircle,
        },
        {
            label: 'In Use',
            value: summary.activeAmbulances || 0,
            color: EMS_TOKENS.colors.status.warning,
            bgColor: EMS_TOKENS.colors.status.warningLight,
            icon: faClock,
        },
        {
            label: 'Total',
            value: summary.totalAmbulances || 0,
            color: EMS_TOKENS.colors.navy[700],
            bgColor: EMS_TOKENS.colors.slate[100],
            icon: faAmbulance,
        },
    ];

    return (
        <Box
            sx={{
                ...cardStyles.base,
                overflow: 'hidden',
                position: 'relative',
                height: isExpanded ? 'calc(100vh - 140px)' : 600,
                transition: 'height 0.3s ease',
            }}
        >
            {/* Map Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: `1px solid ${EMS_TOKENS.colors.slate[200]}`,
                    backgroundColor: EMS_TOKENS.colors.background.card,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: EMS_TOKENS.radius.md,
                            backgroundColor: alpha(EMS_TOKENS.colors.status.info, 0.1),
                            color: EMS_TOKENS.colors.status.info,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FontAwesomeIcon icon={faLocationArrow} />
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                fontSize: EMS_TOKENS.typography.size.base,
                                fontWeight: EMS_TOKENS.typography.weight.semibold,
                                color: EMS_TOKENS.colors.navy[900],
                            }}
                        >
                            Live Fleet Tracking
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: EMS_TOKENS.typography.size.xs,
                                color: EMS_TOKENS.colors.slate[500],
                            }}
                        >
                            Real-time ambulance positions
                        </Typography>
                    </Box>
                </Box>

                {/* Status Indicators */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {statusIndicators.map((indicator, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: EMS_TOKENS.radius.md,
                                backgroundColor: indicator.bgColor,
                            }}
                        >
                            <FontAwesomeIcon icon={indicator.icon} color={indicator.color} style={{ fontSize: '0.75rem' }} />
                            <Typography
                                sx={{
                                    fontSize: EMS_TOKENS.typography.size.sm,
                                    fontWeight: EMS_TOKENS.typography.weight.semibold,
                                    color: indicator.color,
                                }}
                            >
                                {indicator.value}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: EMS_TOKENS.typography.size.xs,
                                    color: indicator.color,
                                    opacity: 0.8,
                                    display: { xs: 'none', sm: 'block' },
                                }}
                            >
                                {indicator.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Map Container */}
            <Box
                sx={{
                    position: 'relative',
                    height: 'calc(100% - 64px)',
                }}
            >
                <LiveAmbulanceMap
                    height="100%"
                    autoRefresh={true}
                    refreshInterval={5000}
                    useGPSAPI={true}
                    showControls={false}
                    showFilters={false}
                />

                {/* Floating Controls */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        zIndex: 1000,
                    }}
                >
                    <FloatingButton
                        icon={isExpanded ? faCompress : faExpand}
                        tooltip={isExpanded ? 'Exit fullscreen' : 'Fullscreen'}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                    <FloatingButton
                        icon={faFilter}
                        tooltip="Toggle filters"
                        active={showFilters}
                        onClick={() => setShowFilters(!showFilters)}
                    />
                    <FloatingButton
                        icon={faLayerGroup}
                        tooltip="Map layers"
                    />
                </Box>

                {/* Zoom Controls */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 24,
                        right: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        zIndex: 1000,
                        backgroundColor: EMS_TOKENS.colors.background.card,
                        borderRadius: EMS_TOKENS.radius.md,
                        boxShadow: EMS_TOKENS.shadows.elevated,
                        overflow: 'hidden',
                    }}
                >
                    <IconButton
                        size="small"
                        sx={{
                            borderRadius: 0,
                            width: 36,
                            height: 36,
                            color: EMS_TOKENS.colors.slate[600],
                            '&:hover': {
                                backgroundColor: EMS_TOKENS.colors.slate[100],
                            },
                        }}
                    >
                        <FontAwesomeIcon icon={faSearchPlus} />
                    </IconButton>
                    <Box sx={{ height: 1, backgroundColor: EMS_TOKENS.colors.slate[200] }} />
                    <IconButton
                        size="small"
                        sx={{
                            borderRadius: 0,
                            width: 36,
                            height: 36,
                            color: EMS_TOKENS.colors.slate[600],
                            '&:hover': {
                                backgroundColor: EMS_TOKENS.colors.slate[100],
                            },
                        }}
                    >
                        <FontAwesomeIcon icon={faSearchMinus} />
                    </IconButton>
                </Box>

                {/* Filters Panel (Collapsible) */}
                <Collapse in={showFilters}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 64,
                            width: 220,
                            backgroundColor: EMS_TOKENS.colors.background.card,
                            borderRadius: EMS_TOKENS.radius.lg,
                            boxShadow: EMS_TOKENS.shadows.elevated,
                            p: 2,
                            zIndex: 999,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: EMS_TOKENS.typography.size.sm,
                                fontWeight: EMS_TOKENS.typography.weight.semibold,
                                color: EMS_TOKENS.colors.navy[900],
                                mb: 1.5,
                            }}
                        >
                            Filter by Status
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label="Available"
                                size="small"
                                sx={{
                                    backgroundColor: EMS_TOKENS.colors.status.successLight,
                                    color: EMS_TOKENS.colors.status.success,
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="In Use"
                                size="small"
                                sx={{
                                    backgroundColor: EMS_TOKENS.colors.status.warningLight,
                                    color: EMS_TOKENS.colors.status.warning,
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Offline"
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: EMS_TOKENS.colors.slate[300],
                                    color: EMS_TOKENS.colors.slate[500],
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                }}
                            />
                        </Box>
                    </Box>
                </Collapse>

                {/* Map Legend */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 24,
                        left: 16,
                        backgroundColor: EMS_TOKENS.colors.background.card,
                        borderRadius: EMS_TOKENS.radius.md,
                        boxShadow: EMS_TOKENS.shadows.soft,
                        p: 1.5,
                        zIndex: 1000,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: EMS_TOKENS.typography.size.xs,
                            fontWeight: EMS_TOKENS.typography.weight.semibold,
                            color: EMS_TOKENS.colors.slate[600],
                            mb: 1,
                        }}
                    >
                        Legend
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <LegendItem color={EMS_TOKENS.colors.status.success} label="Available" />
                        <LegendItem color={EMS_TOKENS.colors.status.warning} label="In Use" />
                        <LegendItem color={EMS_TOKENS.colors.slate[400]} label="Offline" />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// Floating Button Component
const FloatingButton: React.FC<{
    icon: any;
    tooltip: string;
    active?: boolean;
    onClick?: () => void;
}> = ({ icon, tooltip, active, onClick }) => (
    <Tooltip title={tooltip} placement="left">
        <IconButton
            onClick={onClick}
            sx={{
                width: 40,
                height: 40,
                backgroundColor: active ? EMS_TOKENS.colors.status.info : EMS_TOKENS.colors.background.card,
                color: active ? '#fff' : EMS_TOKENS.colors.slate[600],
                boxShadow: EMS_TOKENS.shadows.soft,
                borderRadius: EMS_TOKENS.radius.md,
                '&:hover': {
                    backgroundColor: active ? EMS_TOKENS.colors.status.info : EMS_TOKENS.colors.slate[100],
                },
            }}
        >
            <FontAwesomeIcon icon={icon} style={{ fontSize: '0.875rem' }} />
        </IconButton>
    </Tooltip>
);

// Legend Item Component
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
            sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: color,
            }}
        />
        <Typography
            sx={{
                fontSize: EMS_TOKENS.typography.size.xs,
                color: EMS_TOKENS.colors.slate[600],
            }}
        >
            {label}
        </Typography>
    </Box>
);

export default EMSMapContainer;
