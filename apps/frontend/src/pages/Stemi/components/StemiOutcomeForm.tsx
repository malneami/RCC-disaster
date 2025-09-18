import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { stemiOutcomeFormService } from '../services/stemiOutcomeFormService';

// Form data interface
interface StemiOutcomeFormData {
  cathLabActivationTime?: string;
  cathLabArrivalTime?: string;
  pciProcedureStartTime?: string;
  pciProcedureCompleteTime?: string;
  postPciComplications?: string;
  dischargeStatus?: string;
  dischargeMedications?: string;
  followUpAppointmentDate?: string;
  followUpAppointmentProvider?: string;
  outcomeFormCompleted?: boolean;
  outcomeFormCompletionDate?: string;
}

interface StemiOutcomeFormProps {
  open: boolean;
  onClose: () => void;
  stemiCaseId: string;
  stemiCaseData?: any;
  onSuccess?: (updatedData?: any) => void;
}

const StemiOutcomeForm: React.FC<StemiOutcomeFormProps> = ({
  open,
  onClose,
  stemiCaseId,
  stemiCaseData,
  onSuccess,
}) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completeness, setCompleteness] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<StemiOutcomeFormData>({
    defaultValues: {
      cathLabActivationTime: '',
      cathLabArrivalTime: '',
      pciProcedureStartTime: '',
      pciProcedureCompleteTime: '',
      postPciComplications: '',
      dischargeStatus: '',
      dischargeMedications: '',
      followUpAppointmentDate: '',
      followUpAppointmentProvider: '',
      outcomeFormCompleted: false,
      outcomeFormCompletionDate: '',
    },
  });

  const watchedValues = watch();

  // Calculate completeness percentage in real-time
  useEffect(() => {
    const outcomeFields = [
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'pciProcedureCompleteTime',
      'postPciComplications',
      'dischargeStatus',
      'dischargeMedications',
      'followUpAppointmentDate',
      'followUpAppointmentProvider',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = watchedValues[field as keyof StemiOutcomeFormData];
      return value !== null && value !== undefined && value !== '';
    });

    const percentage = Math.round((completedFields.length / outcomeFields.length) * 100);
    setCompleteness(percentage);
  }, [watchedValues]);

  // Helper function to format ISO date string for datetime-local input
  const formatDateForInput = (isoDateString?: string): string => {
    if (!isoDateString) return '';
    try {
      const date = new Date(isoDateString);
      // Convert to local timezone and format for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', isoDateString);
      return '';
    }
  };

  // Fetch outcome form data when dialog opens
  const fetchOutcomeFormData = async () => {
    if (!stemiCaseId) return;
    
    setLoading(true);
    try {
      const data = await stemiOutcomeFormService.getOutcomeForm(stemiCaseId);
      
      // Reset form with fetched data
      reset({
        cathLabActivationTime: formatDateForInput(data.cathLabActivationTime),
        cathLabArrivalTime: formatDateForInput(data.cathLabArrivalTime),
        pciProcedureStartTime: formatDateForInput(data.pciProcedureStartTime),
        pciProcedureCompleteTime: formatDateForInput(data.pciProcedureCompleteTime),
        postPciComplications: data.postPciComplications || '',
        dischargeStatus: data.dischargeStatus || '',
        dischargeMedications: data.dischargeMedications || '',
        followUpAppointmentDate: formatDateForInput(data.followUpAppointmentDate),
        followUpAppointmentProvider: data.followUpAppointmentProvider || '',
        outcomeFormCompleted: data.outcomeFormCompleted || false,
        outcomeFormCompletionDate: data.outcomeFormCompletionDate || '',
      });
    } catch (error) {
      console.error('Error fetching outcome form data:', error);
      // Fallback to prop data if API fails
      if (stemiCaseData) {
        reset({
          cathLabActivationTime: formatDateForInput(stemiCaseData.cathLabActivationTime),
          cathLabArrivalTime: formatDateForInput(stemiCaseData.cathLabArrivalTime),
          pciProcedureStartTime: formatDateForInput(stemiCaseData.pciProcedureStartTime),
          pciProcedureCompleteTime: formatDateForInput(stemiCaseData.pciProcedureCompleteTime),
          postPciComplications: stemiCaseData.postPciComplications || '',
          dischargeStatus: stemiCaseData.dischargeStatus || '',
          dischargeMedications: stemiCaseData.dischargeMedications || '',
          followUpAppointmentDate: formatDateForInput(stemiCaseData.followUpAppointmentDate),
          followUpAppointmentProvider: stemiCaseData.followUpAppointmentProvider || '',
          outcomeFormCompleted: stemiCaseData.outcomeFormCompleted || false,
          outcomeFormCompletionDate: stemiCaseData.outcomeFormCompletionDate || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Recalculate completeness when form data changes (including after loading)
  useEffect(() => {
    if (!loading) {
      const currentValues = watch();
      const completenessPercentage = calculateCompleteness(currentValues);
      setCompleteness(completenessPercentage);
    }
  }, [loading, watch]);

  // Update completeness after successful save
  const updateCompleteness = (newData: any) => {
    if (newData.outcomePercentageCompleteness !== undefined) {
      setCompleteness(newData.outcomePercentageCompleteness);
    }
  };

  // Load existing data when dialog opens
  useEffect(() => {
    if (open && stemiCaseId) {
      fetchOutcomeFormData();
    }
  }, [open, stemiCaseId]);

  const calculateCompleteness = (formData: StemiOutcomeFormData): number => {
    const outcomeFields = [
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'pciProcedureCompleteTime',
      'postPciComplications',
      'dischargeStatus',
      'dischargeMedications',
      'followUpAppointmentDate',
      'followUpAppointmentProvider',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = formData[field as keyof StemiOutcomeFormData];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / outcomeFields.length) * 100);
  };

  const onSubmit = async (data: StemiOutcomeFormData) => {
    setSaving(true);
    try {
      // Calculate completeness percentage
      const completenessPercentage = calculateCompleteness(data);
      
      // Filter out empty string values for date fields and other optional fields
      const cleanedData = {
        ...data,
        // Only include date fields if they have values
        cathLabActivationTime: data.cathLabActivationTime || undefined,
        cathLabArrivalTime: data.cathLabArrivalTime || undefined,
        pciProcedureStartTime: data.pciProcedureStartTime || undefined,
        pciProcedureCompleteTime: data.pciProcedureCompleteTime || undefined,
        followUpAppointmentDate: data.followUpAppointmentDate || undefined,
        // Only include text fields if they have values
        postPciComplications: data.postPciComplications || undefined,
        dischargeStatus: data.dischargeStatus || undefined,
        dischargeMedications: data.dischargeMedications || undefined,
        followUpAppointmentProvider: data.followUpAppointmentProvider || undefined,
        outcomeFormCompleted: data.outcomeFormCompleted,
        outcomeFormCompletionDate: new Date().toISOString(),
        outcomePercentageCompleteness: completenessPercentage,
      };
      
      const result = await stemiOutcomeFormService.updateOutcomeForm(stemiCaseId, cleanedData);

      // Update completeness with the returned data
      updateCompleteness(result);

      console.log('STEMI outcome form updated successfully');
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error updating outcome form:', error);
      alert('Failed to update outcome form');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">STEMI Outcome Form</Typography>
            <Chip
              label={`${completeness}% Complete`}
              color={getCompletenessColor(completeness) as any}
              variant="outlined"
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box mb={2}>
            <Alert severity="info">
              Complete the outcome form to track STEMI case outcomes and follow-up care.
            </Alert>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* PCI Procedure Phase */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  PCI Procedure Phase
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cathLabActivationTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cath Lab Activation Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      helperText="When the catheterization lab team was activated"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cathLabArrivalTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cath Lab Arrival Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      helperText="When the cath lab team arrived at the facility"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="pciProcedureStartTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="PCI Procedure Start Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      helperText="When the PCI procedure actually began"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="pciProcedureCompleteTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="PCI Procedure Complete Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      helperText="When the PCI procedure was completed"
                    />
                  )}
                />
              </Grid>

              {/* Post-PCI Management Phase */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Post-PCI Management Phase
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="postPciComplications"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Post-PCI Complications"
                      multiline
                      rows={3}
                      helperText="Document any complications that occurred after the PCI procedure"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="dischargeStatus"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Discharge Status</InputLabel>
                      <Select {...field} label="Discharge Status">
                        <MenuItem value="STABLE">Stable</MenuItem>
                        <MenuItem value="COMPLICATIONS">Complications</MenuItem>
                        <MenuItem value="TRANSFERRED">Transferred</MenuItem>
                        <MenuItem value="DECEASED">Deceased</MenuItem>
                        <MenuItem value="AGAINST_MEDICAL_ADVICE">Against Medical Advice</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="followUpAppointmentProvider"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Follow-up Appointment Provider"
                      helperText="Name of the provider for follow-up appointment"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="followUpAppointmentDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Follow-up Appointment Date"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      helperText="Scheduled follow-up appointment date and time"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="dischargeMedications"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Discharge Medications"
                      multiline
                      rows={3}
                      helperText="List of medications prescribed at discharge"
                    />
                  )}
                />
              </Grid>

              {/* Completion Status */}
              <Grid item xs={12}>
                <Controller
                  name="outcomeFormCompleted"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Mark outcome form as completed"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Outcome Form'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default StemiOutcomeForm;
