import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { Bed } from '../services/bedService';
import { BedCard } from './BedCard';

interface BedGridProps {
  beds: Bed[];
  onBedClick?: (bed: Bed) => void;
  loading?: boolean;
}

export const BedGrid: React.FC<BedGridProps> = ({ beds, onBedClick, loading = false }) => {
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading beds...</Typography>
      </Box>
    );
  }

  if (beds.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No beds found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {beds.map((bed) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={bed.id}>
          <BedCard bed={bed} onClick={onBedClick} />
        </Grid>
      ))}
    </Grid>
  );
};

