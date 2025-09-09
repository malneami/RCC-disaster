import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  FiberManualRecord,
} from '@mui/icons-material';
import { TimelineEvent } from '../../pages/Stemi/types';

interface TimelineProps {
  events?: TimelineEvent[] | null;
}

const getStatusColor = (status: string) => {
  const statusColors: { [key: string]: string } = {
    ECG_PENDING: '#2196f3',
    STEMI_CONFIRMED: '#f44336',
    RCC_ACTIVATED: '#ff5722',
    IN_TRANSIT: '#607d8b',
    PCI_READY: '#4caf50',
    BALLOON_INFLATED: '#8bc34a',
    CCU_ADMITTED: '#009688',
    DISCHARGED: '#795548',
  };
  return statusColors[status] || '#757575';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const TimelineComponent: React.FC<TimelineProps> = ({ events }) => {
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  
  if (safeEvents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No timeline events recorded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {safeEvents.map((event, index) => (
        <Box key={event.id}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
              <FiberManualRecord 
                sx={{ 
                  fontSize: 12, 
                  color: getStatusColor(event.toStatus),
                  mb: 1 
                }} 
              />
              {index < safeEvents.length - 1 && (
                <Box 
                  sx={{ 
                    width: 2, 
                    height: 40, 
                    backgroundColor: '#e0e0e0',
                    borderRadius: 1 
                  }} 
                />
              )}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {event.toStatus.replace(/_/g, ' ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.eventTimestamp)}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {event.eventDescription}
              </Typography>
              
              {event.eventLocation && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Location: {event.eventLocation}
                </Typography>
              )}
              
              {event.minutesFromFmc !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {event.minutesFromFmc} minutes from FMC
                  </Typography>
                  {event.withinTarget !== undefined && (
                    <Chip
                      label={event.withinTarget ? '✓ Target Met' : '✗ Target Missed'}
                      size="small"
                      sx={{
                        backgroundColor: event.withinTarget ? '#4caf50' : '#f44336',
                        color: 'white',
                        fontSize: '0.6rem',
                        height: 20,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          
          {index < safeEvents.length - 1 && (
            <Divider sx={{ ml: 3 }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TimelineComponent;
