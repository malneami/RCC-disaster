import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import type { PregnancyOutcome } from '../../../services/pregnancyOutcomeService';
import {
  MATERNAL_STATUS_OPTIONS,
  PERINATAL_STATUS_OPTIONS,
} from '../constants/obMaternalConstants';

interface ViewPregnancyOutcomeDialogProps {
  open: boolean;
  outcome: PregnancyOutcome;
  onClose: () => void;
  onRefresh: () => void;
}

const ViewPregnancyOutcomeDialog: React.FC<ViewPregnancyOutcomeDialogProps> = ({
  open,
  outcome,
  onClose,
}) => {
  const label = (v: string, opts: { value: string; label: string }[]) =>
    opts.find((o) => o.value === v)?.label || v;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pregnancy Outcome Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Case ID
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {outcome.caseId}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {format(new Date(outcome.createdAt), 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Maternal</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Maternal Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={label(outcome.maternalStatus, MATERNAL_STATUS_OPTIONS)}
                color={outcome.maternalStatus === 'DECEASED' ? 'error' : 'success'}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              ICU / Transfusion / Eclampsia / PPH
            </Typography>
            <Typography variant="body2">
              {[
                outcome.maternalIcuAdmission && 'ICU',
                outcome.massiveTransfusion && 'MT',
                outcome.eclampsiaEvent && 'Eclampsia',
                outcome.majorPph && 'Major PPH',
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Perinatal</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Perinatal Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={label(outcome.perinatalStatus, PERINATAL_STATUS_OPTIONS)}
                color={
                  outcome.perinatalStatus === 'STILLBIRTH' || outcome.perinatalStatus === 'NEONATAL_DEATH'
                    ? 'error'
                    : outcome.perinatalStatus === 'ALIVE'
                    ? 'success'
                    : 'default'
                }
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              NICU Admission
            </Typography>
            <Typography variant="body1">{outcome.nicuAdmission ? 'Yes' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Apgar 5
            </Typography>
            <Typography variant="body1">{outcome.apgar5 ?? '—'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Review Flag
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {outcome.reviewFlag ? (
                <Chip size="small" label="Flagged for Review" color="warning" />
              ) : (
                <Typography variant="body2">No</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPregnancyOutcomeDialog;
