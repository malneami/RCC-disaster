import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  useMediaQuery,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars,
  faUserCircle,
  faCog,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useFullscreen } from '../../contexts/FullscreenContext';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { DisasterSidebar } from '../DisasterSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 280;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isFullscreen } = useFullscreen();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  
  // Use 768px breakpoint for mobile/tablet detection
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {!isFullscreen && (
        <AppBar
        position="fixed"
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          ml: isMobile ? 0 : `${drawerWidth}px`,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: isMobile ? 'flex' : 'none',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <FontAwesomeIcon icon={faBars} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box
              component="img"
              src="/masar-wordmark.png"
              alt="MASAR - Critical Pathway Resource Control"
              sx={{
                height: { xs: 28, md: 36 },
                objectFit: 'contain',
              }}
            />
            <Box
              component="img"
              src="/jazan-health-cluster-logo.png"
              alt="Jazan Health Cluster"
              sx={{
                height: 32,
                objectFit: 'contain',
                opacity: 0.7,
                display: { xs: 'none', md: 'block' },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationBell />
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              disableScrollLock
              disableAutoFocus
              disableEnforceFocus
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigate('/profile')}>
                <ListItemIcon>
                  <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '16px' }} />
                </ListItemIcon>
                Profile
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={() => handleNavigate('/admin')}>
                  <ListItemIcon>
                    <FontAwesomeIcon icon={faCog} style={{ fontSize: '16px' }} />
                  </ListItemIcon>
                  Settings
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '16px' }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      )}

      {!isFullscreen && (
        <Box
        component="nav"
        sx={{ 
          width: isMobile ? 0 : drawerWidth, 
          flexShrink: 0,
          transition: 'width 0.3s ease',
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: isMobile ? 'block' : 'none',
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'transform 0.3s ease-in-out',
            },
          }}
        >
          <Sidebar />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: isMobile ? 'none' : 'block',
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0.5, sm: 1, md: 1.5 },
          width: isFullscreen ? '100%' : (isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`),
          mt: isFullscreen ? '0px' : '64px',
          transition: 'width 0.3s ease',
        }}
      >
        {children}
      </Box>

      {!isFullscreen && <DisasterSidebar />}
    </Box>
  );
};

export default Layout;