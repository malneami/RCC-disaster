import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import type { NicuKpiSummary } from '../../../services/neonatalTransferService';

interface Props {
  summary: NicuKpiSummary | null;
  loading?: boolean;
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

const pct = (v?: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const mins = (v?: number | null) => (v == null ? '—' : `${Math.round(v)} min`);

const NicuKpiDashboard: React.FC<Props> = ({ summary }) => {
  if (!summary) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No KPI data available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Transfers" value={String(summary.totalTransfers)} color="#0E5A8A" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Red (unstable)" value={String(summary.redCount)} color="#EF4444" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Cot Match Rate" value={pct(summary.cotMatchRate)} color="#02C39A" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Normothermia on Arrival"
            value={pct(summary.normothermiaOnArrival)}
            color="#15B7CC"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Activation → Neonatologist"
            value={mins(summary.avgActivationToNeonatologist)}
            color="#0E5A8A"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Activation → Dispatch"
            value={mins(summary.avgActivationToDispatch)}
            color="#0E5A8A"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Dispatch → Arrival"
            value={mins(summary.avgDispatchToArrival)}
            color="#0E5A8A"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Declined for Capacity"
            value={pct(summary.declinedForCapacityRate)}
            color="#F5A524"
          />
        </Grid>
      </Grid>

      {summary.byHospital && summary.byHospital.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            By Referring Facility
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Facility</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Red</TableCell>
                  <TableCell align="right">Orange</TableCell>
                  <TableCell align="right">Yellow</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.byHospital.map((h) => (
                  <TableRow key={h.hospitalId}>
                    <TableCell>{h.hospitalName}</TableCell>
                    <TableCell align="right">{h.totalTransfers}</TableCell>
                    <TableCell align="right">{h.red}</TableCell>
                    <TableCell align="right">{h.orange}</TableCell>
                    <TableCell align="right">{h.yellow}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default NicuKpiDashboard;
