import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Stack } from '@mui/material';
import { IconShoppingCart } from "@tabler/icons-react";
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

const YearlySales = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  // chart
  const optionsyearlysales = {
    labels: ['2025', '2020', '2019', '2018'],

    chart: {
      height: 145,
      type: 'donut',
      foreColor: '#adb0bb',
      fontFamily: 'DM sans',
    },
    colors: [primary, secondary, '#fec90f', '#ecf0f2'],
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
          size: '65%',
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
  const seriesyearlysales = [25, 25, 25, 25];
  return (
    (<Card>
      <CardContent>
        <Grid container spacing={0}>
          <Grid
            size={{
              xs: 6,
              xl: 7
            }}>
            <Typography
              fontWeight="500"
              variant="h1" lineHeight='35px'>
              43,246
            </Typography>
            <Typography color="textSecondary" variant="h6">
              Yearly sales
            </Typography>

            <Stack direction='row' gap={2} mb={1} mt={4}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Box
                  sx={{
                    backgroundColor: () => theme.palette.primary.main,
                    borderRadius: '50%',
                    height: 8,
                    width: 8,
                    mr: 1,
                  }}
                />
                <Typography color="textSecondary" variant="body2" fontWeight="400">
                  2025
                </Typography>
              </Stack>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Box
                  sx={{
                    backgroundColor: () => theme.palette.secondary.main,
                    borderRadius: '50%',
                    height: 8,
                    width: 8,
                    mr: 1,
                  }}
                />
                <Typography color="textSecondary" variant="body2" fontWeight="400">
                  2020
                </Typography>
              </Stack>
            </Stack>

            <Stack direction='row' gap={2}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Box
                  sx={{
                    backgroundColor: () => theme.palette.warning.main,
                    borderRadius: '50%',
                    height: 8,
                    width: 8,
                    mr: 1,
                  }}
                />
                <Typography color="textSecondary" variant="body2" fontWeight="400">
                  2019
                </Typography>
              </Stack>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Box
                  sx={{
                    backgroundColor: () => theme.palette.grey.A200,
                    borderRadius: '50%',
                    height: 8,
                    width: 8,
                    mr: 1,
                  }}
                />
                <Typography color="textSecondary" variant="body2" fontWeight="400">
                  2018
                </Typography>
              </Stack>
            </Stack>

          </Grid>
          <Grid
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            size={{
              xs: 6,
              xl: 5
            }}>
            {/* chart */}
            <Box display='flex' alignItems='center' justifyContent='center' width='150px'
              sx={{
                position: 'relative',
                mt: 1, ml: 'auto'
              }}
            >
              <Chart
                options={optionsyearlysales}
                series={seriesyearlysales}
                type="donut"
                height="145"
              />
              <Typography
                color="textSecondary"
                sx={{
                  position: 'absolute',
                  left: '42%',
                  top: '41%',
                }}
              >
                <IconShoppingCart height="24" width="24" />
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>)
  );
};

export default YearlySales;
