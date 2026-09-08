import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
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
  Typography,
} from '@mui/material';
import PatientSelect from '../../Tickets/components/PatientSelect';
import HospitalSelect from '../../../components/Common/HospitalSelect';
import {
  OB_FORM_STEPS,
  ACTIVATION_LEVEL_OPTIONS,
  EXPECTED_DELIVERY_MODE_OPTIONS,
  SYSTEM_SUGGESTED_DELIVERY_MODE_OPTIONS,
  PHYSICIAN_CONFIRMED_DELIVERY_MODE_OPTIONS,
  ACCEPTANCE_STATUS_OPTIONS,
  AMBULANCE_TYPE_OPTIONS,
  CONSCIOUSNESS_OPTIONS,
  BLEEDING_OPTIONS,
  FETAL_STATUS_OPTIONS,
  COMMON_SUSPECTED_CONDITIONS,
  COMMON_STABILIZATION_ITEMS,
} from '../constants/obMaternalConstants';
import { obMaternalTransferService, CreateObMaternalTransferData } from '../../../services/obMaternalTransferService';
import type { ObMaternalFormData } from '../types/obMaternalTypes';
import { useSnackbar } from 'notistack';

interface CreateObMaternalTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const initialFormData: ObMaternalFormData = {
  ticketId: '',
  patientId: '',
  patientDisplay: '',
  pregnancyCaseId: '',
  gestationalAgeWeeks: 0,
  gravida: undefined,
  para: undefined,
  sbp: undefined,
  dbp: undefined,
  hr: undefined,
  rr: undefined,
  temp: undefined,
  spo2: undefined,
  consciousness: undefined,
  bleeding: undefined,
  seizure: undefined,
  suspectedConditions: [],
  fetalStatus: undefined,
  fetalHeartRate: undefined,
  hb: undefined,
  platelets: undefined,
  glucose: undefined,
  urineProtein: '',
  labsOther: undefined,
  stabilizationDone: [],
  referringFacilityId: '',
  referringContactName: '',
  referringContactPhone: '',
  activationLevel: 'MATERNAL_RED',
  expectedDeliveryMode: 'PENDING',
  systemSuggestedDeliveryMode: undefined,
  physicianConfirmedDeliveryMode: undefined,
  destinationHospitalId: '',
  acceptanceStatus: 'PENDING',
  ambulanceType: 'ALS',
};

