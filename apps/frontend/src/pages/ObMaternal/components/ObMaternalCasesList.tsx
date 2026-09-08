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
import { Add, Visibility, Edit, Assignment } from '@mui/icons-material';
import { format } from 'date-fns';
import type { ObMaternalTransfer } from '../../../services/obMaternalTransferService';
import type { PregnancyOutcome } from '../../../services/pregnancyOutcomeService';
import { pregnancyOutcomeService } from '../../../services/pregnancyOutcomeService';
import { OB_STATUS_OPTIONS, ACTIVATION_LEVEL_OPTIONS } from '../constants/obMaternalConstants';
import ViewObMaternalTransferDialog from './ViewObMaternalTransferDialog';
import EditObMaternalTransferDialog from './EditObMaternalTransferDialog';
import ViewPregnancyOutcomeDialog from './ViewPregnancyOutcomeDialog';
import CreatePregnancyOutcomeDialog from './CreatePregnancyOutcomeDialog';

interface ObMaternalCasesListProps {
  transfers: ObMaternalTransfer[];
  total: number;
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onRefresh: () => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onCreateClick: () => void;
}

const ObMaternalCasesList: React.FC<ObMaternalCasesListProps> = ({
  transfers,
  total,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  statusFilter,
  onStatusFilterChange,
  onCreateClick,
}) => {
  const [selectedTransfer, setSelectedTransfer] = useState<ObMaternalTransfer | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [outcomeViewOpen, setOutcomeViewOpen] = useState(false);
  const [outcomeCreateOpen, setOutcomeCreateOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<PregnancyOutcome | null>(null);
  const [outcomeTransfer, setOutcomeTransfer] = useState<ObMaternalTransfer | null>(null);

  const handleView = (t: ObMaternalTransfer) => {
    setSelectedTransfer(t);
    setViewOpen(true);
  };

  const handleEdit = (t: ObMaternalTransfer) => {
    setSelectedTransfer(t);
    setEditOpen(true);
  };

  const handleOutcome = async (t: ObMaternalTransfer) => {
    setOutcomeTransfer(t);
    const caseId = t.pregnancyCaseId;
    if (caseId) {
      try {
        const outcome = await pregnancyOutcomeService.getByCaseId(caseId);
        setSelectedOutcome(outcome);
        setOutcomeViewOpen(true);
      } catch {
        setSelectedOutcome(null);
        setOutcomeCreateOpen(true);
      }
    } else {
      setSelectedOutcome(null);
      setOutcomeCreateOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      CREATED: 'default',
      ACTIVATED: 'info',
      OB_CONNECTED: 'info',
      DECISION_MADE: 'primary',
      DISPATCHED: 'primary',
      DEPARTED: 'warning',
      ARRIVED: 'success',
      CLOSED: 'default',
    };
    return colors[status] || 'default';
  };

  const patientName = (t: ObMaternalTransfer) =>
    t.patient ? `${t.patient.firstName} ${t.patient.lastName}`.trim() : t.patientId;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {OB_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {total} transfer{total !== 1 ? 's' : ''}
        </Typography>
        <IconButton color="primary" onClick={onCreateClick} title="Create OB Maternal Transfer">
          <Add />
        </IconButton>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>Referring</TableCell>
              <TableCell>GA (wks)</TableCell>
              <TableCell>Activation</TableCell>
              <TableCell>Status</TableCell>
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
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }} color="text.secondary">
                  No OB maternal transfers found
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    {format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{patientName(t)}</TableCell>
                  <TableCell>{t.ticket?.ticketNumber || t.ticketId.slice(0, 8)}</TableCell>
                  <TableCell>{t.referringFacility?.name || '-'}</TableCell>
                  <TableCell>{t.gestationalAgeWeeks}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={ACTIVATION_LEVEL_OPTIONS.find((o) => o.value === t.activationLevel)?.label || t.activationLevel}
                      color={t.activationLevel === 'MATERNAL_RED' ? 'error' : 'warning'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={OB_STATUS_OPTIONS.find((o) => o.value === t.status)?.label || t.status}
                      color={getStatusColor(t.status)}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleView(t)} title="View">
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(t)} title="Edit">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOutcome(t)} title="Outcome">
                      <Assignment fontSize="small" />
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

      {selectedTransfer && (
        <>
          <ViewObMaternalTransferDialog
            open={viewOpen}
            transfer={selectedTransfer}
            onClose={() => { setViewOpen(false); setSelectedTransfer(null); }}
            onRefresh={onRefresh}
            onEdit={() => { setViewOpen(false); setEditOpen(true); }}
          />
          <EditObMaternalTransferDialog
            open={editOpen}
            transfer={selectedTransfer}
            onClose={() => { setEditOpen(false); setSelectedTransfer(null); }}
            onUpdated={onRefresh}
          />
        </>
      )}

      {selectedOutcome && (
        <ViewPregnancyOutcomeDialog
          open={outcomeViewOpen}
          outcome={selectedOutcome}
          onClose={() => {
            setOutcomeViewOpen(false);
            setSelectedOutcome(null);
            setOutcomeTransfer(null);
          }}
          onRefresh={onRefresh}
        />
      )}
      <CreatePregnancyOutcomeDialog
        open={outcomeCreateOpen}
        onClose={() => {
          setOutcomeCreateOpen(false);
          setOutcomeTransfer(null);
        }}
        onCreated={onRefresh}
        defaultCaseId={outcomeTransfer?.pregnancyCaseId}
      />
    </Box>
  );
};

export default ObMaternalCasesList;
