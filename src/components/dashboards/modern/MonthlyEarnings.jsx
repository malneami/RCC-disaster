import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import Chart from 'react-apexcharts';
import { IconArrowUpLeft } from "@tabler/icons-react";

import { useTheme } from '@mui/material/styles';

const MonthlyEarnings = () => {
  const theme = useTheme();

  const optionsmonthlychart = {
    grid: {
      show: true,
      borderColor: 'transparent',
      strokeDashArray: 2,
      padding: {
        left: 0,
        right: 0,
        bottom: 0,
      },
    },
    colors: ['rgba(255,255,255,0.6)'],
    chart: {
      toolbar: {
        show: false,
      },
      foreColor: '#adb0bb',
      fontFamily: "'DM Sans',sans-serif",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        barHeight: '100%',
        borderRadius: 2
      },
    },
    dataLabels: {
      enabled: false,
    },

    legend: {
      show: false,
    },
    stroke: {
      show: true,
      width: 2,
      curve: 'smooth',
      colors: ['transparent'],
    },
    tooltip: {
      theme: 'dark',
    },
  };
  const seriesmonthlychart = [
    {
      name: 'Monthly Earnings',
      data: [6, 10, 9, 11, 9, 10, 12, 10, 9, 11, 9, 10, 12],
    },
  ];
  return (
    <Card
      sx={{
        backgroundColor: () => theme.palette.primary.main,
        color: 'white',
      }}
    >
      <CardContent>
        <Typography
          variant="h4" mb={0}
          gutterBottom
        >
          Monthly Earnings
        </Typography>
        <Box mt={2}>
          <Chart
            options={optionsmonthlychart}
            series={seriesmonthlychart}
            type="bar"
            height="65px"
          />
        </Box>
        <Box mt={3}
          sx={{
            display: {
              sm: 'flex',
              xs: 'block',
            },
            alignItems: 'flex-end',
          }}
        >
          <Typography position='relative' zIndex='9'
            variant="h2"
          >
            $39,358
          </Typography>
          <Box ml="10px">
            <IconArrowUpLeft width={18} height={18} />
          </Box>

          <Typography position='relative' zIndex='9'
            fontWeight="500"
            variant="h6"
            gutterBottom
          >
            +9 this week
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MonthlyEarnings;
