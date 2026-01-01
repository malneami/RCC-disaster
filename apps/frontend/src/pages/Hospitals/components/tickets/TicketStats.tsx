import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface TicketStatsProps {
    stats: {
        total: number;
        open: number;
        completed: number;
        transfer: number;
        hospital: number;
    };
}

export const TicketStats: React.FC<TicketStatsProps> = ({ stats }) => {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}
            >
                Related Tickets ({stats.total})
            </Typography>

            {/* Stats Cards Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Open */}
                <Grid item xs={6} sm={3}>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: '#FEF3C7',
                            borderRadius: '12px',
                            border: '1px solid #FCD34D',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#D97706', lineHeight: 1 }}>
                            {stats.open}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400E', mt: 0.5 }}>
                            Open
                        </Typography>
                    </Box>
                </Grid>

                {/* Completed */}
                <Grid item xs={6} sm={3}>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: '#D1FAE5',
                            borderRadius: '12px',
                            border: '1px solid #6EE7B7',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', lineHeight: 1 }}>
                            {stats.completed}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#065F46', mt: 0.5 }}>
                            Completed
                        </Typography>
                    </Box>
                </Grid>

                {/* Transfer */}
                <Grid item xs={6} sm={3}>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: '#E0F2FE',
                            borderRadius: '12px',
                            border: '1px solid #7DD3FC',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0284C7', lineHeight: 1 }}>
                            {stats.transfer}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#075985', mt: 0.5 }}>
                            Transfer
                        </Typography>
                    </Box>
                </Grid>

                {/* Hospital */}
                <Grid item xs={6} sm={3}>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: '#F3E8FF',
                            borderRadius: '12px',
                            border: '1px solid #C4B5FD',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#7C3AED', lineHeight: 1 }}>
                            {stats.hospital}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#5B21B6', mt: 0.5 }}>
                            Hospital
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