const CreateObMaternalTransferDialog: React.FC<CreateObMaternalTransferDialogProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ObMaternalFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFormData(initialFormData);
    setActiveStep(0);
    setError(null);
    onClose();
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, 5));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const toggleArrayItem = (field: 'suspectedConditions' | 'stabilizationDone', item: string) => {
    const arr = formData[field] || [];
    const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    setFormData((f) => ({ ...f, [field]: next }));
  };

  const validateStep = (): boolean => {
    setError(null);
    if (activeStep === 0) {
      if (!formData.ticketId?.trim()) {
        setError('Ticket ID is required');
        return false;
      }
      if (!formData.patientId) {
        setError('Patient is required');
        return false;
      }
      if (!formData.gestationalAgeWeeks || formData.gestationalAgeWeeks < 1 || formData.gestationalAgeWeeks > 45) {
        setError('Gestational age (1-45 weeks) is required');
        return false;
      }
    }
    if (activeStep === 1) {
      // Vitals & Clinical - all optional
    }
    if (activeStep === 2) {
      if (!formData.referringFacilityId) {
        setError('Referring facility is required');
        return false;
      }
    }
    if (activeStep === 3) {
      if (!formData.activationLevel || !formData.expectedDeliveryMode) {
        setError('Activation level and expected delivery mode are required');
        return false;
      }
    }
    if (activeStep === 4) {
      // Destination optional
    }
    if (activeStep === 5) {
      if (!formData.ambulanceType) {
        setError('Ambulance type is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);
    try {
      const payload: CreateObMaternalTransferData = {
        ticketId: formData.ticketId.trim(),
        patientId: formData.patientId,
        pregnancyCaseId: formData.pregnancyCaseId?.trim() || undefined,
        gestationalAgeWeeks: formData.gestationalAgeWeeks,
        gravida: formData.gravida ?? undefined,
        para: formData.para ?? undefined,
        sbp: formData.sbp ?? undefined,
        dbp: formData.dbp ?? undefined,
        hr: formData.hr ?? undefined,
        rr: formData.rr ?? undefined,
        temp: formData.temp ?? undefined,
        spo2: formData.spo2 ?? undefined,
        consciousness: formData.consciousness,
        bleeding: formData.bleeding,
        seizure: formData.seizure,
        suspectedConditions: formData.suspectedConditions?.length ? formData.suspectedConditions : undefined,
        fetalStatus: formData.fetalStatus,
        fetalHeartRate: formData.fetalHeartRate ?? undefined,
        hb: formData.hb ?? undefined,
        platelets: formData.platelets ?? undefined,
        glucose: formData.glucose ?? undefined,
        urineProtein: formData.urineProtein || undefined,
        labsOther: formData.labsOther,
        stabilizationDone: formData.stabilizationDone?.length ? formData.stabilizationDone : undefined,
        referringFacilityId: formData.referringFacilityId,
        referringContactName: formData.referringContactName || undefined,
        referringContactPhone: formData.referringContactPhone || undefined,
        activationLevel: formData.activationLevel,
        expectedDeliveryMode: formData.expectedDeliveryMode,
        systemSuggestedDeliveryMode: formData.systemSuggestedDeliveryMode,
        physicianConfirmedDeliveryMode: formData.physicianConfirmedDeliveryMode,
        destinationHospitalId: formData.destinationHospitalId || undefined,
        acceptanceStatus: formData.acceptanceStatus,
        ambulanceType: formData.ambulanceType,
      };
      await obMaternalTransferService.create(payload);
      enqueueSnackbar('OB maternal transfer created successfully', { variant: 'success' });
      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create transfer');
      enqueueSnackbar('Failed to create OB maternal transfer', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create OB Maternal Transfer</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
          {OB_FORM_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step 0: Patient & OB Info */}
        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ticket ID"
                value={formData.ticketId}
                onChange={(e) => setFormData((f) => ({ ...f, ticketId: e.target.value }))}
                required
                placeholder="Paste or enter ticket ID"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pregnancy Case ID (optional)"
                value={formData.pregnancyCaseId || ''}
                onChange={(e) => setFormData((f) => ({ ...f, pregnancyCaseId: e.target.value }))}
                placeholder="FK to pregnancy_cases"
              />
            </Grid>
            <Grid item xs={12}>
              <PatientSelect
                value={formData.patientId || null}
                onChange={(id) => setFormData((f) => ({ ...f, patientId: id || '' }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Gestational Age (weeks)"
                value={formData.gestationalAgeWeeks || ''}
                onChange={(e) => setFormData((f) => ({ ...f, gestationalAgeWeeks: parseInt(e.target.value, 10) || 0 }))}
                inputProps={{ min: 1, max: 45 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Gravida"
                value={formData.gravida ?? ''}
                onChange={(e) => setFormData((f) => ({ ...f, gravida: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Para"
                value={formData.para ?? ''}
                onChange={(e) => setFormData((f) => ({ ...f, para: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 1: Vitals & Clinical */}
        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600}>Vitals</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="SBP (mmHg)" value={formData.sbp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, sbp: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="DBP (mmHg)" value={formData.dbp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, dbp: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="HR (bpm)" value={formData.hr ?? ''} onChange={(e) => setFormData((f) => ({ ...f, hr: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="RR (/min)" value={formData.rr ?? ''} onChange={(e) => setFormData((f) => ({ ...f, rr: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="Temp (°C)" value={formData.temp ?? ''} onChange={(e) => setFormData((f) => ({ ...f, temp: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth type="number" label="SpO2 (%)" value={formData.spo2 ?? ''} onChange={(e) => setFormData((f) => ({ ...f, spo2: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0, max: 100 }} />
            </Grid>
            <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Clinical</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Consciousness</InputLabel>
                <Select value={formData.consciousness || ''} label="Consciousness" onChange={(e) => setFormData((f) => ({ ...f, consciousness: e.target.value as any }))}>
                  <MenuItem value="">None</MenuItem>
                  {CONSCIOUSNESS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bleeding</InputLabel>
                <Select value={formData.bleeding || ''} label="Bleeding" onChange={(e) => setFormData((f) => ({ ...f, bleeding: e.target.value as any }))}>
                  <MenuItem value="">None</MenuItem>
                  {BLEEDING_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Checkbox checked={!!formData.seizure} onChange={(e) => setFormData((f) => ({ ...f, seizure: e.target.checked }))} />} label="Seizure" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Suspected conditions</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {COMMON_SUSPECTED_CONDITIONS.map((item) => (
                  <Chip key={item} label={item} size="small" color={(formData.suspectedConditions || []).includes(item) ? 'primary' : 'default'} onClick={() => toggleArrayItem('suspectedConditions', item)} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Fetal Status</InputLabel>
                <Select value={formData.fetalStatus || ''} label="Fetal Status" onChange={(e) => setFormData((f) => ({ ...f, fetalStatus: e.target.value as any }))}>
                  <MenuItem value="">None</MenuItem>
                  {FETAL_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Fetal Heart Rate" value={formData.fetalHeartRate ?? ''} onChange={(e) => setFormData((f) => ({ ...f, fetalHeartRate: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Labs</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth type="number" label="Hb (g/dL)" value={formData.hb ?? ''} onChange={(e) => setFormData((f) => ({ ...f, hb: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth type="number" label="Platelets" value={formData.platelets ?? ''} onChange={(e) => setFormData((f) => ({ ...f, platelets: e.target.value ? parseInt(e.target.value, 10) : undefined }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth type="number" label="Glucose (mg/dL)" value={formData.glucose ?? ''} onChange={(e) => setFormData((f) => ({ ...f, glucose: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Urine Protein" value={formData.urineProtein || ''} onChange={(e) => setFormData((f) => ({ ...f, urineProtein: e.target.value }))} placeholder="e.g. +1, +2" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Stabilization done</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {COMMON_STABILIZATION_ITEMS.map((item) => (
                  <Chip key={item} label={item} size="small" color={(formData.stabilizationDone || []).includes(item) ? 'primary' : 'default'} onClick={() => toggleArrayItem('stabilizationDone', item)} />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Step 2: Referring Facility */}
        {activeStep === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <HospitalSelect
                value={formData.referringFacilityId}
                onChange={(v) => setFormData((f) => ({ ...f, referringFacilityId: v }))}
                label="Referring Facility"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referring Contact Name"
                value={formData.referringContactName}
                onChange={(e) => setFormData((f) => ({ ...f, referringContactName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referring Contact Phone"
                value={formData.referringContactPhone}
                onChange={(e) => setFormData((f) => ({ ...f, referringContactPhone: e.target.value }))}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 3: Activation & Delivery */}
        {activeStep === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Activation Level</InputLabel>
                <Select
                  value={formData.activationLevel}
                  label="Activation Level"
                  onChange={(e) => setFormData((f) => ({ ...f, activationLevel: e.target.value as any }))}
                >
                  {ACTIVATION_LEVEL_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Expected Delivery Mode</InputLabel>
                <Select
                  value={formData.expectedDeliveryMode}
                  label="Expected Delivery Mode"
                  onChange={(e) => setFormData((f) => ({ ...f, expectedDeliveryMode: e.target.value as any }))}
                >
                  {EXPECTED_DELIVERY_MODE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>System Suggested Delivery Mode</InputLabel>
                <Select
                  value={formData.systemSuggestedDeliveryMode || ''}
                  label="System Suggested Delivery Mode"
                  onChange={(e) => setFormData((f) => ({ ...f, systemSuggestedDeliveryMode: (e.target.value || undefined) as ObMaternalFormData['systemSuggestedDeliveryMode'] }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {SYSTEM_SUGGESTED_DELIVERY_MODE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Physician Confirmed Delivery Mode</InputLabel>
                <Select
                  value={formData.physicianConfirmedDeliveryMode || ''}
                  label="Physician Confirmed Delivery Mode"
                  onChange={(e) => setFormData((f) => ({ ...f, physicianConfirmedDeliveryMode: (e.target.value || undefined) as ObMaternalFormData['physicianConfirmedDeliveryMode'] }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {PHYSICIAN_CONFIRMED_DELIVERY_MODE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Step 4: Destination */}
        {activeStep === 4 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <HospitalSelect
                value={formData.destinationHospitalId}
                onChange={(v) => setFormData((f) => ({ ...f, destinationHospitalId: v }))}
                label="Destination Hospital"
                placeholder="Select destination (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Acceptance Status</InputLabel>
                <Select
                  value={formData.acceptanceStatus}
                  label="Acceptance Status"
                  onChange={(e) => setFormData((f) => ({ ...f, acceptanceStatus: e.target.value as any }))}
                >
                  {ACCEPTANCE_STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Step 5: Ambulance & Review */}
        {activeStep === 5 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Ambulance Type</InputLabel>
                <Select
                  value={formData.ambulanceType}
                  label="Ambulance Type"
                  onChange={(e) => setFormData((f) => ({ ...f, ambulanceType: e.target.value as any }))}
                >
                  {AMBULANCE_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <strong>Summary:</strong> Ticket {formData.ticketId} | Patient {formData.patientId} | {formData.gestationalAgeWeeks}w |
                {formData.activationLevel} | {formData.expectedDeliveryMode} | {formData.ambulanceType}
                {(formData.sbp || formData.hr || formData.spo2) && (
                  <> | Vitals: SBP {formData.sbp ?? '-'} / HR {formData.hr ?? '-'} / SpO2 {formData.spo2 ?? '-'}%</>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        {activeStep < 5 ? (
          <Button variant="contained" onClick={() => validateStep() && handleNext()}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateObMaternalTransferDialog;
