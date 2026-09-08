import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import type { PregnancyOutcome } from '../../../services/pregnancyOutcomeService';
import { MATERNAL_STATUS_OPTIONS, PERINATAL_STATUS_OPTIONS } from '../constants/obMaternalConstants';
import ViewPregnancyOutcomeDialog from './ViewPregnancyOutcomeDialog';

interface PregnancyOutcomesListProps {
  outcomes: PregnancyOutcome[];
  total: number;
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onRefresh: () => void;
  maternalStatusFilter: string;
  perinatalStatusFilter: string;
  reviewFlagFilter: string;
  onMaternalStatusFilterChange: (v: string) => void;
  onPerinatalStatusFilterChange: (v: string) => void;
  onReviewFlagFilterChange: (v: string) => void;
  onCreateClick: () => void;
}

const PregnancyOutcomesList: React.FC<PregnancyOutcomesListProps> = ({
  outcomes,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  maternalStatusFilter,
  perinatalStatusFilter,
  reviewFlagFilter,
  onMaternalStatusFilterChange,
  onPerinatalStatusFilterChange,
  onReviewFlagFilterChange,
  onCreateClick,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<PregnancyOutcome | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const handleView = (o: PregnancyOutcome) => {
    setSelectedOutcome(o);
    setViewOpen(true);
  };

  const label = (v: string, opts: { value: string; label: string }[]) =>
    opts.find((o) => o.value === v)?.label || v;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Maternal Status</InputLabel>
          <Select
            value={maternalStatusFilter}
            label="Maternal Status"
            onChange={(e) => onMaternalStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {MATERNAL_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Perinatal Status</InputLabel>
          <Select
            value={perinatalStatusFilter}
            label="Perinatal Status"
            onChange={(e) => onPerinatalStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {PERINATAL_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Review</InputLabel>
          <Select
            value={reviewFlagFilter}
            label="Review"
            onChange={(e) => onReviewFlagFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Flagged</MenuItem>
            <MenuItem value="false">Not Flagged</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {total} outcome{total !== 1 ? 's' : ''}
        </Typography>
        <IconButton color="primary" onClick={onCreateClick} title="Create Pregnancy Outcome">
          <Add />
        </IconButton>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Case ID</TableCell>
              <TableCell>Maternal Status</TableCell>
              <TableCell>Perinatal Status</TableCell>
              <TableCell>Apgar 5</TableCell>
              <TableCell>ICU / NICU</TableCell>
              <TableCell>Review</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : outcomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }} color="text.secondary">
                  No pregnancy outcomes found
                </TableCell>
              </TableRow>
            ) : (
              outcomes.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {o.caseId.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={label(o.maternalStatus, MATERNAL_STATUS_OPTIONS)}
                      color={o.maternalStatus === 'DECEASED' ? 'error' : 'success'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={label(o.perinatalStatus, PERINATAL_STATUS_OPTIONS)}
                      color={
                        o.perinatalStatus === 'STILLBIRTH' || o.perinatalStatus === 'NEONATAL_DEATH'
                          ? 'error'
                          : o.perinatalStatus === 'ALIVE'
                          ? 'success'
                          : 'default'
                      }
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>{o.apgar5 ?? '—'}</TableCell>
                  <TableCell>
                    {o.maternalIcuAdmission ? 'ICU ' : ''}
                    {o.nicuAdmission ? 'NICU' : ''}
                    {!o.maternalIcuAdmission && !o.nicuAdmission ? '—' : ''}
                  </TableCell>
                  <TableCell>
                    {o.reviewFlag ? (
                      <Chip size="small" label="Review" color="warning" sx={{ fontSize: '0.7rem' }} />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleView(o)} title="View">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50]}
      />

      {selectedOutcome && (
        <ViewPregnancyOutcomeDialog
          open={viewOpen}
          outcome={selectedOutcome}
          onClose={() => {
            setViewOpen(false);
            setSelectedOutcome(null);
          }}
          onRefresh={onRefresh}
        />
      )}
    </Box>
  );
};

export default PregnancyOutcomesList;
