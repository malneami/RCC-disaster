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
  Typography,
} from '@mui/material';
import {
  MATERNAL_STATUS_OPTIONS,
  PERINATAL_STATUS_OPTIONS,
} from '../constants/obMaternalConstants';
import { pregnancyOutcomeService, CreatePregnancyOutcomeData } from '../../../services/pregnancyOutcomeService';
import { useSnackbar } from 'notistack';

interface CreatePregnancyOutcomeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultCaseId?: string;
}

const CreatePregnancyOutcomeDialog: React.FC<CreatePregnancyOutcomeDialogProps> = ({
  open,
  onClose,
  onCreated,
  defaultCaseId = '',
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    caseId: defaultCaseId,
    maternalStatus: 'ALIVE' as 'ALIVE' | 'DECEASED',
    maternalIcuAdmission: false,
    massiveTransfusion: false,
    eclampsiaEvent: false,
    majorPph: false,
    perinatalStatus: 'ALIVE' as 'ALIVE' | 'STILLBIRTH' | 'NEONATAL_DEATH' | 'UNKNOWN',
    nicuAdmission: false,
    apgar5: '' as string | number,
  });

  useEffect(() => {
    if (open && defaultCaseId) {
      setFormData((f) => ({ ...f, caseId: defaultCaseId }));
    }
  }, [open, defaultCaseId]);

  const handleClose = () => {
    setFormData({
      caseId: defaultCaseId,
      maternalStatus: 'ALIVE',
      maternalIcuAdmission: false,
      massiveTransfusion: false,
      eclampsiaEvent: false,
      majorPph: false,
      perinatalStatus: 'ALIVE',
      nicuAdmission: false,
      apgar5: '',
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.caseId?.trim()) {
      setError('Pregnancy Case ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: CreatePregnancyOutcomeData = {
        caseId: formData.caseId.trim(),
        maternalStatus: formData.maternalStatus,
        maternalIcuAdmission: formData.maternalIcuAdmission,
        massiveTransfusion: formData.massiveTransfusion,
        eclampsiaEvent: formData.eclampsiaEvent,
        majorPph: formData.majorPph,
        perinatalStatus: formData.perinatalStatus,
        nicuAdmission: formData.nicuAdmission,
        apgar5: formData.apgar5 ? parseInt(String(formData.apgar5), 10) : undefined,
      };
      await pregnancyOutcomeService.create(payload);
      enqueueSnackbar('Pregnancy outcome created successfully', { variant: 'success' });
      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create outcome');
      enqueueSnackbar('Failed to create pregnancy outcome', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Pregnancy Outcome</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pregnancy Case ID *"
              value={formData.caseId}
              onChange={(e) => setFormData((f) => ({ ...f, caseId: e.target.value }))}
              required
              placeholder="Paste pregnancy case UUID"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Maternal</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Maternal Status</InputLabel>
              <Select
                value={formData.maternalStatus}
                label="Maternal Status"
                onChange={(e) => setFormData((f) => ({ ...f, maternalStatus: e.target.value as any }))}
              >
                {MATERNAL_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.maternalIcuAdmission}
                  onChange={(e) => setFormData((f) => ({ ...f, maternalIcuAdmission: e.target.checked }))}
                />
              }
              label="ICU Admission"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.massiveTransfusion}
                  onChange={(e) => setFormData((f) => ({ ...f, massiveTransfusion: e.target.checked }))}
                />
              }
              label="Massive Transfusion"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.eclampsiaEvent}
                  onChange={(e) => setFormData((f) => ({ ...f, eclampsiaEvent: e.target.checked }))}
                />
              }
              label="Eclampsia Event"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.majorPph}
                  onChange={(e) => setFormData((f) => ({ ...f, majorPph: e.target.checked }))}
                />
              }
              label="Major PPH"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Perinatal</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Perinatal Status</InputLabel>
              <Select
                value={formData.perinatalStatus}
                label="Perinatal Status"
                onChange={(e) => setFormData((f) => ({ ...f, perinatalStatus: e.target.value as any }))}
              >
                {PERINATAL_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.nicuAdmission}
                  onChange={(e) => setFormData((f) => ({ ...f, nicuAdmission: e.target.checked }))}
                />
              }
              label="NICU Admission"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Apgar 5"
              value={formData.apgar5}
              onChange={(e) => setFormData((f) => ({ ...f, apgar5: e.target.value }))}
              inputProps={{ min: 0, max: 10 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePregnancyOutcomeDialog;
