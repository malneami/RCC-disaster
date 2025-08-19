import React from 'react';
import { Card, CardContent, Button, Typography } from '@mui/material';
import imgsvg from '../../../assets/images/backgrounds/welcome-bg.png';

const WelcomeCard = () => (
  <Card
    elevation={0}
    sx={{
      position: 'relative',
      backgroundColor: (theme) => theme.palette.primary.light,
      '&:before': {
        content: `""`,
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `url(${imgsvg})`,
        backgroundRepeat: 'no-repeat',
        transform: (theme) => `${theme.direction === 'rtl' ? 'scaleX(-1)' : 'unset'}`,
        backgroundPosition:
          (theme) => `${theme.direction === 'rtl' ? 'right 64px top' : 'right'}`,
      },
      borderWidth: '0px',
    }}
  >
    <CardContent>
      <Typography
        sx={{
          marginTop: '8px',
          marginBottom: '0px',
          lineHeight: '35px',
          position: 'relative',
          zIndex: 9,
        }}
        variant="h3" fontSize='20px'
        gutterBottom
      >
        Hey Johnathan, <br /> Download Latest Report
      </Typography>
      <Button
        sx={{
          marginTop: '15px',
          marginBottom: '20px',
        }}
        variant="contained"
        color="primary"
      >
        Download
      </Button>
    </CardContent>
  </Card>
);

export default WelcomeCard;

