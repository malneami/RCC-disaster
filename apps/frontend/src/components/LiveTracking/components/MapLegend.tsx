import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const legendItems = [
    { label: 'Available', color: getStatusColor('AVAILABLE'), count: stats.available },
    { label: 'In Use', color: getStatusColor('IN_USE'), count: stats.inUse },
    { label: 'Maintenance', color: getStatusColor('MAINTENANCE'), count: stats.maintenance },
    { label: 'Out of Service', color: getStatusColor('OUT_OF_SERVICE'), count: stats.outOfService },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          minWidth: isExpanded ? 160 : 'auto',
          transition: 'min-width 0.2s ease',
        }}
      >
        {/* Collapsed: Inline summary */}
        <Box
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#f8f9fa' },
          }}
        >
          {!isExpanded ? (
            // Compact inline view
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {legendItems.map((item) => (
                <Box
                  key={item.label}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                    }}
                  />
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#5f6368' }}>
                    {item.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#202124' }}>
              Status Legend
            </Typography>
          )}
          
          <IconButton size="small" sx={{ p: 0.25, ml: 'auto' }}>
            <FontAwesomeIcon 
              icon={isExpanded ? faChevronDown : faChevronUp} 
              size="xs" 
              color="#5f6368" 
            />
          </IconButton>
        </Box>

        {/* Expanded: Full legend */}
        {isExpanded && (
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            {legendItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                    }}
                  />
                  <Typography sx={{ fontSize: '12px', color: '#5f6368' }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#202124' }}>
                  {item.count}
                </Typography>
              </Box>
            ))}
            
            {/* Summary row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
                pt: 1,
                borderTop: '1px solid #e8eaed',
              }}
            >
              <Typography sx={{ fontSize: '12px', color: '#5f6368' }}>
                Total
              </Typography>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#202124' }}>
                {stats.total}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MapLegend;
