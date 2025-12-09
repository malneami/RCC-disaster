import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    Grid,
} from '@mui/material';

interface CompletedTripsListProps {
    sequences: any[];
    isRetroactive: boolean;
    selectedLogId: string | null;
    onSelectSequence: (seq: any) => void;
}

const CompletedTripsList: React.FC<CompletedTripsListProps> = ({
    sequences,
    isRetroactive,
    selectedLogId,
    onSelectSequence,
}) => {
    if (sequences.length === 0) return null;

    const formatSaudiTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Riyadh'
        }).format(date);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="primary" gutterBottom display="block" fontWeight="bold">
                ✓ Completed Trips (Origin → Destination)
            </Typography>
            <List dense>
                {sequences.slice(0, 5).map((seq, idx) => (
                    <ListItem
                        key={idx}
                        selected={selectedLogId === seq.destLog.id}
                        onClick={() => {
                            if (isRetroactive) {
                                onSelectSequence(seq);
                            }
                        }}
                        sx={{
                            cursor: isRetroactive ? 'pointer' : 'default',
                            border: '1px solid',
                            borderColor: 'success.light',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: selectedLogId === seq.destLog.id ? 'success.lighter' : 'background.paper',
                        }}
                    >
                        <ListItemText
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                            primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold" color="success.dark">
                                        {seq.ambulance.callSign} - {seq.ambulance.plateNumber}
                                    </Typography>
                                    <Chip label="Complete Trip" size="small" color="success" />
                                </Box>
                            }
                            secondary={
                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Origin Entry</Typography>
                                        <Typography variant="body2">{formatSaudiTime(new Date(seq.originLog.entryTime))}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Dest Arrival</Typography>
                                        <Typography variant="body2">{formatSaudiTime(new Date(seq.destLog.entryTime))}</Typography>
                                    </Grid>
                                </Grid>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default CompletedTripsList;
