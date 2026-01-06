import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material';

import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: {
    patientInfo: any;
    incidentDetails: any;
    vitalsAssessment: any;
    injuryAssessment: any;
    disposition: any;
    bedAssignment?: any;
  };
  timelineWarnings?: Record<string, string[]>;
  validationErrors?: Record<string, string>;
  kpiViolations?: Record<string, string[]>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  timelineWarnings: _timelineWarnings = {},
  validationErrors = {},
  kpiViolations = {}
}) => {
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

  // Styling constants matching Stemi/Stroke
  const cardStyles = (highlight: 'error' | 'warning' | null = null) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: 3,
    boxShadow: highlight
      ? highlight === 'error'
        ? '0px 12px 30px rgba(239, 68, 68, 0.15)'
        : '0px 12px 30px rgba(245, 158, 11, 0.15)'
      : '0px 12px 30px rgba(15, 23, 42, 0.08)',
    border: `1px solid ${highlight
      ? highlight === 'error'
        ? 'rgba(239, 68, 68, 0.6)'
        : 'rgba(245, 158, 11, 0.6)'
      : 'rgba(15, 23, 42, 0.05)'
      }`,
    transition: 'all 0.3s ease',
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
          color: hasIssue ? 'error.main' : 'text.primary',
        }}
      >
        {String(value)}
      </Typography>
    );
  };

  const renderWarningsList = (warnings: string[]) => {
    if (!warnings || warnings.length === 0) return null;
    return (
      <Box sx={{ mt: 1 }}>
        {warnings.map((warning, index) => (
          <Alert
            key={index}
            severity="error"
            variant="outlined"
            sx={{
              mb: 1,
              borderRadius: 2,
              borderColor: 'error.main',
              bgcolor: 'transparent',
              '& .MuiAlert-icon': { color: 'error.main' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.dark' }}>
              {warning}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  // Helper checks
  const getSectionErrors = (prefix: string) => {
    return Object.keys(validationErrors).filter(key => key.startsWith(prefix));
  };

  const renderKpiViolationsList = (violations: string[]) => {
    if (!violations || violations.length === 0) return null;
    return (
      <Box sx={{ mt: 1 }}>
        {violations.map((violation, index) => (
          <Alert
            key={index}
            severity="warning"
            variant="outlined"
            sx={{
              mb: 1,
              borderRadius: 2,
              borderColor: 'warning.main',
              bgcolor: 'transparent',
              '& .MuiAlert-icon': { color: 'warning.main' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
              {violation}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  const getSectionTimelineWarnings = (prefix: string) => {
    return Object.keys(_timelineWarnings).filter(key => key.startsWith(prefix));
  };

  const hasErrors = (prefix: string) => getSectionErrors(prefix).length > 0 || getSectionTimelineWarnings(prefix).length > 0;

  const hasPatientErrors = hasErrors('patientInfo.');
  const hasIncidentErrors = hasErrors('incidentDetails.');
  const hasDispositionErrors = hasErrors('disposition.');
  const hasBedAssignmentErrors = hasErrors('bedAssignment.');


  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasPatientErrors ? 'error' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Patient Information
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {hasPatientErrors && (
                    <Chip
                      label="Issue Found"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {getSectionTimelineWarnings('patientInfo.').length === 0 && Object.keys(validationErrors).filter(k => k.startsWith('patientInfo.')).length === 0 &&
                    kpiViolations && Object.keys(kpiViolations).some(k => k.startsWith('patientInfo.')) && (
                      <Chip
                        label="KPI Violation"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                </Box>
              </Box>
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
              {formData.patientInfo?.dateOfBirth && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body2">
                    {new Date(formData.patientInfo.dateOfBirth).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </Typography>
                </Box>
              )}
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
                  Email
                </Typography>
                {renderValue(formData.patientInfo?.email)}
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
              {renderWarningsList([
                ...getSectionErrors('patientInfo.').map(k => `${k.split('.').pop()}: ${validationErrors[k]}`),
                ...getSectionTimelineWarnings('patientInfo.')
              ])}
              {renderKpiViolationsList(
                Object.keys(kpiViolations || {}).filter(k => k.startsWith('patientInfo.')).flatMap(k => kpiViolations![k])
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Incident Details */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasIncidentErrors ? 'error' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Incident Details & Timing
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {hasIncidentErrors && (
                    <Chip
                      label="Timeline Issue"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {getSectionTimelineWarnings('incidentDetails.').length === 0 && Object.keys(validationErrors).filter(k => k.startsWith('incidentDetails.')).length === 0 &&
                    kpiViolations && Object.keys(kpiViolations).some(k => k.startsWith('incidentDetails.')) && (
                      <Chip
                        label="KPI Violation"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                </Box>
              </Box>
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
              {renderWarningsList([
                ...getSectionErrors('incidentDetails.').map(k => `${k.split('.').pop()}: ${validationErrors[k]}`),
                ...getSectionTimelineWarnings('incidentDetails.')
              ])}
              {renderKpiViolationsList(
                Object.keys(kpiViolations || {}).filter(k => k.startsWith('incidentDetails.')).flatMap(k => kpiViolations![k])
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Vitals Assessment
                    </Typography>
                    {kpiViolations && Object.keys(kpiViolations).some(k => k.startsWith('vitalsAssessment.')) && (
                      <Chip
                        label="KPI Violation"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Box>
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
                  {renderKpiViolationsList(
                    Object.keys(kpiViolations || {}).filter(k => k.startsWith('vitalsAssessment.')).flatMap(k => kpiViolations![k])
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

        {/* Bed Assignment */}
        {(formData.bedAssignment?.assignedBed || formData.bedAssignment?.bedId || formData.bedAssignment?.bedNumber || hasBedAssignmentErrors) && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles(hasBedAssignmentErrors ? 'error' : null)}>
              <CardContent sx={cardContentStyles}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Bed Assignment
                  </Typography>
                  {kpiViolations && Object.keys(kpiViolations).some(k => k.startsWith('bedAssignment.')) && (
                    <Chip
                      label="KPI Violation"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Box>
                {formData.bedAssignment?.assignedBed ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Bed Number
                      </Typography>
                      {renderValue(formData.bedAssignment.assignedBed.bedNumber)}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Unit
                      </Typography>
                      {renderValue(formData.bedAssignment.assignedBed.unitName)}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Hospital
                      </Typography>
                      {renderValue(formData.bedAssignment.assignedBed.hospitalName)}
                    </Box>
                    {formData.bedAssignment.arrivalDate && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Expected Arrival Date/Time
                        </Typography>
                        {renderValue(formatDateTime(formData.bedAssignment.arrivalDate))}
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Bed ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {formData.bedAssignment.assignedBed.id}
                      </Typography>
                    </Box>
                  </>
                ) : (formData.bedAssignment?.bedNumber || formData.bedAssignment?.bedId) ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bed: {formData.bedAssignment.bedNumber || formData.bedAssignment.bedId}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                      Bed assignment validation required
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      No bed assigned
                    </Typography>
                  </Box>
                )}
                {hasBedAssignmentErrors && (
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(validationErrors)
                      .filter(([key]) => key.startsWith('bedAssignment.'))
                      .map(([key, message]) => (
                        <Alert key={key} severity="error" variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
                            <strong>{key.replace('bedAssignment.', '').replace(/([A-Z])/g, ' $1').trim()}:</strong> {message}
                          </Typography>
                        </Alert>
                      ))}
                  </Box>
                )}
                {renderKpiViolationsList(
                  Object.keys(kpiViolations || {}).filter(k => k.startsWith('bedAssignment.')).flatMap(k => kpiViolations![k])
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Disposition */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(hasDispositionErrors ? 'error' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Disposition
                </Typography>
                {kpiViolations && Object.keys(kpiViolations).some(k => k.startsWith('disposition.')) && (
                  <Chip
                    label="KPI Violation"
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>
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
              {renderKpiViolationsList(
                Object.keys(kpiViolations || {}).filter(k => k.startsWith('bedAssignment.')).flatMap(k => kpiViolations![k])
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Injury Assessment - Full width at bottom */}
        {(formData.injuryAssessment?.headAndNeckInjury ||
          formData.injuryAssessment?.faceInjury ||
          formData.injuryAssessment?.chestInjury ||
          formData.injuryAssessment?.abdomenInjury ||
          formData.injuryAssessment?.extremitiesInjury ||
          formData.injuryAssessment?.externalInjury) && (
            <Grid item xs={12}>
              <Card sx={cardStyles()}>
                <CardContent sx={cardContentStyles}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Injury Assessment by Body Region
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.injuryAssessment?.headAndNeckInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Head & Neck Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.headAndNeckInjury)}
                        </Box>
                      </Grid>
                    )}
                    {formData.injuryAssessment?.faceInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Face Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.faceInjury)}
                        </Box>
                      </Grid>
                    )}
                    {formData.injuryAssessment?.chestInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Chest Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.chestInjury)}
                        </Box>
                      </Grid>
                    )}
                    {formData.injuryAssessment?.abdomenInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Abdomen Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.abdomenInjury)}
                        </Box>
                      </Grid>
                    )}
                    {formData.injuryAssessment?.extremitiesInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Extremities Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.extremitiesInjury)}
                        </Box>
                      </Grid>
                    )}
                    {formData.injuryAssessment?.externalInjury && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            External Injury
                          </Typography>
                          {renderValue(formData.injuryAssessment.externalInjury)}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
      </Grid>
    </Box >
  );
};

export default ReviewStep;

