import React from 'react';
import { Typography, Chip, Box, Grid, Button, Stack, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import DashboardCard from '../../shared/DashboardCard';

const ProductPerformance = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const optionsproductperformance = {
    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      toolbar: {
        show: false,
      },
      foreColor: '#adb0bb',
      fontFamily: 'DM sans',
      sparkline: {
        enabled: false,
      },
    },
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        borderRadius: 9,
      },
    },
    colors: [primary, secondary],
    fill: {
      type: 'solid',
      opacity: 1,
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July'],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
    },

    tooltip: {
      theme: 'dark',
    },
  };
  const seriesproductperformance = [
    {
      name: 'Expence',
      data: [300, 300, 180, 320, 250, 300, 300],
    },
    {
      name: 'Budget',
      data: [60, 90, 80, 60, 70, 100, 80],
    },
  ];
  //   chart 2
  const seriesreport = [
    {
      name: 'Products Performance',
      data: [35, 60, 30, 55, 40],
    },
  ];

  const optionsreport = {
    colors: [primary],
    chart: {
      height: 30,
      toolbar: {
        show: false,
      },
      foreColor: '#adb0bb',
      fontFamily: "'DM Sans',sans-serif",
      sparkline: {
        enabled: true,
      },
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
    stroke: {
      show: true,
      width: 2,
      curve: 'smooth',
    },
    tooltip: {
      theme: 'dark',
    },
  };

  return (
    <DashboardCard
      title="Products Performance"
      subtitle="Latest new products"
      action={
        <Stack spacing={3} direction="row">
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
              Expence
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
              Budget
            </Typography>
          </Stack>
        </Stack>
      }
    >
      <Grid container mt={6}>
        <Grid
          sx={{
            borderRight: "1px solid" + theme.palette.divider,
            pr: 2,
          }}
          size={{
            xs: 12,
            lg: 5,
            sm: 5
          }}>
          <Box display="flex" alignItems="center">
            <Typography fontWeight="500" variant="h1" mr={1}>
              $93,438.78
            </Typography>
            <Chip
              sx={{
                backgroundColor: () => theme.palette.success.main,
                color: '#fff',
                borderRadius: '6px',
              }}
              size="small"
              label='23%'
            />
          </Box>
          <Typography color="textSecondary" variant="h5" fontWeight="400">
            Budget
          </Typography>
          <Box mt={3}>
            <Typography fontWeight="500" variant="h1">
              $32,839.00
            </Typography>
            <Typography color="textSecondary" variant="h5" fontWeight="400">
              Expense
            </Typography>
          </Box>
          <Box my={2} height="30px">
            <Chart
              options={optionsreport}
              series={seriesreport}
              type="line"
              height={30}
              width={"100%"}
            />
          </Box>
          <Button variant="contained" color="secondary">
            Download Report
          </Button>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 7,
            sm: 7
          }}>
          <Box height="280px" className="rounded-bars">
            <Chart
              options={optionsproductperformance}
              series={seriesproductperformance}
              type="bar"
              height={280}
              width={"100%"}
            />
          </Box>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default ProductPerformance;
