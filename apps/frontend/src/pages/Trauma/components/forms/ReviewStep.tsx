import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: {
    patientInfo: any;
    incidentDetails: any;
    vitalsAssessment: any;
    injuryAssessment: any;
    disposition: any;
  };
  timelineWarnings?: Record<string, string[]>;
  validationErrors?: Record<string, string>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, timelineWarnings = {}, validationErrors = {} }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsData = await hospitalService.getAllHospitals();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };

    fetchHospitals();
  }, []);

  const getHospitalName = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital ? hospital.name : hospitalId;
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'Not specified';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  const cardStyles = (highlight = false) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: 3,
    boxShadow: highlight
      ? '0px 12px 30px rgba(234, 179, 8, 0.25)'
      : '0px 12px 30px rgba(15, 23, 42, 0.08)',
    border: `1px solid ${highlight ? 'rgba(234, 179, 8, 0.6)' : 'rgba(15, 23, 42, 0.05)'}`,
    transition: 'border-color 0.3s ease',
  });

  const cardContentStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1.25,
    px: 3,
    py: 3,
  };

  const renderValue = (value: any, hasIssue = false) => {
    if (value === null || value === undefined || value === '') {
      return <Typography variant="body2" color="text.secondary">Not specified</Typography>;
    }
    return (
      <Typography
        variant="body2"
        sx={{
          fontWeight: hasIssue ? 700 : 400,
          color: hasIssue ? 'warning.dark' : 'text.primary',
        }}
      >
        {String(value)}
      </Typography>
    );
  };

  const hasPatientErrors = Object.keys(validationErrors).some(key => key.startsWith('patientInfo.'));
  const hasIncidentErrors = Object.keys(validationErrors).some(key => key.startsWith('incidentDetails.'));
  const hasDispositionErrors = Object.keys(validationErrors).some(key => key.startsWith('disposition.'));

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasPatientErrors)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Patient Information
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                {renderValue(`${formData.patientInfo?.firstName || ''} ${formData.patientInfo?.lastName || ''}`.trim())}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  National ID
                </Typography>
                {renderValue(formData.patientInfo?.nationalId)}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Age
                </Typography>
                {renderValue(
                  formData.patientInfo?.age,
                  !!validationErrors['patientInfo.age']
                )}
                {validationErrors['patientInfo.age'] && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                    {validationErrors['patientInfo.age']}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gender
                </Typography>
                {renderValue(formData.patientInfo?.gender)}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone Number
                </Typography>
                {renderValue(formData.patientInfo?.phoneNumber)}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Origin Hospital
                </Typography>
                {renderValue(getHospitalName(formData.patientInfo?.originHospitalId || ''))}
              </Box>
              {formData.patientInfo?.destinationHospitalId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Destination Hospital
                  </Typography>
                  {renderValue(getHospitalName(formData.patientInfo.destinationHospitalId))}
                </Box>
              )}
              {hasPatientErrors && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(validationErrors)
                    .filter(([key]) => key.startsWith('patientInfo.'))
                    .map(([key, message]) => (
                      <Alert key={key} severity="error" variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
                          <strong>{key.replace('patientInfo.', '').replace(/([A-Z])/g, ' $1').trim()}:</strong> {message}
                        </Typography>
                      </Alert>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Incident Details */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasIncidentErrors)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Incident Details & Timing
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Arrival Date & Time
                </Typography>
                {renderValue(formatDateTime(formData.incidentDetails?.arrivalDateTime))}
              </Box>
              {formData.incidentDetails?.incidentDateTime && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Incident Date & Time
                  </Typography>
                  {renderValue(formatDateTime(formData.incidentDetails.incidentDateTime))}
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Mode of Arrival
                </Typography>
                {renderValue(formData.incidentDetails?.modeOfArrival)}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Mechanism of Injury
                </Typography>
                {renderValue(formData.incidentDetails?.mechanismOfInjury)}
              </Box>
              {formData.incidentDetails?.transferRequestDateTime && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transfer Request Date & Time
                  </Typography>
                  {renderValue(formatDateTime(formData.incidentDetails.transferRequestDateTime))}
                </Box>
              )}
              {formData.incidentDetails?.transferArrivalDateTime && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transfer Arrival Date & Time
                  </Typography>
                  {renderValue(formatDateTime(formData.incidentDetails.transferArrivalDateTime))}
                </Box>
              )}
              {formData.incidentDetails?.chiefComplaint && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Chief Complaint
                  </Typography>
                  {renderValue(formData.incidentDetails.chiefComplaint)}
                </Box>
              )}
              {hasIncidentErrors && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(validationErrors)
                    .filter(([key]) => key.startsWith('incidentDetails.'))
                    .map(([key, message]) => (
                      <Alert key={key} severity="error" variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
                          <strong>{key.replace('incidentDetails.', '').replace(/([A-Z])/g, ' $1').trim()}:</strong> {message}
                        </Typography>
                      </Alert>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vitals Assessment */}
        {(formData.vitalsAssessment?.glasgowComaScale || 
          formData.vitalsAssessment?.vitalSigns?.heartRate ||
          formData.vitalsAssessment?.vitalSigns?.bloodPressure) && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles()}>
              <CardContent sx={cardContentStyles}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Vitals Assessment
                </Typography>
                {formData.vitalsAssessment?.glasgowComaScale && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Glasgow Coma Scale
                    </Typography>
                    {renderValue(formData.vitalsAssessment.glasgowComaScale)}
                  </Box>
                )}
                {formData.vitalsAssessment?.vitalSigns?.heartRate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Heart Rate
                    </Typography>
                    {renderValue(formData.vitalsAssessment.vitalSigns.heartRate)}
                  </Box>
                )}
                {formData.vitalsAssessment?.vitalSigns?.bloodPressure && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Blood Pressure
                    </Typography>
                    {renderValue(formData.vitalsAssessment.vitalSigns.bloodPressure)}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Disposition */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasDispositionErrors)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Disposition
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ED Disposition
                </Typography>
                {renderValue(
                  formData.disposition?.edDisposition,
                  !!validationErrors['disposition.edDisposition']
                )}
                {validationErrors['disposition.edDisposition'] && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                    {validationErrors['disposition.edDisposition']}
                  </Typography>
                )}
              </Box>
              {hasDispositionErrors && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(validationErrors)
                    .filter(([key]) => key.startsWith('disposition.'))
                    .map(([key, message]) => (
                      <Alert key={key} severity="error" variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
                          <strong>{key.replace('disposition.', '').replace(/([A-Z])/g, ' $1').trim()}:</strong> {message}
                        </Typography>
                      </Alert>
                    ))}
                </Box>
              )}
              {formData.disposition?.disposition?.followUpRequired && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Follow-up Required
                  </Typography>
                  {renderValue('Yes')}
                </Box>
              )}
              {formData.disposition?.disposition?.followUpDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Follow-up Date
                  </Typography>
                  {renderValue(formData.disposition.disposition.followUpDate)}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewStep;

