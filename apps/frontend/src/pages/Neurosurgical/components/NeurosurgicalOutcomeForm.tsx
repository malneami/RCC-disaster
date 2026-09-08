import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  neurosurgicalService,
  NeurosurgicalCase,
  NeurosurgicalDisposition,
  NeurosurgicalOutcome,
  NeurosurgicalDefinitiveTreatment,
  DISPOSITION_LABELS,
  OUTCOME_LABELS,
  UpdateNeurosurgicalCaseData,
} from '../../../services/neurosurgicalService';
import { calculateNeuroOutcomeCompleteness } from './NeurosurgicalCaseCompleteness';

interface NeurosurgicalOutcomeFormProps {
  open: boolean;
  neuroCase: NeurosurgicalCase | null;
  onClose: () => void;
  onSuccess: (updated: NeurosurgicalCase) => void;
}

const NeurosurgicalOutcomeForm: React.FC<NeurosurgicalOutcomeFormProps> = ({
  open,
  neuroCase,
  onClose,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateNeurosurgicalCaseData>({});

  useEffect(() => {
    if (!neuroCase || !open) return;
    setForm({
      definitiveDisposition: neuroCase.definitiveDisposition || undefined,
      definitiveTreatment: neuroCase.definitiveTreatment || undefined,
      neurologicalOutcome: neuroCase.neurologicalOutcome || undefined,
      deteriorationDuringTransfer: neuroCase.deteriorationDuringTransfer,
      cardiacArrestDuringTransfer: neuroCase.cardiacArrestDuringTransfer,
      unplannedIntubation: neuroCase.unplannedIntubation,
      delayedIntervention: neuroCase.delayedIntervention,
      wrongDestination: neuroCase.wrongDestination,
      repeatTransferRequired: neuroCase.repeatTransferRequired,
      notes: neuroCase.notes || undefined,
    });
  }, [neuroCase, open]);

  if (!neuroCase) return null;

  const closed = neuroCase.status === 'CLOSED';
  const outcomePct = calculateNeuroOutcomeCompleteness({
    ...neuroCase,
    ...form,
  } as NeurosurgicalCase);

  const handleSave = async (alsoClose: boolean) => {
    setSaving(true);
    try {
      let updated = await neurosurgicalService.update(neuroCase.id, form);
      if (alsoClose) {
        updated = await neurosurgicalService.close(neuroCase.id);
        enqueueSnackbar('Outcome saved and case closed', { variant: 'success' });
      } else {
        enqueueSnackbar('Outcome / disposition saved', { variant: 'success' });
      }
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to save outcome', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Outcome & Disposition
        {neuroCase.ticket?.ticketNumber ? ` — ${neuroCase.ticket.ticketNumber}` : ''}
        <Chip
          size="small"
          label={`${outcomePct}% outcome`}
          color={outcomePct >= 100 ? 'success' : outcomePct >= 50 ? 'warning' : 'error'}
          sx={{ ml: 1 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Fill definitive neurosurgical disposition and outcome separately from the
          case pathway data. This contributes 50% of case completeness.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Definitive neurosurgical disposition
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={closed}>
              <InputLabel>Disposition</InputLabel>
              <Select
                label="Disposition"
                value={form.definitiveDisposition || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    definitiveDisposition: (e.target.value ||
                      undefined) as NeurosurgicalDisposition,
                  }))
                }
              >
                <MenuItem value="">—</MenuItem>
                {(Object.keys(DISPOSITION_LABELS) as NeurosurgicalDisposition[]).map(
                  (k) => (
                    <MenuItem key={k} value={k}>
                      {DISPOSITION_LABELS[k]}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={closed}>
              <InputLabel>Definitive treatment</InputLabel>
              <Select
                label="Definitive treatment"
                value={form.definitiveTreatment || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    definitiveTreatment: (e.target.value ||
                      undefined) as NeurosurgicalDefinitiveTreatment,
                  }))
                }
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="SURGERY">Surgery</MenuItem>
                <MenuItem value="ICU_MANAGEMENT">ICU management</MenuItem>
                <MenuItem value="CONSERVATIVE_TREATMENT">Conservative treatment</MenuItem>
                <MenuItem value="NO_NEUROSURGICAL_INTERVENTION">
                  No neurosurgical intervention
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Outcome
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" disabled={closed}>
              <InputLabel>Neurological outcome</InputLabel>
              <Select
                label="Neurological outcome"
                value={form.neurologicalOutcome || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    neurologicalOutcome: (e.target.value ||
                      undefined) as NeurosurgicalOutcome,
                  }))
                }
              >
                <MenuItem value="">—</MenuItem>
                {(Object.keys(OUTCOME_LABELS) as NeurosurgicalOutcome[]).map((k) => (
                  <MenuItem key={k} value={k}>
                    {OUTCOME_LABELS[k]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.deteriorationDuringTransfer}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deteriorationDuringTransfer: e.target.checked,
                    }))
                  }
                />
              }
              label="Deterioration during transfer"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.cardiacArrestDuringTransfer}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cardiacArrestDuringTransfer: e.target.checked,
                    }))
                  }
                />
              }
              label="Cardiac arrest during transfer"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.unplannedIntubation}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      unplannedIntubation: e.target.checked,
                    }))
                  }
                />
              }
              label="Unplanned intubation"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.delayedIntervention}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      delayedIntervention: e.target.checked,
                    }))
                  }
                />
              }
              label="Delayed intervention"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.wrongDestination}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      wrongDestination: e.target.checked,
                    }))
                  }
                />
              }
              label="Wrong destination"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.repeatTransferRequired}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      repeatTransferRequired: e.target.checked,
                    }))
                  }
                />
              }
              label="Repeat transfer required"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Notes"
              value={form.notes || ''}
              disabled={closed}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {!closed && (
          <>
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              variant="outlined"
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              Save
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              variant="contained"
              color="primary"
            >
              Save & close case
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NeurosurgicalOutcomeForm;
