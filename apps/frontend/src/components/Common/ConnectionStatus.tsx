import React, { useState } from 'react';
import { Box, Chip, Tooltip, Fade } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWifi, 
  faExclamationTriangle,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  lastConnected?: Date;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting = false,
  lastConnected,
  showDetails = false,
  position = 'top-right'
}) => {
  const [, setShowTooltip] = useState(false);

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: faSpinner,
        label: 'Connecting...',
        color: '#ff9800',
        backgroundColor: '#fff3e0',
        borderColor: '#ffcc02'
      };
    }

    if (isConnected) {
      return {
        icon: faWifi,
        label: 'Connected',
        color: '#4caf50',
        backgroundColor: '#e8f5e8',
        borderColor: '#4caf50'
      };
    }

    return {
      icon: faExclamationTriangle,
      label: 'Disconnected',
      color: '#f44336',
      backgroundColor: '#ffebee',
      borderColor: '#f44336'
    };
  };

  const statusInfo = getStatusInfo();

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      transition: 'all 0.3s ease'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      default:
        return { ...baseStyles, top: 16, right: 16 };
    }
  };

  const formatLastConnected = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Box sx={getPositionStyles()}>
      <Fade in={true} timeout={300}>
        <Tooltip
          title={
            showDetails ? (
              <Box>
                <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Connection Status: {statusInfo.label}
                </Box>
                {lastConnected && (
                  <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    Last connected: {formatLastConnected(lastConnected)}
                  </Box>
                )}
                {!isConnected && !isConnecting && (
                  <Box sx={{ fontSize: '0.75rem', opacity: 0.8, mt: 0.5 }}>
                    Real-time updates unavailable
                  </Box>
                )}
              </Box>
            ) : statusInfo.label
          }
          placement="left"
          arrow
        >
          <Chip
            icon={
              <FontAwesomeIcon 
                icon={statusInfo.icon} 
                style={{ 
                  fontSize: '0.8rem',
                  animation: isConnecting ? 'spin 1s linear infinite' : 'none'
                }} 
              />
            }
            label={statusInfo.label}
            size="small"
            sx={{
              backgroundColor: statusInfo.backgroundColor,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.borderColor}`,
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 28,
              '& .MuiChip-icon': {
                color: statusInfo.color
              },
              '&:hover': {
                backgroundColor: statusInfo.backgroundColor,
                opacity: 0.8
              }
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        </Tooltip>
      </Fade>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default ConnectionStatus;
