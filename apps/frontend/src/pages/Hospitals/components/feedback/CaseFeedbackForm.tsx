import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Typography,
  Divider,
  Rating,
  Chip,
  Alert,
  Stack,
  FormGroup,
  Checkbox,
  Paper,
} from '@mui/material';
import { AssessmentOutlined as AssessmentIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { UnifiedTicket } from '../../types/tickets';
import { caseFeedbackService, CreateCaseFeedbackData } from '../../../../services/caseFeedbackService';

interface CaseFeedbackFormProps {
  ticket: UnifiedTicket;
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CaseFeedbackForm: React.FC<CaseFeedbackFormProps> = ({
  ticket,
  open,
  onSuccess,
  onCancel,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateCaseFeedbackData>>({
    ticketId: ticket.id,
    reviewDate: format(new Date(), 'yyyy-MM-dd'),
    reviewerName: '',
    receivingConsultant: '',
    
    // Section B
    activationAppropriateness: '',
    conferenceCallEffectiveness: '',
    destinationAppropriateness: '',
    transportSafety: '',
    teamSuitability: '',
    documentationQuality: '',
    documentationMissingElements: [],
    
    // Section D
    patientOutcome: '',
    
    // Section E
    rccCoordinationRating: 3,
    additionalComments: '',
  });

  const handleChange = (field: keyof CreateCaseFeedbackData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: 'documentationMissingElements', value: string, checked: boolean) => {
    const current = formData[field] || [];
    if (checked) {
      handleChange(field, [...current, value]);
    } else {
      handleChange(field, current.filter((v) => v !== value));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.reviewerName) {
      enqueueSnackbar('Reviewer name is required', { variant: 'error' });
      return;
    }
    if (!formData.activationAppropriateness) {
      enqueueSnackbar('Please answer all required questions in Section B', { variant: 'error' });
      return;
    }
    if (!formData.patientOutcome) {
      enqueueSnackbar('Patient outcome is required', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await caseFeedbackService.create(formData as CreateCaseFeedbackData);
      enqueueSnackbar('Feedback submitted successfully', { variant: 'success' });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to submit feedback',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <AssessmentIcon color="primary" />
          <Box>
            <Typography variant="h6">
              RCC Case Feedback & Success Evaluation
            </Typography>
            <Typography variant="caption" color="text.secondary">
              To be completed within 24-48 hours after patient arrival
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* SECTION A: Case Identification (Auto-filled) */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
              Section A: Case Identification
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }} elevation={0}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Ticket:</strong> {ticket.ticketNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Pathway:</strong> <Chip label={ticket.pathway} size="small" />
                </Typography>
                <Typography variant="body2">
                  <strong>Referring Hospital:</strong> {ticket.originHospital?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Destination Hospital:</strong> {ticket.destinationHospital?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Patient:</strong> {ticket.patient?.firstName} {ticket.patient?.lastName}
                </Typography>
                {ticket.completedAt && (
                  <Typography variant="body2">
                    <strong>Completed:</strong> {format(new Date(ticket.completedAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Box mt={2}>
              <TextField
                fullWidth
                label="Receiving Consultant"
                value={formData.receivingConsultant}
                onChange={(e) => handleChange('receivingConsultant', e.target.value)}
                size="small"
              />
            </Box>
            <Box mt={2} display="flex" gap={2}>
              <TextField
                fullWidth
                label="Reviewer Name"
                value={formData.reviewerName}
                onChange={(e) => handleChange('reviewerName', e.target.value)}
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Review Date"
                type="date"
                value={formData.reviewDate}
                onChange={(e) => handleChange('reviewDate', e.target.value)}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          <Divider />

          {/* SECTION B: Operational Performance Review */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
              Section B: Operational Performance Review
            </Typography>

            {/* Q1: Activation Level */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>
                1. Was the case activated at the correct urgency level?
              </FormLabel>
              <RadioGroup
                value={formData.activationAppropriateness}
                onChange={(e) => handleChange('activationAppropriateness', e.target.value)}
              >
                <FormControlLabel value="FULLY_APPROPRIATE" control={<Radio />} label="Fully Appropriate" />
                <FormControlLabel value="ACCEPTABLE" control={<Radio />} label="Acceptable" />
                <FormControlLabel value="NOT_APPROPRIATE" control={<Radio />} label="Not Appropriate" />
              </RadioGroup>
              {formData.activationAppropriateness === 'NOT_APPROPRIATE' && (
                <TextField
                  fullWidth
                  label="Reason for inappropriateness"
                  value={formData.activationInappropriateReason}
                  onChange={(e) => handleChange('activationInappropriateReason', e.target.value)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>

            {/* Q2: Conference Call */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>2. Conference call effectiveness?</FormLabel>
              <RadioGroup
                value={formData.conferenceCallEffectiveness}
                onChange={(e) => handleChange('conferenceCallEffectiveness', e.target.value)}
              >
                <FormControlLabel value="VERY_EFFECTIVE" control={<Radio />} label="Very Effective" />
                <FormControlLabel value="EFFECTIVE" control={<Radio />} label="Effective" />
                <FormControlLabel value="NEUTRAL" control={<Radio />} label="Neutral" />
                <FormControlLabel value="DELAYED" control={<Radio />} label="Delayed" />
                <FormControlLabel value="NOT_CONDUCTED" control={<Radio />} label="Not Conducted" />
              </RadioGroup>
            </FormControl>

            {/* Q3: Destination */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>3. Was destination assignment appropriate?</FormLabel>
              <RadioGroup
                value={formData.destinationAppropriateness}
                onChange={(e) => handleChange('destinationAppropriateness', e.target.value)}
              >
                <FormControlLabel value="FULLY_APPROPRIATE" control={<Radio />} label="Fully Appropriate" />
                <FormControlLabel value="ACCEPTABLE" control={<Radio />} label="Acceptable" />
                <FormControlLabel value="NOT_APPROPRIATE" control={<Radio />} label="Not Appropriate" />
              </RadioGroup>
            </FormControl>

            {/* Q4: Transportation */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>4. Was transportation safe and suitable?</FormLabel>
              <RadioGroup
                value={formData.transportSafety}
                onChange={(e) => handleChange('transportSafety', e.target.value)}
              >
                <FormControlLabel value="FULLY_SAFE_AND_APPROPRIATE" control={<Radio />} label="Fully Safe & Appropriate" />
                <FormControlLabel value="ACCEPTABLE" control={<Radio />} label="Acceptable" />
                <FormControlLabel value="NOT_SAFE_OR_INAPPROPRIATE" control={<Radio />} label="Not Safe / Inappropriate" />
              </RadioGroup>
            </FormControl>

            {/* Q5: Team */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>5. Was the accompanying team suitable?</FormLabel>
              <RadioGroup
                value={formData.teamSuitability}
                onChange={(e) => handleChange('teamSuitability', e.target.value)}
              >
                <FormControlLabel value="FULLY_APPROPRIATE_TEAM" control={<Radio />} label="Fully Appropriate Team" />
                <FormControlLabel value="ACCEPTABLE" control={<Radio />} label="Acceptable" />
                <FormControlLabel value="INADEQUATE" control={<Radio />} label="Inadequate" />
              </RadioGroup>
            </FormControl>

            {/* Q6: Documentation */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>6. Referral documentation quality?</FormLabel>
              <RadioGroup
                value={formData.documentationQuality}
                onChange={(e) => handleChange('documentationQuality', e.target.value)}
              >
                <FormControlLabel value="COMPLETE_AND_STRUCTURED" control={<Radio />} label="Complete & Structured" />
                <FormControlLabel value="MINOR_MISSING_DATA" control={<Radio />} label="Minor Missing Data" />
                <FormControlLabel value="SIGNIFICANT_MISSING_DATA" control={<Radio />} label="Significant Missing Data" />
              </RadioGroup>
              {(formData.documentationQuality === 'MINOR_MISSING_DATA' || 
                formData.documentationQuality === 'SIGNIFICANT_MISSING_DATA') && (
                <FormGroup sx={{ mt: 1, ml: 2 }}>
                  <Typography variant="caption" color="text.secondary">Missing elements:</Typography>
                  {['Vitals', 'Labs', 'ECG', 'Imaging', 'Treatment Plan', 'Consent'].map((element) => (
                    <FormControlLabel
                      key={element}
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.documentationMissingElements?.includes(element)}
                          onChange={(e) => handleCheckboxChange('documentationMissingElements', element, e.target.checked)}
                        />
                      }
                      label={element}
                    />
                  ))}
                </FormGroup>
              )}
            </FormControl>
          </Box>

          <Divider />

          {/* SECTION D: Outcome Assessment */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
              Section D: Outcome Assessment
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>Patient Outcome</FormLabel>
              <RadioGroup
                value={formData.patientOutcome}
                onChange={(e) => handleChange('patientOutcome', e.target.value)}
              >
                <FormControlLabel value="OPTIMAL" control={<Radio />} label="Optimal" />
                <FormControlLabel value="ACCEPTABLE" control={<Radio />} label="Acceptable" />
                <FormControlLabel value="COMPLICATED" control={<Radio />} label="Complicated" />
                <FormControlLabel value="SEVERE_COMPLICATION" control={<Radio />} label="Severe Complication" />
                <FormControlLabel value="MORTALITY" control={<Radio />} label="Mortality" />
              </RadioGroup>
            </FormControl>

            {/* Maternal Pathway - Perinatal Outcome */}
            {ticket.pathway === 'MATERNAL' && (
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel>Perinatal Outcome</FormLabel>
                <RadioGroup
                  value={formData.perinatalOutcome}
                  onChange={(e) => handleChange('perinatalOutcome', e.target.value)}
                >
                  <FormControlLabel value="HEALTHY" control={<Radio />} label="Healthy" />
                  <FormControlLabel value="NICU_ADMISSION" control={<Radio />} label="NICU Admission" />
                  <FormControlLabel value="STILLBIRTH" control={<Radio />} label="Stillbirth" />
                  <FormControlLabel value="NEONATAL_DEATH" control={<Radio />} label="Neonatal Death" />
                </RadioGroup>
              </FormControl>
            )}

            {/* Complications */}
            {(formData.patientOutcome === 'COMPLICATED' || 
              formData.patientOutcome === 'SEVERE_COMPLICATION' ||
              formData.patientOutcome === 'MORTALITY') && (
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel>Was the complication preventable?</FormLabel>
                <RadioGroup
                  value={formData.complicationPreventable}
                  onChange={(e) => handleChange('complicationPreventable', e.target.value)}
                >
                  <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                  <FormControlLabel value="NO" control={<Radio />} label="No" />
                  <FormControlLabel value="UNCERTAIN" control={<Radio />} label="Uncertain" />
                </RadioGroup>
                {formData.complicationPreventable === 'YES' && (
                  <TextField
                    fullWidth
                    label="At which stage could it have been prevented?"
                    value={formData.preventableStage}
                    onChange={(e) => handleChange('preventableStage', e.target.value)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </FormControl>
            )}
          </Box>

          <Divider />

          {/* SECTION E: Overall System Evaluation */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
              Section E: Overall System Evaluation
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel required>Rate RCC coordination quality (1-5 stars)</FormLabel>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Rating
                  value={formData.rccCoordinationRating}
                  onChange={(_, value) => handleChange('rccCoordinationRating', value || 3)}
                  size="large"
                />
                <Typography variant="body2" fontWeight="medium">
                  {formData.rccCoordinationRating}/5
                </Typography>
              </Box>
            </FormControl>

            <TextField
              fullWidth
              label="Additional Comments"
              multiline
              rows={4}
              value={formData.additionalComments}
              onChange={(e) => handleChange('additionalComments', e.target.value)}
              placeholder="Any additional feedback, recommendations, or observations..."
            />
          </Box>

          <Alert severity="info" icon={<AssessmentIcon />}>
            This feedback is critical for continuous quality improvement of the RCC coordination system.
            Your honest assessment helps us serve patients better.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
