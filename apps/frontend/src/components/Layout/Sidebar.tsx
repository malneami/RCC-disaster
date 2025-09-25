import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
  Badge,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt,
  faFileAlt,
  faUsers,
  faHospital,
  faUserCog,
  faHeart,
  faBrain,
  faAmbulance,
  faShieldAlt,
  faBell,
} from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Refresh unread count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getNotifications({ isRead: false });
      setUnreadCount(response.notifications.length);
    } catch (error) {
      console.error('Failed to load unread notifications count:', error);
      setUnreadCount(0);
    }
  };

  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <FontAwesomeIcon icon={faTachometerAlt} />,
      path: '/dashboard',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR', 'CATH_LAB_USER'],
    },
    {
      text: 'Transfer Tickets',
      icon: <FontAwesomeIcon icon={faFileAlt} />,
      path: '/tickets',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR', 'CATH_LAB_USER'],
    },
    {
      text: 'Patients',
      icon: <FontAwesomeIcon icon={faUsers} />,
      path: '/patients',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
    },
    {
      text: 'Hospitals',
      icon: <FontAwesomeIcon icon={faHospital} />,
      path: '/hospitals',
      roles: ['ADMIN', 'RCC', 'EMS'],
    },
    {
      text: 'EMS Dashboard',
      icon: <FontAwesomeIcon icon={faAmbulance} />,
      path: '/ems-dashboard',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR'],
    },
    {
      text: 'Notification Center',
      icon: <FontAwesomeIcon icon={faBell} />,
      path: '/notifications',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR', 'CATH_LAB_USER'],
    },
  ];

  const portalItems = [
    {
      text: 'STEMI Portal',
      icon: <FontAwesomeIcon icon={faHeart} />,
      path: '/portals/stemi',
      roles: ['ADMIN', 'RCC', 'CATH_LAB_USER', 'DATA_COLLECTOR'],
      color: 'error',
    },
    {
      text: 'Stroke Portal',
      icon: <FontAwesomeIcon icon={faBrain} />,
      path: '/portals/stroke',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
      color: 'warning',
    },
    {
      text: 'Trauma Portal',
      icon: <FontAwesomeIcon icon={faAmbulance} />,
      path: '/portals/trauma',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
      color: 'info',
    },
    {
      text: 'EMS Portal',
      icon: <FontAwesomeIcon icon={faShieldAlt} />,
      path: '/portals/ems',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR'],
      color: 'success',
    },
  ];

  const adminItems = [
    {
      text: 'System Admin',
      icon: <FontAwesomeIcon icon={faUserCog} />,
      path: '/admin',
      roles: ['ADMIN'],
    },
  ];

  const hasRole = (allowedRoles: string[]) => {
    return user?.role && allowedRoles.includes(user.role);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 600 }}>
          RCC Healthcare
        </Typography>
      </Toolbar>
      
      <Box sx={{ px: 2, py: 1 }}>
        <Chip
          label={`${user?.role?.replace('_', ' ')}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Divider />

      <List>
        {navigationItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.text === 'Notification Center' ? (
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      <Divider sx={{ my: 1 }} />
      
      <Typography variant="overline" sx={{ px: 3, color: 'text.secondary' }}>
        Clinical Portals
      </Typography>
      
      <List>
        {portalItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: `${item.color}.light`,
                    color: 'white',
                    '&:hover': {
                      bgcolor: `${item.color}.main`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'inherit' : `${item.color}.main`,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {hasRole(['ADMIN']) && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" sx={{ px: 3, color: 'text.secondary' }}>
            Administration
          </Typography>
          <List>
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'secondary.light',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'secondary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default Sidebar;