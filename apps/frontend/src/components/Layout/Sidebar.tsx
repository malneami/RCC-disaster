import React from 'react';
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
  faClipboardCheck,
  faExclamationTriangle,
  faBaby,
} from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    {
      text: 'Recordings',
      icon: <FontAwesomeIcon icon={faVideo} />,
      path: '/recordings',
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
      text: 'Disaster Management',
      icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
      path: '/disaster-management',
      roles: ['ADMIN', 'RCC', 'EMS'],
      color: 'warning',
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
      roles: ['ADMIN', 'RCC', 'EMS'],
      color: 'success',
    },
    {
      text: 'OB Maternal Transfer Portal',
      icon: <FontAwesomeIcon icon={faBaby} />,
      path: '/portals/ob-maternal',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
      color: 'secondary',
    },
    {
      text: 'Neurosurgical Pathway Portal',
      icon: <FontAwesomeIcon icon={faBrain} />,
      path: '/portals/neurosurgical',
      roles: ['ADMIN', 'RCC', 'HOSPITAL_USER', 'ED_NURSE', 'DATA_COLLECTOR'],
      color: 'warning',
    },
  ];

  const adminItems = [
    {
      text: 'Data Quality Audit',
      icon: <FontAwesomeIcon icon={faClipboardCheck} />,
      path: '/data-quality/audit',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
    },
    {
      text: 'MCP Audit Dashboard',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      path: '/audit/dashboard',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
    },
    {
      text: 'Audit Reports',
      icon: <FontAwesomeIcon icon={faClipboardCheck} />,
      path: '/audit/reports',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
    },
    {
      text: 'Audit Events',
      icon: <FontAwesomeIcon icon={faBell} />,
      path: '/audit/events',
      roles: ['ADMIN', 'RCC', 'DATA_COLLECTOR'],
    },
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
    const userRoleUpper = (user?.role || '').toUpperCase();
    return userRoleUpper && allowedRoles.some((r) => r.toUpperCase() === userRoleUpper);
  };

  const handleNavigation = (path: string) => {
    // Special handling for hospital-specific roles - redirect to their assigned hospital
    const hospitalSpecificRoles = ['HOSPITAL_USER', 'ED_NURSE', 'UNIT_NURSE', 'BED_COORDINATOR'];
    const userRoleUpper = (user?.role || '').toUpperCase();
    if (user?.role && hospitalSpecificRoles.some((r) => r.toUpperCase() === userRoleUpper) && path === '/hospitals') {
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
      <Toolbar sx={{ justifyContent: 'center', px: 1 }}>
        <Box
          component="img"
          src="/masar-wordmark.png"
          alt="MASAR - Critical Pathway Resource Control"
          sx={{
            width: '100%',
            maxWidth: 200,
            objectFit: 'contain',
          }}
        />
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

      {/* Administration Section - only show if user has access to admin items */}
      {(() => {
        const visibleAdminItems = adminItems.filter((item) => hasRole(item.roles));
        return visibleAdminItems.length > 0 ? (
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
              {visibleAdminItems.map((item) => (
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
        ) : null;
      })()}
    </Box>
  );
};

export default Sidebar;