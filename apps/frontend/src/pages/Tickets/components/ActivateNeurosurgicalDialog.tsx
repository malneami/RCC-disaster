import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Checkbox,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Psychology as NeuroIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  neurosurgicalService,
  ActivateFromTicketData,
  TRIGGER_REASON_LABELS,
  NeurosurgicalTriggerReason,
  NeurosurgicalPupils,
  NeurosurgicalGcsTrend,
  NeurosurgicalSeverity,
} from '../../../services/neurosurgicalService';

interface ActivateNeurosurgicalDialogProps {
  ticketId: string;
  disabled?: boolean;
  onActivated: () => void;
}

const ActivateNeurosurgicalDialog: React.FC<ActivateNeurosurgicalDialogProps> = ({
  ticketId,
  disabled,
  onActivated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ActivateFromTicketData>({
    triggerReason: 'TRAUMATIC_BRAIN_INJURY',
    newFocalDeficit: false,
    seizure: false,
    intubated: false,
    hemodynamicInstability: false,
    anticoagulantUse: false,
  });

  const handleActivate = async () => {
    setSaving(true);
    try {
      await neurosurgicalService.activateFromTicket(ticketId, form);
      enqueueSnackbar('Neurosurgical pathway activated', { variant: 'success' });
      setOpen(false);
      onActivated();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Activation failed', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="warning"
        startIcon={<NeuroIcon />}
        disabled={disabled}
        onClick={() => setOpen(true)}
        sx={{ ml: 1 }}
      >
        Activate Neurosurgical Pathway
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activate Neurosurgical Pathway</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Trigger reason</InputLabel>
                <Select
                  label="Trigger reason"
                  value={form.triggerReason}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      triggerReason: e.target.value as NeurosurgicalTriggerReason,
                    }))
                  }
                >
                  {(Object.keys(TRIGGER_REASON_LABELS) as NeurosurgicalTriggerReason[]).map(
                    (k) => (
                      <MenuItem key={k} value={k}>
                        {TRIGGER_REASON_LABELS[k]}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Grid>
            {form.triggerReason === 'OTHER' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Other reason"
                  value={form.triggerReasonOther || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, triggerReasonOther: e.target.value }))
                  }
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="GCS"
                value={form.gcs ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gcs: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                inputProps={{ min: 3, max: 15 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>GCS trend</InputLabel>
                <Select
                  label="GCS trend"
                  value={form.gcsTrend || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gcsTrend: (e.target.value || undefined) as NeurosurgicalGcsTrend,
                    }))
                  }
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="IMPROVING">Improving</MenuItem>
                  <MenuItem value="STABLE">Stable</MenuItem>
                  <MenuItem value="DETERIORATING">Deteriorating</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Pupils</InputLabel>
                <Select
                  label="Pupils"
                  value={form.pupils || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pupils: (e.target.value || undefined) as NeurosurgicalPupils,
                    }))
                  }
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="EQUAL">Equal</MenuItem>
                  <MenuItem value="UNEQUAL">Unequal</MenuItem>
                  <MenuItem value="FIXED">Fixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity (optional override)</InputLabel>
                <Select
                  label="Severity (optional override)"
                  value={form.severity || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      severity: (e.target.value || undefined) as NeurosurgicalSeverity,
                    }))
                  }
                >
                  <MenuItem value="">Auto</MenuItem>
                  <MenuItem value="RED">Red</MenuItem>
                  <MenuItem value="ORANGE">Orange</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {form.severity && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Override reason"
                  value={form.severityOverrideReason || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      severityOverrideReason: e.target.value,
                    }))
                  }
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.newFocalDeficit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newFocalDeficit: e.target.checked }))
                    }
                  />
                }
                label="New focal deficit"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.seizure}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, seizure: e.target.checked }))
                    }
                  />
                }
                label="Seizure"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.intubated}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, intubated: e.target.checked }))
                    }
                  />
                }
                label="Intubated"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.hemodynamicInstability}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hemodynamicInstability: e.target.checked,
                      }))
                    }
                  />
                }
                label="Hemodynamic instability"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.anticoagulantUse}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        anticoagulantUse: e.target.checked,
                      }))
                    }
                  />
                }
                label="Anticoagulant use"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={saving}
            onClick={handleActivate}
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActivateNeurosurgicalDialog;
