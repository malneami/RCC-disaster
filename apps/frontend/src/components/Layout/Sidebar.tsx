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
  faChartLine,
  faVideo,
  faBed,
  faHeadset,
  faTools,
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

      // Listen for notification events
      const handleNotificationRead = () => {
        loadUnreadCount();
      };

      const handleNotificationDeleted = () => {
        loadUnreadCount();
      };

      window.addEventListener('notificationRead', handleNotificationRead);
      window.addEventListener('notificationDeleted', handleNotificationDeleted);

      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationRead', handleNotificationRead);
        window.removeEventListener('notificationDeleted', handleNotificationDeleted);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const summary = await notificationService.getNotificationSummary();
      setUnreadCount(summary.unreadNotifications);
    } catch (error) {
      console.error('Failed to load unread notifications count:', error);
      setUnreadCount(0);
    }
  };

  const navigationItems = [
    {
      text: 'Transfer Tickets',
      icon: <FontAwesomeIcon icon={faFileAlt} />,
      path: '/tickets',
      roles: ['ADMIN', 'RCC', 'CATH_LAB_USER'],
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
      roles: ['ADMIN', 'RCC', 'HOSPITAL_USER', 'ED_NURSE', 'UNIT_NURSE', 'BED_COORDINATOR'],
    },
    {
      text: 'Beds',
      icon: <FontAwesomeIcon icon={faBed} />,
      path: '/beds',
      roles: ['ADMIN', 'RCC'],
    },
    {
      text: 'Notification Center',
      icon: <FontAwesomeIcon icon={faBell} />,
      path: '/notifications',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR', 'CATH_LAB_USER', 'HOSPITAL_USER'],
    },
    {
      text: 'Communication',
      icon: <FontAwesomeIcon icon={faVideo} />,
      path: '/video-call',
      roles: ['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR', 'CATH_LAB_USER', 'HOSPITAL_USER'],
    },
  ];

  const dashboardItems = [
    {
      text: 'Main Dashboard',
      icon: <FontAwesomeIcon icon={faTachometerAlt} />,
      path: '/dashboard',
      roles: ['ADMIN', 'RCC', 'CATH_LAB_USER', 'HOSPITAL_USER'],
    },
    {
      text: 'EMS Dashboard',
      icon: <FontAwesomeIcon icon={faAmbulance} />,
      path: '/ems-dashboard',
      roles: ['ADMIN', 'RCC', 'EMS'],
    },
    {
      text: 'STEMI Command Center',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      path: '/portals/stemi/command-center',
      roles: ['ADMIN', 'RCC', 'CATH_LAB_USER'],
      color: 'error',
    },
    {
      text: 'Stroke Command Center',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      path: '/portals/stroke/command-center',
      roles: ['ADMIN', 'RCC'],
      color: 'warning',
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

  const supportItems = [
    {
      text: 'Support',
      icon: <FontAwesomeIcon icon={faHeadset} />,
      path: '/support',
      roles: ['ADMIN', 'RCC', 'EMS', 'ED_NURSE', 'UNIT_NURSE', 'BED_COORDINATOR', 'DATA_COLLECTOR', 'CATH_LAB_USER', 'HOSPITAL_USER'],
    },
    {
      text: 'Support Panel',
      icon: <FontAwesomeIcon icon={faTools} />,
      path: '/support-panel',
      roles: ['SUPPORT'],
    },
  ];

  const hasRole = (allowedRoles: string[]) => {
    return user?.role && allowedRoles.includes(user.role);
  };

  const handleNavigation = (path: string) => {
    // Special handling for hospital-specific roles - redirect to their assigned hospital
    const hospitalSpecificRoles = ['HOSPITAL_USER', 'ED_NURSE', 'UNIT_NURSE', 'BED_COORDINATOR'];
    if (user?.role && hospitalSpecificRoles.includes(user.role) && path === '/hospitals') {
      // If user has a hospitalId, redirect directly to their hospital dashboard
      if (user.hospitalId) {
        navigate(`/hospitals/${user.hospitalId}`);
      } else {
        // Fallback to my-hospital route which will handle the redirect
        navigate('/my-hospital');
      }
    } else {
      navigate(path);
    }
  };

  return (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: 'primary.main', 
            fontWeight: 600,
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          RCC Healthcare
        </Typography>
      </Toolbar>

      <Box sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
        <Chip
          label={`${user?.role?.replace('_', ' ')}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.75rem' },
          }}
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
                  mx: { xs: 0.5, md: 1 },
                  borderRadius: 1,
                  minHeight: 44,
                  py: { xs: 1.25, md: 1 },
                  transition: 'all 0.2s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
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
                    minWidth: { xs: 40, md: 56 },
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
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* Dashboards Section - only show if user has access to dashboard items */}
      {dashboardItems.filter(item => hasRole(item.roles)).length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 2, md: 3 }, 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', md: '0.75rem' },
            }}
          >
            Dashboards
          </Typography>
        </>
      )}

      <List>
        {dashboardItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: { xs: 0.5, md: 1 },
                  borderRadius: 1,
                  minHeight: 44,
                  py: { xs: 1.25, md: 1 },
                  transition: 'all 0.2s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: item.color ? `${item.color}.main` : 'primary.main',
                    outlineOffset: 2,
                  },
                  '&.Mui-selected': {
                    bgcolor: item.color ? `${item.color}.light` : 'primary.light',
                    color: 'white',
                    '&:hover': {
                      bgcolor: item.color ? `${item.color}.main` : 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'inherit' : (item.color ? `${item.color}.main` : 'text.secondary'),
                    minWidth: { xs: 40, md: 56 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* Clinical Portals Section - only show if user has access to portal items */}
      {portalItems.filter(item => hasRole(item.roles)).length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 2, md: 3 }, 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', md: '0.75rem' },
            }}
          >
            Clinical Portals
          </Typography>
        </>
      )}

      <List>
        {portalItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: { xs: 0.5, md: 1 },
                  borderRadius: 1,
                  minHeight: 44,
                  py: { xs: 1.25, md: 1 },
                  transition: 'all 0.2s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: `${item.color}.main`,
                    outlineOffset: 2,
                  },
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
                    minWidth: { xs: 40, md: 56 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* Support Section - visible to all users */}
      {supportItems.filter(item => hasRole(item.roles)).length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 2, md: 3 }, 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', md: '0.75rem' },
            }}
          >
            Support
          </Typography>
          <List>
            {supportItems
              .filter(item => hasRole(item.roles))
              .map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      mx: { xs: 0.5, md: 1 },
                      borderRadius: 1,
                      minHeight: 44,
                      py: { xs: 1.25, md: 1 },
                      transition: 'all 0.2s ease',
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
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
                        minWidth: { xs: 40, md: 56 },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', md: '1rem' },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </>
      )}

      {hasRole(['ADMIN']) && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography 
            variant="overline" 
            sx={{ 
              px: { xs: 2, md: 3 }, 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', md: '0.75rem' },
            }}
          >
            Administration
          </Typography>
          <List>
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: { xs: 0.5, md: 1 },
                    borderRadius: 1,
                    minHeight: 44,
                    py: { xs: 1.25, md: 1 },
                    transition: 'all 0.2s ease',
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'secondary.main',
                      outlineOffset: 2,
                    },
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
                      minWidth: { xs: 40, md: 56 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      },
                    }}
                  />
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