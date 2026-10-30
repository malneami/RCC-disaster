import React, { useState, useEffect, useCallback } from 'react';
import { Box, Alert, Button, Typography, Stack, Grid } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import NicuCapacityGrid from './components/NicuCapacityGrid';
import DestinationMatchPanel from './components/DestinationMatchPanel';
import {
  nicuCapacityService,
  type NicuCapacityResponse,
} from '../../services/nicuCapacityService';

const NicuCapacityPage: React.FC = () => {
  const [capacity, setCapacity] = useState<NicuCapacityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await nicuCapacityService.getCapacity();
      setCapacity(res);
    } catch (e) {
      setError('Failed to load NICU capacity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Box sx={{ p: 3 }}>
      <Helmet>
        <title>NICU Capacity Center · MASAR</title>
      </Helmet>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            NICU Capacity Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            مركز سعة حاضنات حديثي الولادة — عرض مباشر للأسرّة حسب المستوى والنوع
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <NicuCapacityGrid capacity={capacity} loading={loading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DestinationMatchPanel />
        </Grid>
      </Grid>
    </Box>
  );
};

export default NicuCapacityPage;
