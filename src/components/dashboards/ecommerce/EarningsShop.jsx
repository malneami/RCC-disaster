import React from 'react';
import { Card, CardContent, Typography, Box, Fab, Button, Stack, Avatar } from '@mui/material';
import { IconCurrencyDollar } from "@tabler/icons-react";

import imgsvg from '../../../assets/images/backgrounds/welcome-bg-2x-svg.svg';

const EarningsShop = () => (
  <Card
    elevation={0}
    sx={{
      position: 'relative',
      backgroundColor: (theme) => theme.palette.primary.light,
      '&:before': {
        content: `""`,
        position: 'absolute',
        left: (theme) => `${theme.direction === 'rtl' ? 'unset' : '0'}`,
        right: (theme) => `${theme.direction === 'rtl' ? '0' : 'unset'}`,
        width: '100%',
        height: '100%',
        background: `url(${imgsvg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        transform: (theme) => `${theme.direction === 'rtl' ? 'scaleX(-1)' : 'unset'}`,
        backgroundPosition: (theme) =>
          `${theme.direction === 'rtl' ? 'right 85px center' : 'left 85px center'}`,
      },

      borderWidth: '0px',
    }}
  >
    <CardContent>
      <Stack direction='row' justifyContent='space-between' mb={2}>
        <Box>
          <Typography variant="h5" fontSize='18px'>
            Earnings
          </Typography>
          <Typography variant="h2" mt={1} color='primary.main'>
            $63,438.78
          </Typography>
        </Box>
        <Avatar
          sx={{
            backgroundColor: 'primary.main',
            color: '#fff',
            width: '48px',
            height: '48px',
          }}
        >
          <IconCurrencyDollar width="24" height="24" />
        </Avatar>
      </Stack>
      <Button variant="contained" color="primary">
        Download
      </Button>
    </CardContent>
  </Card>
);

export default EarningsShop;
