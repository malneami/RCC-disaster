import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

interface NotificationHeaderProps {
  unreadCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  expanded,
  onToggleExpanded,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px 8px 0 0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Badge badgeContent={unreadCount} color="error">
          <FontAwesomeIcon icon={faBell} size="lg" color="#1976d2" />
        </Badge>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          EMS Notifications
        </Typography>
        {unreadCount > 0 && (
          <Typography variant="body2" color="error" sx={{ fontWeight: 'medium' }}>
            ({unreadCount} unread)
          </Typography>
        )}
      </Box>
      <IconButton onClick={onToggleExpanded} size="small">
        <FontAwesomeIcon 
          icon={expanded ? faChevronUp : faChevronDown} 
          color="#666"
        />
      </IconButton>
    </Box>
  );
};

export default NotificationHeader;


