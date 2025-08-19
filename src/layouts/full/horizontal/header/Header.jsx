// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as React from 'react';
import { useState, useContext } from "react";
import {
  IconButton,
  Box,
  AppBar,
  useMediaQuery,
  Toolbar,
  styled,
  Stack
} from '@mui/material';


import { CustomizerContext } from 'src/context/CustomizerContext';
import Navigation from 'src/layouts/full/vertical/header/Navigation';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { IconCategory2, IconMenu2, IconMoon, IconSun, IconX } from '@tabler/icons-react';
import Notifications from 'src/layouts/full/vertical/header/Notification';

import Profile from 'src/layouts/full/vertical/header/Profile';
import Search from 'src/layouts/full/vertical/header/Search';
import Language from 'src/layouts/full/vertical/header/Language';
import Logo from 'src/layouts/full/shared/logo/Logo';
import config from "src/context/config";



const Header = () => {
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  const { activeMode, setActiveMode,  isLayout, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",

    [theme.breakpoints.up("lg")]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    margin: "0 auto",
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
    <AppBarStyled position="sticky" color="default" elevation={8}>
      <ToolbarStyled
        sx={{
          maxWidth: isLayout === "boxed" ? "1300px" : "100%!important",
        }}
      >
        <Box sx={{ width: lgDown ? "40px" : "auto", overflow: "hidden" }}>
          <Logo />
        </Box>
        {/* ------------------------------------------- */}
        {/* Toggle Button Sidebar */}
        {/* ------------------------------------------- */}
        {lgDown ? (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={() => setIsMobileSidebar(!isMobileSidebar)}

          >
            <IconMenu2 size="21" />
          </IconButton>
        ) : (
          ""
        )}
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
