import React from 'react';
import { Card, CardContent, Typography, Fab, Box, Grid } from '@mui/material';
import {
  IconBox,
  IconChartBar,
  IconRefresh,
  IconUsers,
} from "@tabler/icons-react";
import { useTheme } from '@mui/material/styles';

const sales = [
  {
    btnbg: 'secondary.light',
    btntext: 'secondary.main',
    icon: <IconUsers size={20} />,
    digits: '39,354',
    subtext: 'Customers',
    profit: '-9',
    type: 'loss',
  },
  {
    btnbg: 'warning.light',
    btntext: 'warning.main',
    icon: <IconBox size={20} />,
    digits: '4,396',
    subtext: 'Products',
    profit: '+23',
    type: 'profit',
  },
  {
    btnbg: 'error.light',
    btntext: 'error.main',
    icon: <IconChartBar size={20} />,
    digits: '423,39',
    subtext: 'Sales',
    profit: '+38',
    type: 'profit',
  },
  {
    btnbg: 'success.light',
    btntext: 'success.main',
    icon: <IconRefresh size={20} />,
    digits: '835',
    subtext: 'Refunds',
    profit: '-12',
    type: 'loss',
  },
];

const TopCards = () => {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  return (
    <Card
      sx={{
        p: 0,
      }}
    >
      <Grid container spacing={0}>
        {sales.map((topcard) => (
          <Grid
            key={topcard.digits}
            size={{
              xs: 6,
              lg: 3,
              sm: 3
            }}>
            <CardContent
              sx={{
                borderRight: {
                  xs: '0',
                  sm: `1px solid ${borderColor}`,
                },
                padding: '30px',
                '& :last-child': {
                  borderRight: '0',
                },
              }}
            >
              <Fab
                size="large"
                aria-label="top-cards"
                sx={{
                  backgroundColor: topcard.btnbg,
                  color: topcard.btntext,
                  boxShadow: 'none',
                  width: 50, height: 50,
                  "&:hover": {
                    backgroundColor: topcard.btnbg,
                  }
                }}
              >
                {topcard.icon}
              </Fab>
              <Box
                display="flex"
                alignItems="center" mt={3}

              >
                <Typography variant="h3">{topcard.digits}</Typography>
                <Typography
                  color={topcard.type === 'profit' ? 'success.main' : 'error.main'}
                  variant="caption"
                  fontWeight="400" ml={1}>
                  {topcard.profit}%
                </Typography>
              </Box>
              <Typography color="textSecondary" variant="h6" fontWeight="400">
                {topcard.subtext}
              </Typography>
            </CardContent>
          </Grid>
        ))}
      </Grid>
    </Card>
  )
};

export default TopCards;
