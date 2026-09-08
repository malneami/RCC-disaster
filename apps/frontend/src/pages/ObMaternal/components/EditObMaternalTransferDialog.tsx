import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import HospitalSelect from '../../../components/Common/HospitalSelect';
import {
  OB_STATUS_OPTIONS,
  EXPECTED_DELIVERY_MODE_OPTIONS,
  ACCEPTANCE_STATUS_OPTIONS,
  AMBULANCE_TYPE_OPTIONS,
  CONSCIOUSNESS_OPTIONS,
  BLEEDING_OPTIONS,
  FETAL_STATUS_OPTIONS,
  COMMON_SUSPECTED_CONDITIONS,
  COMMON_STABILIZATION_ITEMS,
} from '../constants/obMaternalConstants';
import { obMaternalTransferService, UpdateObMaternalTransferData } from '../../../services/obMaternalTransferService';
import type { ObMaternalTransfer } from '../../../services/obMaternalTransferService';
import { useSnackbar } from 'notistack';

interface EditObMaternalTransferDialogProps {
  open: boolean;
  transfer: ObMaternalTransfer;
  onClose: () => void;
  onUpdated: () => void;
}

const EditObMaternalTransferDialog: React.FC<EditObMaternalTransferDialogProps> = ({
  open,
  transfer,
  onClose,
  onUpdated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateObMaternalTransferData>({
    status: transfer.status,
    expectedDeliveryMode: transfer.expectedDeliveryMode,
    destinationHospitalId: transfer.destinationHospitalId || '',
    acceptanceStatus: transfer.acceptanceStatus,
    ambulanceType: transfer.ambulanceType,
    referringContactName: transfer.referringContactName || '',
    referringContactPhone: transfer.referringContactPhone || '',
    sbp: transfer.sbp,
    dbp: transfer.dbp,
    hr: transfer.hr,
    rr: transfer.rr,
    temp: transfer.temp,
    spo2: transfer.spo2,
    consciousness: transfer.consciousness,
    bleeding: transfer.bleeding,
    seizure: transfer.seizure,
    suspectedConditions: transfer.suspectedConditions,
    fetalStatus: transfer.fetalStatus,
    fetalHeartRate: transfer.fetalHeartRate,
    hb: transfer.hb,
    platelets: transfer.platelets,
    glucose: transfer.glucose,
    urineProtein: transfer.urineProtein,
    stabilizationDone: transfer.stabilizationDone,
  });

  useEffect(() => {
    if (open && transfer) {
      setFormData({
        status: transfer.status,
        expectedDeliveryMode: transfer.expectedDeliveryMode,
        destinationHospitalId: transfer.destinationHospitalId || '',
        acceptanceStatus: transfer.acceptanceStatus,
        ambulanceType: transfer.ambulanceType,
        referringContactName: transfer.referringContactName || '',
        referringContactPhone: transfer.referringContactPhone || '',
        sbp: transfer.sbp,
        dbp: transfer.dbp,
        hr: transfer.hr,
        rr: transfer.rr,
        temp: transfer.temp,
        spo2: transfer.spo2,
        consciousness: transfer.consciousness,
        bleeding: transfer.bleeding,
        seizure: transfer.seizure,
        suspectedConditions: transfer.suspectedConditions,
        fetalStatus: transfer.fetalStatus,
        fetalHeartRate: transfer.fetalHeartRate,
        hb: transfer.hb,
        platelets: transfer.platelets,
        glucose: transfer.glucose,
        urineProtein: transfer.urineProtein,
        stabilizationDone: transfer.stabilizationDone,
      });
    }
  }, [open, transfer]);

  const toggleArrayItem = (field: 'suspectedConditions' | 'stabilizationDone', item: string) => {
    const arr = (formData[field] || []) as string[];
    const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    setFormData((f) => ({ ...f, [field]: next }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: UpdateObMaternalTransferData = {
        ...formData,
        destinationHospitalId: formData.destinationHospitalId || undefined,
        referringContactName: formData.referringContactName || undefined,
        referringContactPhone: formData.referringContactPhone || undefined,
        suspectedConditions: formData.suspectedConditions?.length ? formData.suspectedConditions : undefined,
        stabilizationDone: formData.stabilizationDone?.length ? formData.stabilizationDone : undefined,
      };
      await obMaternalTransferService.update(transfer.id, payload);
      enqueueSnackbar('OB maternal transfer updated', { variant: 'success' });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Update failed');
      enqueueSnackbar('Failed to update', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit OB Maternal Transfer</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}><Typography variant="subtitle2">Vitals</Typography></Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="SBP" value={formData.sbp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, sbp: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="DBP" value={formData.dbp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, dbp: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="HR" value={formData.hr ?? ''} onChange={(e) => setFormData((f) => ({ ...f, hr: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="RR" value={formData.rr ?? ''} onChange={(e) => setFormData((f) => ({ ...f, rr: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Temp" value={formData.temp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, temp: e.target.value ? parseFloat(e.target.value) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="SpO2" value={formData.spo2 ?? ''} onChange={(e) => setFormData((f) => ({ ...f, spo2: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Clinical</Typography></Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Consciousness</InputLabel>
              <Select value={formData.consciousness || ''} label="Consciousness" onChange={(e) => setFormData((f) => ({ ...f, consciousness: e.target.value as any }))}>
                <MenuItem value="">—</MenuItem>
                {CONSCIOUSNESS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Bleeding</InputLabel>
              <Select value={formData.bleeding || ''} label="Bleeding" onChange={(e) => setFormData((f) => ({ ...f, bleeding: e.target.value as any }))}>
                <MenuItem value="">—</MenuItem>
                {BLEEDING_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel control={<Checkbox checked={!!formData.seizure} onChange={(e) => setFormData((f) => ({ ...f, seizure: e.target.checked }))} />} label="Seizure" />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Suspected conditions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {COMMON_SUSPECTED_CONDITIONS.map((item) => (
                <Chip key={item} label={item} size="small" color={((formData.suspectedConditions || []) as string[]).includes(item) ? 'primary' : 'default'} onClick={() => toggleArrayItem('suspectedConditions', item)} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Fetal Status</InputLabel>
              <Select value={formData.fetalStatus || ''} label="Fetal Status" onChange={(e) => setFormData((f) => ({ ...f, fetalStatus: e.target.value as any }))}>
                <MenuItem value="">—</MenuItem>
                {FETAL_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="number" label="Fetal HR" value={formData.fetalHeartRate ?? ''} onChange={(e) => setFormData((f) => ({ ...f, fetalHeartRate: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Labs</Typography></Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Hb" value={formData.hb ?? ''} onChange={(e) => setFormData((f) => ({ ...f, hb: e.target.value ? parseFloat(e.target.value) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Platelets" value={formData.platelets ?? ''} onChange={(e) => setFormData((f) => ({ ...f, platelets: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Glucose" value={formData.glucose ?? ''} onChange={(e) => setFormData((f) => ({ ...f, glucose: e.target.value ? parseFloat(e.target.value) : undefined }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Urine Protein" value={formData.urineProtein ?? ''} onChange={(e) => setFormData((f) => ({ ...f, urineProtein: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Stabilization done</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {COMMON_STABILIZATION_ITEMS.map((item) => (
                <Chip key={item} label={item} size="small" color={((formData.stabilizationDone || []) as string[]).includes(item) ? 'primary' : 'default'} onClick={() => toggleArrayItem('stabilizationDone', item)} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 2 }}>Workflow</Typography></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || transfer.status}
                label="Status"
                onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as any }))}
              >
                {OB_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Expected Delivery Mode</InputLabel>
              <Select
                value={formData.expectedDeliveryMode || transfer.expectedDeliveryMode}
                label="Expected Delivery Mode"
                onChange={(e) => setFormData((f) => ({ ...f, expectedDeliveryMode: e.target.value as any }))}
              >
                {EXPECTED_DELIVERY_MODE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <HospitalSelect
              value={formData.destinationHospitalId || ''}
              onChange={(v) => setFormData((f) => ({ ...f, destinationHospitalId: v }))}
              label="Destination Hospital"
              placeholder="Select destination"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Acceptance Status</InputLabel>
              <Select
                value={formData.acceptanceStatus || transfer.acceptanceStatus}
                label="Acceptance Status"
                onChange={(e) => setFormData((f) => ({ ...f, acceptanceStatus: e.target.value as any }))}
              >
                {ACCEPTANCE_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Ambulance Type</InputLabel>
              <Select
                value={formData.ambulanceType || transfer.ambulanceType}
                label="Ambulance Type"
                onChange={(e) => setFormData((f) => ({ ...f, ambulanceType: e.target.value as any }))}
              >
                {AMBULANCE_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Referring Contact Name"
              value={formData.referringContactName ?? ''}
              onChange={(e) => setFormData((f) => ({ ...f, referringContactName: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Referring Contact Phone"
              value={formData.referringContactPhone ?? ''}
              onChange={(e) => setFormData((f) => ({ ...f, referringContactPhone: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditObMaternalTransferDialog;
