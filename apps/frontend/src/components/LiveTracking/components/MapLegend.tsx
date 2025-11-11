import React, { useState } from 'react';
import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { getStatusColor } from '../utils/mapHelpers';

interface MapLegendProps {
  stats: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    outOfService: number;
    withDriver: number;
    withoutDriver: number;
  };
}

const MapLegend: React.FC<MapLegendProps> = ({ stats }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const legendItems = [
    {
      label: 'Available',
      color: getStatusColor('AVAILABLE'),
      count: stats.available,
      status: 'AVAILABLE',
    },
    {
      label: 'In Use',
      color: getStatusColor('IN_USE'),
      count: stats.inUse,
      status: 'IN_USE',
    },
    {
      label: 'Maintenance',
      color: getStatusColor('MAINTENANCE'),
      count: stats.maintenance,
      status: 'MAINTENANCE',
    },
    {
      label: 'Out of Service',
      color: getStatusColor('OUT_OF_SERVICE'),
      count: stats.outOfService,
      status: 'OUT_OF_SERVICE',
    },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        minWidth: isExpanded ? 250 : 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header - Always Visible */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faInfoCircle} color="#1976d2" />
          <Typography variant="subtitle2" fontWeight="bold">
            Ambulance Status
          </Typography>
          <Chip
            label={stats.total}
            size="small"
            color="primary"
            sx={{ minWidth: 40, height: 20, fontSize: '11px' }}
          />
        </Box>
        <IconButton size="small">
          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronUp} size="xs" />
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Status Legend */}
          <Box sx={{ mb: 2 }}>
        {legendItems.map((item) => (
          <Box
            key={item.status}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  border: '2px solid white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              />
              <Typography variant="body2">{item.label}</Typography>
            </Box>
            <Chip
              label={item.count}
              size="small"
              sx={{
                minWidth: 40,
                height: 20,
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            />
          </Box>
        ))}
          </Box>

          {/* Total Stats */}
          <Box
            sx={{
              pt: 2,
              borderTop: '1px solid #e0e0e0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {stats.total}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                With Drivers
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {stats.withDriver}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MapLegend;

