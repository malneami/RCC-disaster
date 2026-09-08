import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  NeurosurgicalCase,
  UpdateNeurosurgicalCaseData,
  TRIGGER_REASON_LABELS,
  DISPOSITION_LABELS,
  OUTCOME_LABELS,
  NeurosurgicalTriggerReason,
  NeurosurgicalPupils,
  NeurosurgicalGcsTrend,
  NeurosurgicalSeverity,
} from '../../../services/neurosurgicalService';
import PerformanceTimingsCard from './NeurosurgicalCaseDetails/PerformanceTimingsCard';
import KPIPerformanceCard from './NeurosurgicalCaseDetails/KPIPerformanceCard';

function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

interface NeurosurgicalCaseDialogProps {
  selected: NeurosurgicalCase | null;
  form: UpdateNeurosurgicalCaseData;
  setForm: React.Dispatch<React.SetStateAction<UpdateNeurosurgicalCaseData>>;
  saving: boolean;
  onDismiss: () => void;
  onSave: () => void;
}

const NeurosurgicalCaseDialog: React.FC<NeurosurgicalCaseDialogProps> = ({
  selected,
  form,
  setForm,
  saving,
  onDismiss,
  onSave,
}) => {
  const closed = selected?.status === 'CLOSED';

  const setTimestamp = (
    key:
      | 'doorTime'
      | 'doorOutTime'
      | 'rccActivationTime'
      | 'ctScanStartTime'
      | 'ctReportFinalTime'
      | 'neurosurgeonNotifiedAt'
      | 'neurosurgeonConnectedAt'
      | 'definitiveCareReachedAt',
    local: string,
  ) => {
    setForm((f) => ({
      ...f,
      [key]: fromDateTimeLocal(local),
    }));
  };

  return (
    <Dialog open={!!selected} onClose={onDismiss} maxWidth="md" fullWidth>
      <DialogTitle>
        Neurosurgical Case
        {selected?.ticket?.ticketNumber ? ` — ${selected.ticket.ticketNumber}` : ''}
        {selected?.reviewFlag && (
          <Chip size="small" color="error" label="Review" sx={{ ml: 1 }} />
        )}
      </DialogTitle>
      <DialogContent dividers>
        {selected && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2">Ticket snapshot</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body2">
                  {selected.patient
                    ? `${selected.patient.firstName} ${selected.patient.lastName}`
                    : '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  MRN / National ID
                </Typography>
                <Typography variant="body2">
                  {selected.patient?.mrn || selected.patient?.nationalId || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Origin
                </Typography>
                <Typography variant="body2">
                  {selected.originHospital?.name || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">{selected.status}</Typography>
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2">Critical timestamps (KPI)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" disabled={closed}>
                  <InputLabel>CT location</InputLabel>
                  <Select
                    label="CT location"
                    value={form.ctLocation || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ctLocation: (e.target.value || undefined) as
                          | 'ORIGIN'
                          | 'DESTINATION'
                          | undefined,
                      }))
                    }
                  >
                    <MenuItem value="">— (N/A for CT KPIs)</MenuItem>
                    <MenuItem value="ORIGIN">
                      Origin (hospital with CT) — Door→CT ≤15 / report ≤30
                    </MenuItem>
                    <MenuItem value="DESTINATION">
                      Destination (transfer) — Door→CT ≤30 / report ≤35
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {(
                [
                  ['doorTime', 'Door / arrival (origin)'],
                  ['doorOutTime', 'Door out (origin)'],
                  ['rccActivationTime', 'Activation (call RCC)'],
                  ['ctScanStartTime', 'CT scan start'],
                  ['ctReportFinalTime', 'CT report final'],
                  ['neurosurgeonNotifiedAt', 'Neurosurgeon notified'],
                  ['neurosurgeonConnectedAt', 'Neurosurgeon decision'],
                  ['definitiveCareReachedAt', 'Definitive care (destination)'],
                ] as const
              ).map(([key, label]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label={label}
                    InputLabelProps={{ shrink: true }}
                    value={toDateTimeLocal(form[key] as string | undefined)}
                    disabled={closed}
                    onChange={(e) => setTimestamp(key, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>

            <PerformanceTimingsCard neuroCase={selected} />
            <KPIPerformanceCard neuroCase={selected} />

            <Divider />
            <Typography variant="subtitle2">Activation & severity</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trigger reason</InputLabel>
                  <Select
                    label="Trigger reason"
                    value={form.triggerReason || ''}
                    disabled={closed}
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
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="GCS"
                  value={form.gcs ?? ''}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gcs: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  inputProps={{ min: 3, max: 15 }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>GCS trend</InputLabel>
                  <Select
                    label="GCS trend"
                    value={form.gcsTrend || ''}
                    disabled={closed}
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
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Pupils</InputLabel>
                  <Select
                    label="Pupils"
                    value={form.pupils || ''}
                    disabled={closed}
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
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    label="Severity"
                    value={form.severity || ''}
                    disabled={closed}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        severity: e.target.value as NeurosurgicalSeverity,
                      }))
                    }
                  >
                    <MenuItem value="RED">Red</MenuItem>
                    <MenuItem value="ORANGE">Orange</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Severity override reason"
                  value={form.severityOverrideReason || ''}
                  disabled={closed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      severityOverrideReason: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.newFocalDeficit}
                      disabled={closed}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          newFocalDeficit: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="New focal deficit"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.seizure}
                      disabled={closed}
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
                      disabled={closed}
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
                      disabled={closed}
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
                      disabled={closed}
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

            <Divider />
            <Alert severity="info">
              Definitive disposition and neurological outcome are filled later via the{' '}
              <strong>Outcome</strong> column on the cases table (same pattern as STEMI /
              Stroke). They contribute 50% of case completeness.
            </Alert>
            {(selected.definitiveDisposition || selected.neurologicalOutcome) && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recorded disposition / outcome
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selected.definitiveDisposition && (
                    <Chip
                      size="small"
                      label={DISPOSITION_LABELS[selected.definitiveDisposition]}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {selected.definitiveTreatment && (
                    <Chip
                      size="small"
                      label={selected.definitiveTreatment.replace(/_/g, ' ')}
                      variant="outlined"
                    />
                  )}
                  {selected.neurologicalOutcome && (
                    <Chip
                      size="small"
                      label={OUTCOME_LABELS[selected.neurologicalOutcome]}
                      color={
                        selected.neurologicalOutcome === 'IMPROVED' ||
                        selected.neurologicalOutcome === 'STABLE'
                          ? 'success'
                          : 'error'
                      }
                    />
                  )}
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Case notes"
              value={form.notes || ''}
              disabled={closed}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Close</Button>
        {!closed && (
          <Button onClick={onSave} disabled={saving} variant="contained">
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NeurosurgicalCaseDialog;
