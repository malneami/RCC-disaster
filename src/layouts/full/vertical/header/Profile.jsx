// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
  Stack, useMediaQuery
} from '@mui/material';
import * as dropdownData from './data';
import { useTheme } from "@mui/material/styles";
import user1 from '../../../../assets/images/users/1.jpg'
import bgLearn from '../../../../assets/images/backgrounds/unlimited-bg.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import {
  IconChevronDown,
  IconCreditCard,
  IconCurrencyDollar,
  IconMail,
  IconShield,
} from "@tabler/icons-react";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.primary.light;
  const error = theme.palette.error.main;
  const errorlight = theme.palette.error.light;
  const success = theme.palette.success.main;
  const successlight = theme.palette.success.light;

  /*profile data*/
  const profiledata = [
    {
      to: "/pages/account-settings",
      title: "My Profile",
      subtitle: "Account Settings",
      icon: <IconCurrencyDollar width="20" height="20" />,
      color: primary,
      lightcolor: primarylight,
    },
    {
      to: "/apps/email",
      title: "My Inbox",
      subtitle: "Messages & Emails",
      icon: <IconShield width="20" height="20" />,
      color: success,
      lightcolor: successlight,
    },
    {
      to: "/apps/kanban",
      title: "My Tasks",
      subtitle: "To-do and Daily Tasks",
      icon: <IconCreditCard width="20" height="20" />,
      color: error,
      lightcolor: errorlight,
    },
  ];

  return (
    <Box display='flex' gap={1}>
      {lgUp ? <Divider orientation="vertical" variant="middle" /> : null}

      <Button
        size="large"
        aria-label="menu"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            borderRadius: "9px",
          }),

        }}
        onClick={handleClick2}
      >
        <Avatar
          src={user1}
          alt={"ProfileImg"}
          sx={{
            width: 30,
            height: 30,
          }}
        />
        <Box
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },
            alignItems: "center",
          }}
        >
          <Typography
            color="textprimary"
            variant="h5"
            fontWeight="400"
            sx={{ ml: 1 }}
          >
            Hi,
          </Typography>
          <Typography
            variant="h5"
            fontWeight="700"
            sx={{
              ml: 1,
            }}
          >
            Johnathan
          </Typography>
          <IconChevronDown width="20" height="20" />
        </Box>
      </Button>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "360px",
            p: 4,
            pb: 2,
          },
        }}
      >
        <Typography variant="h4">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            src={user1}
            alt={"ProfileImg"}
            sx={{ width: 95, height: 95 }}
          />
          <Box>
            <Typography variant="h4" fontWeight={500} color="textPrimary">
              Johnathan Doe
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Administrator
            </Typography>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <IconMail width="18" height="18" />
              info@flexy.com
            </Typography>
          </Box>
        </Stack>
        <Divider />

        {profiledata.map((prf) => (
          <Box key={prf.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link to={prf.to}>
                <Stack direction="row" spacing={2}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink="0"
                    sx={{
                      bgcolor: prf.lightcolor,
                      color: prf.color,
                      boxShadow: "none",
                      minWidth: "50px",
                      width: "45px",
                      height: "45px",
                      borderRadius: "10px",
                    }}
                  >
                    {prf.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      className="text-hover"
                      color="textPrimary"
                      noWrap
                      sx={{
                        width: "240px",
                      }}
                    >
                      {prf.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="h6"
                      sx={{
                        width: "240px",
                      }}
                      noWrap
                    >
                      {prf.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>

          </Box>
        ))}

        <Box sx={{
          backgroundColor: (theme) => theme.palette.primary.light
        }} overflow='hidden'>

          <Stack direction='row' spacing={1} justifyContent='space-between'>
            <Box py={3} pl={3}>
              <Typography variant="h5" fontWeight={600} mb={2} color="textPrimary">
                Unlimited <br /> Access
              </Typography>
              <Button
                to="/auth/login"
                variant="contained"
                color="primary"
                component={Link}
              >
                Upgrade
              </Button>
            </Box>

            <img src={bgLearn} alt='bg-img' className='unlimited-img' />
          </Stack>




        </Box>

        <Box mt={2}>
          <Button
            to="/auth/login"
            variant="outlined"
            color="secondary"
            component={Link}
            fullWidth
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;


