import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Paper,
    Grid,
    Divider,
} from '@mui/material';
import {
    LocationOn as LocationIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonChecked as ActiveIcon,
    AccessTime as TimeIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';

interface ZoneVisit {
    id: string;
    hospitalName: string;
    hospitalId: string;
    zoneType: 'ORIGIN_ZONE' | 'DESTINATION_ZONE' | 'HOSPITAL_ZONE';
    zoneName?: string;
    entryTime: Date;
    exitTime: Date | null;
    durationMinutes: number | null;
    isActive: boolean;
}

interface AmbulanceZoneTimelineProps {
    ambulanceId: string;
    zoneVisits: ZoneVisit[];
    maxItems?: number;
}

const AmbulanceZoneTimeline: React.FC<AmbulanceZoneTimelineProps> = ({
    ambulanceId,
    zoneVisits,
    maxItems = 10,
}) => {
    const displayVisits = zoneVisits.slice(0, maxItems);

    const getZoneTypeColor = (zoneType: string) => {
        switch (zoneType) {
            case 'ORIGIN_ZONE':
                return 'primary';
            case 'DESTINATION_ZONE':
                return 'success';
            default:
                return 'default';
        }
    };

    const getZoneTypeLabel = (zoneType: string) => {
        switch (zoneType) {
            case 'ORIGIN_ZONE':
                return 'Pickup';
            case 'DESTINATION_ZONE':
                return 'Dropoff';
            default:
                return 'Transit';
        }
    };

    const formatDuration = (minutes: number | null) => {
        if (minutes === null) return 'In progress';
        if (minutes < 1) return '< 1 min';
        if (minutes < 60) return `${Math.round(minutes)} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    // Calculate total time spent in zones
    const totalMinutes = displayVisits.reduce((sum, visit) => {
        return sum + (visit.durationMinutes || 0);
    }, 0);

    if (displayVisits.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No zone visits recorded
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Summary Stats */}
            <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Zone Visit History
                </Typography>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Total Visits
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {zoneVisits.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Active Now
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'primary.main' }}>
                                {displayVisits.filter(v => v.isActive).length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Total Time
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {formatDuration(totalMinutes)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Divider />

            {/* Timeline */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {displayVisits.map((visit, index) => {
                    const timeSinceEntry = visit.isActive
                        ? differenceInMinutes(new Date(), visit.entryTime)
                        : visit.durationMinutes || 0;

                    return (
                        <Box
                            key={visit.id}
                            sx={{
                                mb: index < displayVisits.length - 1 ? 2 : 0,
                                display: 'flex',
                                gap: 1.5,
                                position: 'relative',
                                alignItems: 'stretch'
                            }}
                        >
                            {/* Left Timeline Indicator */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '24px',
                                flexShrink: 0,
                                position: 'relative'
                            }}>
                                {/* Dot */}
                                <Box sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: visit.isActive ? 'primary.main' : 'grey.400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: visit.isActive ? '0 0 0 4px rgba(25, 118, 210, 0.2)' : 'none',
                                    zIndex: 2,
                                    flexShrink: 0
                                }}>
                                    {visit.isActive ? (
                                        <ActiveIcon sx={{ fontSize: 14, color: 'white' }} />
                                    ) : (
                                        <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                                    )}
                                </Box>

                                {/* Connector Line (Absolute positioned below dot) */}
                                {index < displayVisits.length - 1 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: '24px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '2px',
                                        height: 'calc(100% + 16px)',
                                        bgcolor: 'divider',
                                        zIndex: 1
                                    }} />
                                )}
                            </Box>

                            {/* Content Card */}
                            <Paper
                                elevation={visit.isActive ? 4 : 1}
                                sx={{
                                    flex: 1,
                                    p: 1.5,
                                    border: 1,
                                    borderColor: visit.isActive ? 'primary.main' : 'divider',
                                    bgcolor: visit.isActive ? 'primary.50' : 'background.paper',
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 3,
                                        transform: 'translateX(2px)'
                                    }
                                }}
                            >
                                {/* Header Row */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                            <LocationIcon sx={{ fontSize: 16, color: 'action.active' }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                {visit.hospitalName}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                            {visit.zoneName || visit.zoneType.replace(/_/g, ' ')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                        <Chip
                                            label={getZoneTypeLabel(visit.zoneType)}
                                            size="small"
                                            color={getZoneTypeColor(visit.zoneType) as any}
                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                        {visit.isActive && (
                                            <Chip
                                                label="Active"
                                                size="small"
                                                color="primary"
                                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                {/* Metrics Grid */}
                                <Grid container spacing={1}>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', py: 0.5, px: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                                                <TimeIcon sx={{ fontSize: 12, color: 'success.main' }} />
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                                    ENTRY
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                {format(visit.entryTime, 'HH:mm:ss')}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {visit.exitTime && (
                                        <Grid item xs={4}>
                                            <Box sx={{ textAlign: 'center', py: 0.5, px: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                                                    <TimeIcon sx={{ fontSize: 12, color: 'error.main' }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                                        EXIT
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {format(visit.exitTime, 'HH:mm:ss')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    <Grid item xs={visit.exitTime ? 4 : 8}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 0.5,
                                            px: 1,
                                            bgcolor: visit.isActive ? 'primary.main' : 'action.hover',
                                            borderRadius: 1,
                                            color: visit.isActive ? 'white' : 'inherit'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                                                <SpeedIcon sx={{ fontSize: 12, color: visit.isActive ? 'white' : 'primary.main' }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                        color: visit.isActive ? 'white' : 'text.secondary'
                                                    }}
                                                >
                                                    DURATION
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                {formatDuration(visit.durationMinutes)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Active Zone Footer */}
                                {visit.isActive && (
                                    <Box sx={{
                                        mt: 1,
                                        pt: 1,
                                        borderTop: 1,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'primary.main' }}>
                                            🔴 LIVE • {formatDistanceToNow(visit.entryTime, { addSuffix: true })}
                                        </Typography>
                                        <Chip
                                            label={`${timeSinceEntry} min`}
                                            size="small"
                                            color="primary"
                                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                        />
                                    </Box>
                                )}

                                {/* Date Footer */}
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        display: 'block',
                                        mt: 1,
                                        textAlign: 'right',
                                        fontSize: '0.65rem',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    {format(visit.entryTime, 'MMM d, yyyy')}
                                </Typography>
                            </Paper>
                        </Box>
                    );
                })}
            </Box>

            {/* Footer */}
            {zoneVisits.length > maxItems && (
                <Box sx={{ p: 1.5, pt: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                        Showing {maxItems} of {zoneVisits.length} visits • {zoneVisits.length - maxItems} more not shown
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default AmbulanceZoneTimeline;
