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
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { strokeOutcomeFormService } from '../services/strokeOutcomeFormService';
import { useAuth } from '../../../contexts/AuthContext';

// Form data interface
interface StrokeOutcomeFormData {
  dischargeType?: string;
  followUpNotCompletedReason?: string;
  followUpSpecify?: string;
  followUpType?: string;
  dischargeModifiedRankinScale?: number;
  followUpModifiedRankinScale?: number;
  closureReport?: string;
  functionalStatus?: string;
  mortality?: string;
  threeMonthFollowupComplete?: boolean;
  outcomeFormCompletionDate?: string;
}

interface StrokeOutcomeFormProps {
  open: boolean;
  onClose: () => void;
  strokeCaseId: string;
  strokeCaseData?: any;
  onSuccess?: () => void;
}

const StrokeOutcomeForm: React.FC<StrokeOutcomeFormProps> = ({
  open,
  onClose,
  strokeCaseId,
  strokeCaseData,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [completionDate, setCompletionDate] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<StrokeOutcomeFormData>({
    defaultValues: {
      dischargeType: '',
      followUpNotCompletedReason: '',
      followUpSpecify: '',
      followUpType: '',
      dischargeModifiedRankinScale: undefined,
      followUpModifiedRankinScale: undefined,
      closureReport: '',
      functionalStatus: '',
      mortality: '',
      threeMonthFollowupComplete: false,
      outcomeFormCompletionDate: '',
    },
  });

  const watchedValues = watch();

  // Calculate completeness percentage in real-time
  useEffect(() => {
    const outcomeFields = [
      'dischargeType',
      'followUpNotCompletedReason',
      'followUpSpecify',
      'followUpType',
      'dischargeModifiedRankinScale',
      'followUpModifiedRankinScale',
      'closureReport',
      'functionalStatus',
      'mortality',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = watchedValues[field as keyof StrokeOutcomeFormData];
      return value !== null && value !== undefined && value !== '';
    });

    const percentage = Math.round((completedFields.length / outcomeFields.length) * 100);
    setCompleteness(percentage);
    
    // Auto-set completion date when all fields are completed (100%)
    if (percentage === 100 && !completionDate && user) {
      const now = new Date().toISOString();
      setCompletionDate(now);
    }
  }, [watchedValues, completionDate, user]);

  // Fetch outcome form data when dialog opens
  const fetchOutcomeFormData = async () => {
    if (!strokeCaseId) return;
    
    setLoading(true);
    try {
      const data = await strokeOutcomeFormService.getOutcomeForm(strokeCaseId);
      
      // Reset form with fetched data
      reset({
        dischargeType: data.dischargeType || '',
        followUpNotCompletedReason: data.followUpNotCompletedReason || '',
        followUpSpecify: data.followUpSpecify || '',
        followUpType: data.followUpType || '',
        dischargeModifiedRankinScale: data.dischargeModifiedRankinScale || undefined,
        followUpModifiedRankinScale: data.followUpModifiedRankinScale || undefined,
        closureReport: data.closureReport || '',
        functionalStatus: data.functionalStatus || '',
        mortality: data.mortality || '',
        threeMonthFollowupComplete: data.threeMonthFollowupComplete || false,
        outcomeFormCompletionDate: data.outcomeFormCompletionDate || '',
      });
      setCompletionDate(data.outcomeFormCompletionDate || null);
    } catch (error) {
      console.error('Error fetching outcome form data:', error);
      // Fallback to prop data if API fails
      if (strokeCaseData) {
        reset({
          dischargeType: strokeCaseData.dischargeType || '',
          followUpNotCompletedReason: strokeCaseData.followUpNotCompletedReason || '',
          followUpSpecify: strokeCaseData.followUpSpecify || '',
          followUpType: strokeCaseData.followUpType || '',
          dischargeModifiedRankinScale: strokeCaseData.dischargeModifiedRankinScale || undefined,
          followUpModifiedRankinScale: strokeCaseData.followUpModifiedRankinScale || undefined,
          closureReport: strokeCaseData.closureReport || '',
          functionalStatus: strokeCaseData.functionalStatus || '',
          mortality: strokeCaseData.mortality || '',
          threeMonthFollowupComplete: strokeCaseData.threeMonthFollowupComplete || false,
          outcomeFormCompletionDate: strokeCaseData.outcomeFormCompletionDate || '',
        });
        setCompletionDate(strokeCaseData.outcomeFormCompletionDate || null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update completeness after successful save
  const updateCompleteness = (newData: any) => {
    if (newData.outcomePercentageCompleteness !== undefined) {
      setCompleteness(newData.outcomePercentageCompleteness);
    }
  };

  // Load existing data when dialog opens
  useEffect(() => {
    if (open && strokeCaseId) {
      fetchOutcomeFormData();
    }
  }, [open, strokeCaseId]);

  const calculateCompleteness = (formData: StrokeOutcomeFormData): number => {
    const outcomeFields = [
      'dischargeType',
      'followUpNotCompletedReason',
      'followUpSpecify',
      'followUpType',
      'dischargeModifiedRankinScale',
      'followUpModifiedRankinScale',
      'closureReport',
      'functionalStatus',
      'mortality',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = formData[field as keyof StrokeOutcomeFormData];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / outcomeFields.length) * 100);
  };

  const onSubmit = async (data: StrokeOutcomeFormData) => {
    setSaving(true);
    try {
      // Calculate completeness percentage
      const completenessPercentage = calculateCompleteness(data);
      
      // Auto-set completion date if all fields are completed (100%) and not already set
      const shouldSetCompletionDate = completenessPercentage === 100 && !completionDate;
      const finalCompletionDate = shouldSetCompletionDate 
        ? new Date().toISOString() 
        : (completionDate || data.outcomeFormCompletionDate || undefined);
      
      const result = await strokeOutcomeFormService.updateOutcomeForm(strokeCaseId, {
        ...data,
        outcomeFormCompletionDate: finalCompletionDate,
        outcomePercentageCompleteness: completenessPercentage,
      });

      // Update completeness with the returned data
      updateCompleteness(result);
      if (result.outcomeFormCompletionDate) {
        setCompletionDate(result.outcomeFormCompletionDate);
      }

      console.log('Stroke outcome form updated successfully');
      onSuccess?.();
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
            <Typography variant="h6">Stroke Outcome Form</Typography>
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
              Complete the outcome form to track stroke case outcomes and follow-up care.
            </Alert>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Discharge Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Discharge Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="dischargeType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Discharge Type</InputLabel>
                      <Select {...field} label="Discharge Type">
                        <MenuItem value="PLANNED">Planned</MenuItem>
                        <MenuItem value="UNPLANNED">Unplanned</MenuItem>
                        <MenuItem value="AGAINST_MEDICAL_ADVICE">Against Medical Advice</MenuItem>
                        <MenuItem value="TRANSFER">Transfer</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="functionalStatus"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Functional Status</InputLabel>
                      <Select {...field} label="Functional Status">
                        <MenuItem value="INDEPENDENT">Independent</MenuItem>
                        <MenuItem value="ASSISTANCE_REQUIRED">Assistance Required</MenuItem>
                        <MenuItem value="DEPENDENT">Dependent</MenuItem>
                        <MenuItem value="SEVERELY_DEPENDENT">Severely Dependent</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="dischargeModifiedRankinScale"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Discharge Modified Rankin Scale</InputLabel>
                      <Select 
                        {...field} 
                        value={field.value ?? ''} 
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        label="Discharge Modified Rankin Scale"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 150,
                            },
                          },
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value={0}>0 - No symptoms</MenuItem>
                        <MenuItem value={1}>1 - No significant disability</MenuItem>
                        <MenuItem value={2}>2 - Slight disability</MenuItem>
                        <MenuItem value={3}>3 - Moderate disability</MenuItem>
                        <MenuItem value={4}>4 - Moderately severe disability</MenuItem>
                        <MenuItem value={5}>5 - Severe disability</MenuItem>
                        <MenuItem value={6}>6 - Dead</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="mortality"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Mortality Status</InputLabel>
                      <Select {...field} label="Mortality Status">
                        <MenuItem value="ALIVE">Alive</MenuItem>
                        <MenuItem value="DEAD">Dead</MenuItem>
                        <MenuItem value="UNKNOWN">Unknown</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Follow-up Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Follow-up Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="followUpType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Follow-up Type</InputLabel>
                      <Select {...field} label="Follow-up Type">
                        <MenuItem value="PHONE">Phone</MenuItem>
                        <MenuItem value="IN_PERSON">In Person</MenuItem>
                        <MenuItem value="TELEHEALTH">Telehealth</MenuItem>
                        <MenuItem value="MAIL">Mail</MenuItem>
                        <MenuItem value="NOT_COMPLETED">Not Completed</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="followUpModifiedRankinScale"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Follow-up Modified Rankin Scale at 90 days</InputLabel>
                      <Select 
                        {...field} 
                        value={field.value ?? ''} 
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        label="Follow-up Modified Rankin Scale"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 150,
                            },
                          },
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value={0}>0 - No symptoms</MenuItem>
                        <MenuItem value={1}>1 - No significant disability</MenuItem>
                        <MenuItem value={2}>2 - Slight disability</MenuItem>
                        <MenuItem value={3}>3 - Moderate disability</MenuItem>
                        <MenuItem value={4}>4 - Moderately severe disability</MenuItem>
                        <MenuItem value={5}>5 - Severe disability</MenuItem>
                        <MenuItem value={6}>6 - Dead</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="threeMonthFollowupComplete"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="3-Month Follow-up Complete"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="followUpNotCompletedReason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Follow-up Not Completed Reason"
                      multiline
                      rows={2}
                      helperText="If follow-up was not completed, specify the reason"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="followUpSpecify"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Follow-up Details"
                      multiline
                      rows={3}
                      helperText="Additional follow-up information or notes"
                    />
                  )}
                />
              </Grid>

              {/* Closure Report */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Closure Information
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="closureReport"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Closure Report"
                      multiline
                      rows={4}
                      helperText="Summary of case closure and final outcomes"
                    />
                  )}
                />
              </Grid>

              {/* Completion Status */}
              {completionDate && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'success.main',
                    }}
                  >
                    <Typography variant="body2" color="success.dark" fontWeight="high">
                      ✓ Outcome form completed
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="medium" display="block" sx={{ mt: 0.5 }}>
                      Completed on: {new Date(completionDate).toLocaleString()}
                      {user && ` by ${user.firstName} ${user.lastName}`}
                    </Typography>
                  </Box>
                </Grid>
              )}
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

export default StrokeOutcomeForm;
