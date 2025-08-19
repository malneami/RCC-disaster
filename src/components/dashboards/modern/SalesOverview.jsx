import React from 'react';

import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { Typography, Box, Stack, Avatar } from "@mui/material";

import DashboardCard from '../../shared/DashboardCard';

const SalesOverview = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const optionssalesoverview = {
    grid: {
      show: true,
      borderColor: 'transparent',
      strokeDashArray: 2,
      padding: {
        left: 0,
        right: 0,
        bottom: -13,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '42%',
        endingShape: 'rounded',
        borderRadius: 5,
      },
    },

    colors: [primary, secondary],
    fill: {
      type: 'solid',
      opacity: 1,
    },
    chart: {
      toolbar: {
        show: false,
      },
      foreColor: '#adb0bb',
      fontFamily: "'DM Sans',sans-serif",
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    legend: {
      show: false,
    },
    xaxis: {
      type: 'category',
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      labels: {
        style: {
          cssClass: 'grey--text lighten-2--text fill-color',
        },
      },
    },
    yaxis: {
      show: true,
    },
    stroke: {
      show: true,
      width: 5,
      lineCap: 'butt',
      colors: ['transparent'],
    },
    tooltip: {
      theme: 'dark',
    },
  };
  const seriessalesoverview = [
    {
      name: 'Ample Admin',
      data: [355, 390, 300, 350, 390, 180],
    },
    {
      name: 'Pixel Admin',
      data: [280, 250, 325, 215, 250, 310],
    },
  ];
  return (
    <DashboardCard
      title="Sales Overview"
      action={
        <Stack spacing={3} mt={5} direction="row">
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: primary,
                svg: { display: "none" },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="primary.main">
              Ample
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: secondary,
                svg: { display: "none" },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="secondary.main">
              Pixel Admin
            </Typography>
          </Stack>
        </Stack>
      }
    >
      <Box pt={3} className='rounded-bars'>
        <Chart
          options={optionssalesoverview}
          series={seriessalesoverview}
          type="bar"
          height={265}
          width={"100%"}
        />
      </Box>
    </DashboardCard>
  );
};

export default SalesOverview;
