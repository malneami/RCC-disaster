import React from 'react';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import type {
  NicuCapacityResponse,
  NicuHospitalCapacity,
} from '../../../services/nicuCapacityService';
import type { NicuCotType } from '../../../services/neonatalTransferService';
import { NICU_LEVEL_LABELS, COT_TYPE_LABELS } from '../constants/nicuConstants';

interface Props {
  capacity: NicuCapacityResponse | null;
  loading?: boolean;
}

const COT_TYPES: NicuCotType[] = ['INCUBATOR', 'OPEN_WARMER', 'VENTILATED'];

const vacancyColor = (vacant: number): 'success' | 'warning' | 'error' =>
  vacant > 2 ? 'success' : vacant > 0 ? 'warning' : 'error';

const NicuCapacityGrid: React.FC<Props> = ({ capacity, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!capacity || capacity.byHospital.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No NICU-capable facilities found. Mark facilities with NICU service and add NICU beds.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`Total cots: ${capacity.totals.total}`} />
        <Chip color="success" label={`Vacant: ${capacity.totals.vacant}`} />
        <Chip color="default" label={`Occupied: ${capacity.totals.occupied}`} />
        <Chip color="warning" label={`Reserved: ${capacity.totals.reserved}`} />
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Facility</TableCell>
              <TableCell>Level</TableCell>
              <TableCell align="right">Vacant / Total</TableCell>
              {COT_TYPES.map((ct) => (
                <TableCell key={ct} align="center">
                  {COT_TYPE_LABELS[ct].en}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {capacity.byHospital.map((h: NicuHospitalCapacity) => (
              <TableRow key={h.hospitalId}>
                <TableCell>{h.hospitalName}</TableCell>
                <TableCell>{h.nicuLevel ? NICU_LEVEL_LABELS[h.nicuLevel].en : '—'}</TableCell>
                <TableCell align="right">
                  <Chip size="small" color={vacancyColor(h.vacant)} label={`${h.vacant} / ${h.total}`} />
                </TableCell>
                {COT_TYPES.map((ct) => (
                  <TableCell key={ct} align="center">
                    {h.byCotType?.[ct]
                      ? `${h.byCotType[ct].vacant} / ${h.byCotType[ct].total}`
                      : '0 / 0'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NicuCapacityGrid;
