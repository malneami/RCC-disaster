import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faSync, faCog } from '@fortawesome/free-solid-svg-icons';

interface EMSDashboardHeaderProps {
  onRefresh?: () => void;
  onSettings?: () => void;
  lastUpdated?: Date;
}

const EMSDashboardHeader: React.FC<EMSDashboardHeaderProps> = ({
  onRefresh,
  onSettings,
  lastUpdated,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FontAwesomeIcon icon={faAmbulance} color="#1976d2" size="2x" />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              EMS Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time Emergency Medical Services Overview & Analytics
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Chip
              label={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefresh} color="primary">
              <FontAwesomeIcon icon={faSync} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Dashboard Settings">
            <IconButton onClick={onSettings} color="primary">
              <FontAwesomeIcon icon={faCog} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default EMSDashboardHeader;
