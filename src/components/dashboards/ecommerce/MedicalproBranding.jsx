import React from 'react';
import {
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Grid,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import { IconDots } from "@tabler/icons-react";


import img1 from '../../../assets/images/users/1.jpg';
import img2 from '../../../assets/images/users/2.jpg';
import img3 from '../../../assets/images/users/3.jpg';
import img4 from '../../../assets/images/users/4.jpg';

import DashboardCard from '../../shared/DashboardCard';

const options = ['Action', 'Another Action', 'Something else here'];

const MedicalproBranding = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    (<DashboardCard
        title="MedicalPro Branding"
        subtitle="Branding & Website"
        action={
          <Box>
            <Tooltip title="Action">
              <IconButton
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                size="large"
                aria-label="action"
              >
                <IconDots width={20} />
              </IconButton>
            </Tooltip>
            <Menu
              id="long-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                list: {
                  'aria-labelledby': 'long-button',
                }
              }}
            >
              {options.map((option) => (
                <MenuItem key={option} selected={option === 'Pyxis'} onClick={handleClose}>
                  {option}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        }
      >
      <Chip
        size="small"
        label="16 APR, 2025"
        sx={{
          backgroundColor: (theme) => theme.palette.secondary.light,
          color: (theme) => theme.palette.secondary.main,
          borderRadius: '6px',
          pl: 1,
          pr: 1,
        }}
      />
      <Box mt={3}>
        <Grid container spacing={0}>
          <Grid
            sx={{
              borderRight: '1px solid rgba(0,0,0,0.1)',
              pb: 2,
            }}
            size={{
              xs: 4,
              lg: 4
            }}>
            <Typography color="textSecondary" variant="h6" fontWeight="400">
              Due Date
            </Typography>
            <Typography variant="subtitle2" fontWeight="500">
              Oct 23, 2025
            </Typography>
          </Grid>
          <Grid
            sx={{
              borderRight: '1px solid rgba(0,0,0,0.1)',
              pb: 2,
              pl: 1,
            }}
            size={{
              xs: 4,
              lg: 4
            }}>
            <Typography color="textSecondary" variant="h6" fontWeight="400">
              Budget
            </Typography>
            <Typography variant="subtitle2" fontWeight="500">
              $98,500
            </Typography>
          </Grid>
          <Grid
            sx={{
              pl: 1,
              pb: 2,
            }}
            size={{
              xs: 4,
              lg: 4
            }}>
            <Typography color="textSecondary" variant="h6" fontWeight="400">
              Expense
            </Typography>
            <Typography variant="subtitle2" fontWeight="500">
              $63,000
            </Typography>
          </Grid>
        </Grid>
        <Divider />
      </Box>
      <Box pt={2} pb={3}>
        <Typography variant="h4" fontSize='18px'>Teams</Typography>
        <Box
          display="flex"
          alignItems="center" mt={1} gap={1}>
          <Chip
            size="small"
            label="Bootstrap"
            sx={{
              backgroundColor: (theme) => theme.palette.warning.main,
              color: '#fff',
              borderRadius: '6px',
              pl: 1,
              pr: 1,
            }}
          />
          <Chip
            size="small"
            label="Angular"
            sx={{
              backgroundColor: (theme) => theme.palette.error.main,
              color: '#fff',
              borderRadius: '6px',
              pl: 1,
              pr: 1,
            }}
          />
        </Box>
      </Box>
      <Divider />
      <Box py={2}>
        <Typography variant="h4" fontSize='18px'> Leaders</Typography>
        <Box
          display="flex"
          alignItems="center" mt={2} gap={1}
        >
          <Avatar
            src={img1}
            alt={img1}
            sx={{
              width: '35px',
              height: '35px',
            }}
          />
          <Avatar
            src={img2}
            alt={img2}
            sx={{
              width: '35px',
              height: '35px',
            }}
          />
          <Avatar
            src={img3}
            alt={img3}
            sx={{
              width: '35px',
              height: '35px',
            }}
          />
          <Avatar
            src={img4}
            alt={img4}
            sx={{
              width: '35px',
              height: '35px',
            }}
          />
        </Box>
      </Box>
      <Divider />
      <Box
        display="flex"
        alignItems="center" pt={3} justifyContent='space-between'>
        <Button variant="contained" color="secondary">
          Add
        </Button>

        <Typography color="textSecondary" variant="h6" fontWeight="400">
          36 Recent Transactions
        </Typography>
      </Box>
    </DashboardCard>)
  );
};

export default MedicalproBranding;
