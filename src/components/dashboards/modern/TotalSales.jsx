import React from 'react';
import { Typography, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { IconShoppingCart } from "@tabler/icons-react";

import ThemeSelect from '../analytical/ThemeSelect';
import DashboardCard from '../../shared/DashboardCard';

const TotalSales = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const grey = theme.palette.grey.A100;
  const optionstotalsales = {
    labels: ['2025', '2020', '2019'],

    chart: {
      height: 255,
      type: 'donut',
      foreColor: '#adb0bb',
      fontFamily: 'DM sans',
    },
    colors: [primary, secondary, grey, grey],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      colors: ['transparent'],
    },
    plotOptions: {
      pie: {
        donut: {
          size: '78%',
          background: 'transparent',
          labels: {
            show: false,
            name: {
              show: true,
              fontSize: '18px',
              color: undefined,
              offsetY: -10,
            },
            value: {
              show: false,
              color: '#98aab4',
            },
            total: {
              show: false,
              label: 'Our Visitors',
              color: '#98aab4',
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
    },
  };
  const seriestotalsales = [25, 35, 35];
  return (
    <DashboardCard title="Total Sales" subtitle="Overview of Years" action={<ThemeSelect />}>
      <Divider style={{ marginTop: '0px' }} />
      <Box
        display="flex"
        alignItems="center" justifyContent='space-between' mt={2} >
        <Typography
          color="textSecondary"
          variant="body1"
          sx={{
            fontSize: 'h5.fontSize',
          }}
        >
          Sales Yearly
        </Typography>

        <Typography
          variant="h2"
          fontWeight="700"
          sx={{
            marginBottom: '0',
          }}
          gutterBottom
        >
          8,364,398
        </Typography>
      </Box>
      {/* chart */}
      <Box mt={5} position='relative'>
        <Chart options={optionstotalsales} series={seriestotalsales} type="donut" height="255" />
        <Typography
          color="textSecondary"
          sx={{
            position: 'absolute',
            left: '46%',
            top: '45%',
          }}
        >
          <IconShoppingCart height="30" width="30" />
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="center" mt={5} gap={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              backgroundColor: primary,
              borderRadius: '50%',
              height: 8,
              width: 8,
            }}
          />
          <Typography color="textSecondary" variant="h6">
            2025
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              backgroundColor: secondary,
              borderRadius: '50%',
              height: 8,
              width: 8,
            }}
          />
          <Typography color="textSecondary" variant="h6">
            2020
          </Typography>
        </Box>
      </Box>
    </DashboardCard>
  );
};

export default TotalSales;
