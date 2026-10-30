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
import type { NeonatalTransfer } from '../../../services/neonatalTransferService';
import {
  STATUS_LABELS,
  ACUITY_LABELS,
  ACUITY_COLORS,
  NICU_LEVEL_LABELS,
  COT_TYPE_LABELS,
} from '../constants/nicuConstants';

interface Props {
  transfers: NeonatalTransfer[];
  loading?: boolean;
  onSelect?: (t: NeonatalTransfer) => void;
}

const NeonatalCasesList: React.FC<Props> = ({ transfers, loading, onSelect }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (transfers.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No neonatal transfers yet.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ticket</TableCell>
            <TableCell>Neonate</TableCell>
            <TableCell>GA</TableCell>
            <TableCell>Acuity</TableCell>
            <TableCell>Req. Level</TableCell>
            <TableCell>Req. Cot</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Referring</TableCell>
            <TableCell>Destination</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transfers.map((t) => (
            <TableRow
              key={t.id}
              hover
              sx={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(t)}
            >
              <TableCell>{t.ticket?.ticketNumber ?? t.ticketId.slice(0, 8)}</TableCell>
              <TableCell>
                {t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : t.patientId.slice(0, 8)}
              </TableCell>
              <TableCell>
                {t.gestationalAgeWeeks}
                {t.gestationalAgeDays != null ? `+${t.gestationalAgeDays}` : ''} wk
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={ACUITY_LABELS[t.acuityLevel].en}
                  color={ACUITY_COLORS[t.acuityLevel]}
                />
              </TableCell>
              <TableCell>{NICU_LEVEL_LABELS[t.requiredNicuLevel].en}</TableCell>
              <TableCell>{COT_TYPE_LABELS[t.requiredCotType].en}</TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" label={STATUS_LABELS[t.status].en} />
              </TableCell>
              <TableCell>{t.referringFacility?.name ?? '—'}</TableCell>
              <TableCell>{t.destinationHospital?.name ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NeonatalCasesList;
