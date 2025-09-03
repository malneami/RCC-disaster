import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { CreateTicketData } from '../../../../services/ticketService';

interface ReviewStepProps {
  formData: Partial<CreateTicketData>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  // For now, we'll show the data as-is without fetching additional details
  // In a real implementation, you would fetch patient and hospital details here

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'error';
      case 'EMERGENCY': return 'error';
      default: return 'default';
    }
  };

  const formatSymptoms = (symptoms: any) => {
    if (!symptoms?.symptoms) return 'None specified';
    return symptoms.symptoms.join(', ');
  };

  const formatRequiredResources = (resources: any) => {
    if (!resources) return 'None specified';
    const activeResources = Object.entries(resources)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key.toUpperCase());
    return activeResources.length > 0 ? activeResources.join(', ') : 'None specified';
  };

  const formatSpecialRequirements = () => {
    const requirements = [];
    if (formData.isEmergency) requirements.push('Emergency Case');
    if (formData.requiresBlood) requirements.push('Requires Blood');
    if (formData.requiresSpecialist) requirements.push('Requires Specialist');
    return requirements.length > 0 ? requirements.join(', ') : 'None';
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Transfer Request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all information before creating the transfer ticket
      </Typography>

      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Patient Name
                  </Typography>
                  <Typography variant="body1">
                    Patient ID: {formData.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    MRN
                  </Typography>
                  <Typography variant="body1">
                    N/A
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Hospital Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hospital Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Origin Hospital
                  </Typography>
                  <Typography variant="body1">
                    Hospital ID: {formData.originHospitalId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Destination Hospital
                  </Typography>
                  <Typography variant="body1">
                    {formData.destinationHospitalId ? `Hospital ID: ${formData.destinationHospitalId}` : 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip 
                    label={formData.priority} 
                    color={getPriorityColor(formData.priority || 'MEDIUM') as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pathway
                  </Typography>
                  <Typography variant="body1">
                    {formData.pathway}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Chief Complaint
                  </Typography>
                  <Typography variant="body1">
                    {formData.chiefComplaint}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms
                  </Typography>
                  <Typography variant="body1">
                    {formatSymptoms(formData.symptoms)}
                  </Typography>
                </Grid>
                {formData.treatmentPlan && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Treatment Plan
                    </Typography>
                    <Typography variant="body1">
                      {formData.treatmentPlan}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Special Requirements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Special Requirements
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Special Requirements
                  </Typography>
                  <Typography variant="body1">
                    {formatSpecialRequirements()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Required Resources
                  </Typography>
                  <Typography variant="body1">
                    {formatRequiredResources(formData.requiredResources)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Transport Information */}
        {(formData.transportMode || formData.emsUnit || formData.estimatedArrival || formData.notes) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transport Information
                </Typography>
                <Grid container spacing={2}>
                  {formData.transportMode && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Transport Mode
                      </Typography>
                      <Typography variant="body1">
                        {formData.transportMode}
                      </Typography>
                    </Grid>
                  )}
                  {formData.emsUnit && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        EMS Unit
                      </Typography>
                      <Typography variant="body1">
                        {formData.emsUnit}
                      </Typography>
                    </Grid>
                  )}
                  {formData.estimatedArrival && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Arrival
                      </Typography>
                      <Typography variant="body1">
                        {new Date(formData.estimatedArrival).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {formData.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Additional Notes
                      </Typography>
                      <Typography variant="body1">
                        {formData.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Validation Summary */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Ready to create transfer ticket</strong>
          <br />
          All required information has been provided. Click "Create Ticket" to submit the transfer request.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ReviewStep;
