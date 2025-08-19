import React from 'react';
import {
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import { IconDots, IconMessage2, IconStar, IconShoppingCart } from "@tabler/icons-react";
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '../../shared/DashboardCard';

const options = ['Action', 'Another Action', 'Something else here'];

const weeks = [
  {
    avatarbg: "primary.main",
    icon: <IconShoppingCart width="20" height="20" />,
    title: "Top Sales",
    subtitle: "Johnathan Doe",
    profit: "+68%",
  },
  {
    avatarbg: "warning.main",
    icon: <IconStar width="20" height="20" />,
    title: "Best Seller",
    subtitle: "MaterialPro Admin",
    profit: "+68%",
  },
  {
    avatarbg: "success.main",
    icon: <IconMessage2 width="20" height="20" />,
    title: "Most Commented",
    subtitle: "Ample Admin",
    profit: "+68%",
  },
];

const WeeklyStats = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const theme = useTheme();
  const primary = theme.palette.primary.main;

  // chart
  const optionsweekstats = {
    chart: {
      height: 145,
      type: 'area',
      foreColor: '#adb0bb',
      fontFamily: 'DM sans',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    colors: [primary],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'solid',
      opacity: 0.05,
    },
    tooltip: {
      theme: 'dark',
    },
    grid: {
      show: false,
      padding: {
        right: 0,
        left: 0,
      },
    },
  };
  const seriesweekstats = [
    {
      name: 'Weekly Stats',
      data: [40, 60, 50, 65],
    },
  ];
  return (
    (<DashboardCard
      title="Weekly Stats"
      subtitle="Average sales"
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
              <IconDots width="20" height="20" />
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
      footer={
        <Box>
          <Chart options={optionsweekstats} series={seriesweekstats} type="area" height="160" />
        </Box>
      }
    >
      {/* List */}
      <Box>
        {weeks.map((week) => (
          <Stack direction='row' mb={3} spacing={2} justifyContent='space-between' alignItems='center' key={week.title}>
            <Box display='flex' alignItems='center' gap={2}>
              <Avatar
                sx={{
                  backgroundColor: week.avatarbg,
                  color: '#fff', width: 48, height: 48
                }}
              >
                {week.icon}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="500">
                  {week.title}
                </Typography>

                <Typography color="textSecondary" variant="h6" fontWeight="400">
                  {week.subtitle}
                </Typography>
              </Box>
            </Box>
            <Chip
              color="default"
              size="small"
              sx={{
                borderRadius: '6px',
                backgroundColor: () => theme.palette.primary.light,
                color: () => theme.palette.text.secondary,
              }}
              label={week.profit}
            />
          </Stack>
        ))}
      </Box>
    </DashboardCard>)
  );
};

export default WeeklyStats;
