import React from 'react';
import { Card, CardContent, Typography, Fab, Box, Stack } from '@mui/material';

import { IconCurrencyDollar } from "@tabler/icons-react";


const Earnings = () => (
  <Card
    sx={{
      backgroundColor: (theme) => theme.palette.primary.main,
    }}
  >
    <CardContent>
      <Stack direction='row' justifyContent='space-between'>
        <Typography
          variant="h3"
          sx={{
            color: '#fff',
          }}
        >
          Earnings
        </Typography>
        <Fab
          elevation="0"
          color="secondary"
          aria-label="dollar"
          sx={{
            width: '48px',
            height: '48px',
            boxShadow: 'none',
          }}
        >
          <IconCurrencyDollar width="24" height="24" />
        </Fab>
      </Stack>

      <Typography
        fontWeight="500"
        variant="h1" mt={3} color='#fff'
      >
        $93,438
      </Typography>
      <Typography
        variant="subtitle1"
        fontWeight="400" color='#fff' sx={{ opacity: 0.5 }}
      >
        Monthly revenue
      </Typography>
    </CardContent>
  </Card>
);

export default Earnings;
