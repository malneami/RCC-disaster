import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMd, faAmbulance, faTools, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';

interface FleetMetricsProps {
    metrics: {
        activeDrivers: number;
        totalAmbulances: number;
        availableAmbulances: number;
        inUseAmbulances: number;
        availabilityPercentage?: number;
        vehicleReadiness: number;
        driverUtilization: number;
    };
}

const FleetMetrics: React.FC<FleetMetricsProps> = ({ metrics }) => {
    // Calculate availability percentage (target ≥85%)
    const availabilityPct = metrics.availabilityPercentage ?? 
        (metrics.totalAmbulances > 0 ? (metrics.availableAmbulances / metrics.totalAmbulances) * 100 : 0);
    
    const cards = [
        {
            title: 'Active Drivers',
            value: metrics.activeDrivers,
            icon: faUserMd,
            color: '#1976d2',
            subtitle: 'Active in period'
        },
        {
            title: 'Available vs. In-Use',
            value: `${metrics.availableAmbulances} / ${metrics.totalAmbulances}`,
            icon: faAmbulance,
            // Color based on 85% availability target
            color: availabilityPct >= 85 ? '#4caf50' : availabilityPct >= 70 ? '#ff9800' : '#f44336',
            subtitle: `${availabilityPct.toFixed(0)}% Available (Target ≥85%)`
        },
        {
            title: 'Vehicle Readiness',
            value: `${metrics.vehicleReadiness}%`,
            icon: faTools,
            color: metrics.vehicleReadiness >= 95 ? '#4caf50' : '#ff9800', // Target ≥95%
            subtitle: 'Operational Fleet (Target ≥95%)'
        },
        {
            title: 'Ambulance Utilization',
            value: `${metrics.driverUtilization}%`,
            icon: faTachometerAlt,
            color: metrics.driverUtilization >= 80 ? '#4caf50' : '#1976d2', // Target ≥80%
            subtitle: 'Ambulance / Shift Hours (Target ≥80%)'
        }
    ];

    return (
        <Grid container spacing={2}>
            {cards.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Box sx={{ mb: 2 }}>
                                <FontAwesomeIcon icon={item.icon} size="2x" style={{ color: item.color }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {item.value}
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 500 }}>
                                {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.subtitle}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default FleetMetrics;
