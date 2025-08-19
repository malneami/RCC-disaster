import { useState } from "react";

import { IconButton, Box, AppBar, useMediaQuery, Toolbar, styled, Stack, Divider } from '@mui/material';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { IconCategory2, IconMenu2, IconMoon, IconSun, IconX } from '@tabler/icons-react';
import Notifications from './Notification';
import Profile from './Profile';
import Search from './Search';
import Language from './Language';
import Navigation from './Navigation';
import MobileRightSidebar from './MobileRightSidebar'
import config from 'src/context/config';
import { useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import { CustomizerContext } from 'src/context/CustomizerContext';

const Header = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { activeMode, setActiveMode, setIsCollapse, isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);

  const TopbarHeight = config.topbarHeight;

  const theme = useTheme();
  const borderColor = theme.palette.divider;

  const AppBarStyled = styled(AppBar)(({ theme }) => ({

    boxShadow: "none",
    background: theme.palette.background.default,

    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: `${theme.palette.text.primary} !important`,
    paddingLeft: "16px !important",
    paddingRight: "16px !important"
  }));

  const CollpaseMenubar = styled(Box)(({ theme }) => ({
    position: 'absolute',
    left: '4px',
    top: '4px',
    right: '4px',
    padding: '7px 15px',
    background: theme.palette.background.paper,
    border: `1px solid ${borderColor}`,
    zIndex: 1,
    borderRadius: '7px'
  }));

  const [isVisible, setIsVisible] = useState(false);
  return (

    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* ------------------------------------------- */}
        {/* Toggle Button Sidebar */}
        {/* ------------------------------------------- */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={() => {
            // Toggle sidebar on both mobile and desktop based on screen size
            if (lgUp) {
              // For large screens, toggle between full-sidebar and mini-sidebar
              isCollapse === "full-sidebar" ? setIsCollapse("mini-sidebar") : setIsCollapse("full-sidebar");
            } else {
              // For smaller screens, toggle mobile sidebar
              setIsMobileSidebar(!isMobileSidebar);
            }
          }}
        >
          <IconMenu2 size="21" />

        </IconButton>

        {/* ------------------------------------------- */}
        {/* Search Dropdown */}
        {/* ------------------------------------------- */}
        {lgUp ? (<>  <Search /> </>) : null}
        {lgUp ? (
          <>
            <Navigation />
          </>
        ) : null}
        <Box flexGrow={1} />
        <Stack direction="row" gap={1} alignItems="center">
          {/* ------------------------------------------- */}
          {/* Light/Dark Theme */}
          {/* ------------------------------------------- */}
          <IconButton color="inherit">
            {activeMode === 'light' ? (
              <IconMoon size="21" onClick={() => setActiveMode("dark")}
              />
            ) : (
              <IconSun size="21" onClick={() => setActiveMode("light")}
              />
            )}
          </IconButton>

          {/* ------------------------------------------- */}
          {/* Language Dropdown */}
          {/* ------------------------------------------- */}
          {lgUp ? (<> <Language /> </>) : null}

         

          {/* ------------------------------------------- */}
          {/* Notification Dropdown */}
          {/* ------------------------------------------- */}
          {lgUp ? (<> <Notifications /> </>) : null}

          {lgDown ? <IconButton color="inherit" onClick={() => setIsVisible(!isVisible)}>
            <IconCategory2 size="21" />
          </IconButton> : null}

          {lgDown ? <MobileRightSidebar /> : null}

          {/* ------------------------------------------- */}


          <Profile />



          {isVisible && (
            <CollpaseMenubar>
              <Stack direction="row" justifyContent='space-between' spacing={1}>
                <Box display='flex' gap={1}>
                  <Notifications />
                  <Language />
                  <Search />
                </Box>
                <IconButton
                  color="inherit"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  <IconX size="21" />

                </IconButton>
              </Stack>
            </CollpaseMenubar>
          )}

        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;
