import React from 'react';
import { Card, CardContent, Button, Typography, Box } from '@mui/material';
import { IconArrowUpRight } from '@tabler/icons-react';

import imgsvg from '../../../assets/images/backgrounds/welcome-bg2-2x-svg.svg';

const WelcomeCard = () => (
  <Card
    elevation={0}
    className="welcomebg"
    sx={{
      position: 'relative',
      backgroundColor: (theme) => `${theme.palette.mode === 'dark' ? theme.palette.background.paper : ''}`,
      '&:before': {
        content: `""`,
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `url(${imgsvg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '44%',
        bottom: 0,
        transform: (theme) => `${theme.direction === 'rtl' ? 'scaleX(-1)' : 'unset'}`,
        backgroundPosition:  (theme) => `${theme.direction === 'rtl' ? 'top -10px left -20px' : 'top -10px right -20px' }`,
        
      },
      borderWidth: '0px',
      pt: 0,
    }}
  >
    <CardContent>
      <Typography variant="h5" fontSize='18px' position='relative' zIndex='9' gutterBottom>
        Congratulation Johnathan
      </Typography>
      <Box mb={3}
        sx={{
          display: {
            sm: 'flex',
            xs: 'block',
          },
          alignItems: 'flex-end',
        }}
      >
        <Typography fontWeight="600" mb={0} mt={1} position='relative' zIndex='9' variant="h2" gutterBottom>
          $39,358
        </Typography>
        <Box ml="10px">
          <IconArrowUpRight width={14} height={14} />
        </Box>

        <Typography
          fontWeight="700"
          sx={{
            lineHeight: '30px',
            position: 'relative',
            zIndex: 9,
            marginTop: '12px',
            marginBottom: '0px',
          }}
          variant="h6"
          gutterBottom
        >
          +9%
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="secondary"
      >
        Download
      </Button>
    </CardContent>
  </Card>
);

export default WelcomeCard;
