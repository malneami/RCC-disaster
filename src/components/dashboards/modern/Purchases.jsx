import React from 'react';
import { Card, CardContent, Typography, Box, Fab } from '@mui/material';
import { IconShoppingBag } from "@tabler/icons-react";

const Purchases = () => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="flex-start">
        <Typography
          variant="h4"
          fontWeight="500" mb={0}
          gutterBottom
        >
          Purchases
        </Typography>
        <Box
          sx={{
            marginLeft: 'auto',
          }}
        >
          <Fab
            size="medium"
            color="primary"
            aria-label="add">
            <IconShoppingBag width="24" height="24" />
          </Fab>
        </Box>
      </Box>
      <Typography
        variant="h1"
        fontWeight="500" mb={0} mt={4}
        gutterBottom
      >
        2,367
      </Typography>
      <Typography
        variant="h6"
        fontWeight="400"
        color="textSecondary" mb={0}
        gutterBottom
      >
        Monthly Sales
      </Typography>
    </CardContent>
  </Card>
);

export default Purchases;
