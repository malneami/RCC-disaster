import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import type {
  CreateNeonatalTransferData,
  NeonatalAcuityLevel,
  NicuLevel,
  NicuCotType,
  NeonatalRespiratorySupport,
  NeonatalTransportTeam,
} from '../../../services/neonatalTransferService';
import { neonatalTransferService } from '../../../services/neonatalTransferService';
import { hospitalService, type Hospital } from '../../../services/hospitalService';
import {
  ACUITY_LABELS,
  NICU_LEVEL_LABELS,
  COT_TYPE_LABELS,
  RESP_SUPPORT_LABELS,
  TRANSPORT_TEAM_LABELS,
  SUSPECTED_CONDITIONS,
} from '../constants/nicuConstants';
import DestinationMatchPanel from './DestinationMatchPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ACUITIES: NeonatalAcuityLevel[] = ['RED', 'ORANGE', 'YELLOW'];
const LEVELS: NicuLevel[] = ['LEVEL_I', 'LEVEL_II', 'LEVEL_III'];
const COT_TYPES: NicuCotType[] = ['INCUBATOR', 'OPEN_WARMER', 'VENTILATED'];
const RESP: NeonatalRespiratorySupport[] = [
  'ROOM_AIR',
  'LOW_FLOW',
  'HIGH_FLOW',
  'CPAP',
  'NIPPV',
  'INVASIVE_VENT',
  'HFOV',
];
const TEAMS: NeonatalTransportTeam[] = ['NEONATAL_RETRIEVAL', 'ALS', 'BLS', 'AIR'];

const emptyForm: CreateNeonatalTransferData = {
  ticketId: '',
  patientId: '',
  gestationalAgeWeeks: 37,
  acuityLevel: 'ORANGE',
  requiredNicuLevel: 'LEVEL_II',
  requiredCotType: 'INCUBATOR',
  referringFacilityId: '',
  transportTeam: 'NEONATAL_RETRIEVAL',
};

const CreateNeonatalTransferDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState<CreateNeonatalTransferData>(emptyForm);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setConditions([]);
    setError(null);
    hospitalService
      .getAllHospitals()
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, [open]);

  const set = <K extends keyof CreateNeonatalTransferData>(
    key: K,
    value: CreateNeonatalTransferData[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const num = (v: string): number | undefined => (v === '' ? undefined : Number(v));

  const toggleCondition = (c: string) =>
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const canSubmit =
    form.ticketId.trim() &&
    form.patientId.trim() &&
    form.referringFacilityId &&
    form.gestationalAgeWeeks > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await neonatalTransferService.create({
        ...form,
        suspectedConditions: conditions.length ? conditions : undefined,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError('Failed to create transfer. Check required fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New Neonatal Transfer · نقل حديث الولادة</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="subtitle2" color="primary" gutterBottom>
          Identifiers
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Ticket ID"
              value={form.ticketId}
              onChange={(e) => set('ticketId', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Patient ID"
              value={form.patientId}
              onChange={(e) => set('patientId', e.target.value)}
              required
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Neonate
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="GA (weeks)"
              value={form.gestationalAgeWeeks}
              onChange={(e) => set('gestationalAgeWeeks', Number(e.target.value))}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="GA (days)"
              onChange={(e) => set('gestationalAgeDays', num(e.target.value))}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Birth weight (g)"
              onChange={(e) => set('birthWeightGrams', num(e.target.value))}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Age (hours)"
              onChange={(e) => set('ageHours', num(e.target.value))}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Vitals & Respiratory
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="HR" onChange={(e) => set('hr', num(e.target.value))} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="RR" onChange={(e) => set('rr', num(e.target.value))} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="Temp (°C)" onChange={(e) => set('temp', num(e.target.value))} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="SpO₂ (%)" onChange={(e) => set('spo2', num(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Respiratory support</InputLabel>
              <Select
                label="Respiratory support"
                value={form.respiratorySupport ?? ''}
                onChange={(e) => set('respiratorySupport', e.target.value as NeonatalRespiratorySupport)}
              >
                {RESP.map((r) => (
                  <MenuItem key={r} value={r}>
                    {RESP_SUPPORT_LABELS[r].en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="FiO₂ (%)" onChange={(e) => set('fiO2', num(e.target.value))} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Suspected conditions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SUSPECTED_CONDITIONS.map((c) => (
            <Chip
              key={c.en}
              label={c.en}
              color={conditions.includes(c.en) ? 'primary' : 'default'}
              variant={conditions.includes(c.en) ? 'filled' : 'outlined'}
              onClick={() => toggleCondition(c.en)}
              size="small"
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Acuity & capacity requirement
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Acuity</InputLabel>
              <Select
                label="Acuity"
                value={form.acuityLevel}
                onChange={(e) => set('acuityLevel', e.target.value as NeonatalAcuityLevel)}
              >
                {ACUITIES.map((a) => (
                  <MenuItem key={a} value={a}>
                    {ACUITY_LABELS[a].en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Required NICU level</InputLabel>
              <Select
                label="Required NICU level"
                value={form.requiredNicuLevel}
                onChange={(e) => set('requiredNicuLevel', e.target.value as NicuLevel)}
              >
                {LEVELS.map((l) => (
                  <MenuItem key={l} value={l}>
                    {NICU_LEVEL_LABELS[l].en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Required cot type</InputLabel>
              <Select
                label="Required cot type"
                value={form.requiredCotType}
                onChange={(e) => set('requiredCotType', e.target.value as NicuCotType)}
              >
                {COT_TYPES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {COT_TYPE_LABELS[c].en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <DestinationMatchPanel
            defaultLevel={form.requiredNicuLevel}
            defaultCotType={form.requiredCotType}
            onPick={(c) => set('destinationHospitalId', c.hospitalId)}
          />
          {form.destinationHospitalId && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Destination selected:{' '}
              {hospitals.find((h) => h.id === form.destinationHospitalId)?.name ??
                form.destinationHospitalId}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Referral & transport
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Referring facility</InputLabel>
              <Select
                label="Referring facility"
                value={form.referringFacilityId}
                onChange={(e) => set('referringFacilityId', e.target.value)}
              >
                {hospitals.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Transport team</InputLabel>
              <Select
                label="Transport team"
                value={form.transportTeam}
                onChange={(e) => set('transportTeam', e.target.value as NeonatalTransportTeam)}
              >
                {TEAMS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {TRANSPORT_TEAM_LABELS[t].en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Referring contact name"
              onChange={(e) => set('referringContactName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Referring contact phone"
              onChange={(e) => set('referringContactPhone', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          Create Transfer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateNeonatalTransferDialog;
