import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Paper,
    Divider,
    Grid,
} from '@mui/material';
import { AmbulanceZoneLog } from '../types/recommendations';

interface ZoneActivityLogItemProps {
    log: AmbulanceZoneLog;
    ambulance: any;
    isDestination: boolean;
    isSelected: boolean;
    isRetroactive: boolean;
    onSelect: (log: AmbulanceZoneLog, ambulanceId: string, isDestination: boolean) => void;
}

const ZoneActivityLogItem: React.FC<ZoneActivityLogItemProps> = ({
    log,
    ambulance,
    isDestination,
    isSelected,
    isRetroactive,
    onSelect,
}) => {
    const isCompleted = !!log.exitTime;

    // Calculate duration
    const entry = new Date(log.entryTime);
    const exit = log.exitTime ? new Date(log.exitTime) : new Date();
    const durationMinutes = Math.round((exit.getTime() - entry.getTime()) / (1000 * 60));

    const durationText = isCompleted
        ? `${durationMinutes} min stay`
        : `${durationMinutes} min active`;

    const formatTimeDisplay = (date: Date) => {
        const saudiDateFormatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            timeZone: 'Asia/Riyadh'
        });

        const saudiTimeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Riyadh'
        });

        const saudiMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            timeZone: 'Asia/Riyadh'
        });

        const isToday = saudiDateFormatter.format(new Date()) === saudiDateFormatter.format(date);

        return (
            <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1 }}>
                    {saudiTimeFormatter.format(date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {isToday ? 'Today' : saudiMonthDayFormatter.format(date)}
                </Typography>
            </Box>
        );
    };

    return (
        <Paper
            elevation={isSelected ? 4 : 1}
            onClick={() => onSelect(log, ambulance.id, isDestination)}
            sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                cursor: isRetroactive ? 'pointer' : 'default',
                opacity: isRetroactive ? 1 : 0.9,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: isRetroactive ? 'primary.main' : 'divider',
                    backgroundColor: isRetroactive && isSelected ? 'primary.50' : isRetroactive ? 'action.hover' : 'background.paper',
                    transform: isRetroactive ? 'translateY(-2px)' : 'none',
                    boxShadow: isRetroactive ? 3 : 1,
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    {ambulance.callSign}
                </Typography>
                <Chip
                    label={durationText}
                    color={isCompleted ? "default" : "success"}
                    size="small"
                    variant={isCompleted ? "outlined" : "filled"}
                    sx={{ fontWeight: 600 }}
                />
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Entry</Typography>
                        {formatTimeDisplay(entry)}
                    </Box>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: '1px', height: '32px', bgcolor: 'divider' }} />
                </Grid>
                <Grid item xs={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {isCompleted ? 'Departure' : 'Status'}
                        </Typography>
                        {isCompleted ? (
                            <Box sx={{ textAlign: 'right' }}>
                                {formatTimeDisplay(exit)}
                            </Box>
                        ) : (
                            <Chip
                                label="ACTIVE"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 'bold', height: 24 }}
                            />
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default ZoneActivityLogItem;
