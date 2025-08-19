import React from 'react';
import { Card, CardContent, Typography, Box, Fab } from '@mui/material';
import { IconCurrencyDollar } from "@tabler/icons-react";


const TotalEarnings = () => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="flex-start" justifyContent='space-between'>
        <Typography
          variant="h4" mb={0}
          gutterBottom
        >
          Total Earnings
        </Typography>

        <Fab
          size="medium"
          color="secondary"
          aria-label="add"
        >
          <IconCurrencyDollar width="24" height="24" />
        </Fab>
      </Box>
      <Typography
        variant="h1"
        fontWeight="500" mb={0} mt={4}
        gutterBottom
      >
        $93,438.78
      </Typography>
      <Typography
        variant="h6"
        fontWeight="400"
        color="textSecondary" mb={0}
        gutterBottom
      >
        Monthly Revenue
      </Typography>
    </CardContent>
  </Card>
);

export default TotalEarnings;
