import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

import { CreateStrokeCaseData, StrokeService } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: CreateStrokeCaseData;
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

  const hasWarnings = Object.keys(timelineWarnings).length > 0;

  const emphasizeKeywords = (text: string) => {
    const keywords = [
      'Symptom onset',
      'Admission',
      'Triage',
      'Physician assessment',
      'CT scan',
      'CT report',
      'Swallowing screening',
      'Thrombolysis',
      'Thrombectomy',
      'Transfer',
      'SRCA call',
    ];

    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      const isKeyword = keywords.some(
        (keyword) => keyword.toLowerCase() === part.toLowerCase()
      );
      return isKeyword ? (
        <Box key={`${part}-${index}`} component="span" sx={{ fontWeight: 700 }}>
          {part}
        </Box>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      );
    });
  };

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

  const getWarnings = (...fields: string[]) => {
    return fields.flatMap((field) => timelineWarnings[field] || []);
  };

  const renderWarningsList = (warnings: string[]) => {
    if (!warnings.length) {
      return null;
    }

    return (
      <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
        {warnings.map((warning, index) => (
          <Alert key={`${warning}-${index}`} severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {emphasizeKeywords(warning)}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
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

  const hasBedAssignmentErrors = Object.keys(validationErrors).some(key => key.startsWith('bedAssignment.'));

  const patientWarnings = getWarnings(
    'transferRequestDateTime',
    'transferArrivalDateTime'
  );
  const assessmentWarnings = getWarnings(
    'timeOfSymptomOnset',
    'dateOfAdmission',
    'timeOfTriage',
    'timeOfPhysicianAssessment',
    'srcaCallTime'
  );
  const diagnosisWarnings = getWarnings(
    'timeOfCtScanStart',
    'timeOfCtReportFinal',
    'timeOfSwallowingScreening'
  );
  const treatmentWarnings = getWarnings(
    'thrombolysisOrderTime',
    'ivThrombolysisAdministrationTime',
    'timeOfMechanicalThrombectomyPuncture',
    'timeOfThrombectomyComplete',
    'timeOfTransferActivation',
    'timeOfTransferDeparture'
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Stroke Case Details
      </Typography>

      {hasWarnings && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
            Please review the timeline warnings below. Some timestamps may have logical inconsistencies that need to be corrected before submission.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Patient Information Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(patientWarnings.length > 0)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Patient Information
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">Patient Name:</Typography>
                <Typography variant="body1">{formData.patientInfo?.firstName} {formData.patientInfo?.lastName}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">National ID:</Typography>
                <Typography variant="body1">{formData.patientInfo?.nationalId || 'Not provided'}</Typography>
              </Box>
              {formData.patientInfo?.dateOfBirth && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Date of Birth:</Typography>
                  <Typography variant="body1">
                    {new Date(formData.patientInfo.dateOfBirth).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">Age:</Typography>
                <Typography variant="body1">{formData.patientInfo?.age ? `${formData.patientInfo.age} years` : 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Origin Hospital:</Typography>
                <Typography variant="body1">{getHospitalName(formData.originHospitalId)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Destination Hospital:</Typography>
                <Typography variant="body1">
                  {formData.destinationHospitalId ? getHospitalName(formData.destinationHospitalId) : 'None'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Mode of Arrival:</Typography>
                <Typography variant="body1">
                  {formData.modeOfArrival ? StrokeService.getModeOfArrivalLabel(formData.modeOfArrival) : 'Not specified'}
                </Typography>
              </Box>
              {formData.transferRequestDateTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Transfer Request Date & Time:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.transferRequestDateTime), !!timelineWarnings['transferRequestDateTime'])}
                  </Typography>
                </Box>
              )}
              {formData.transferArrivalDateTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Transfer Arrival Date & Time:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.transferArrivalDateTime), !!timelineWarnings['transferArrivalDateTime'])}
                  </Typography>
                </Box>
              )}
              {renderWarningsList(patientWarnings)}
            </CardContent>
          </Card>
        </Grid>

        {/* Assessment & Timing Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(assessmentWarnings.length > 0)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Assessment & Timing
              </Typography>
              {formData.timeOfSymptomOnset && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Time of Symptom Onset:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfSymptomOnset), !!timelineWarnings['timeOfSymptomOnset'])}
                  </Typography>
                </Box>
              )}
              {formData.dateOfAdmission && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Date of Admission:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.dateOfAdmission), !!timelineWarnings['dateOfAdmission'])}
                  </Typography>
                </Box>
              )}
              {formData.timeOfTriage && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Time of Triage:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfTriage), !!timelineWarnings['timeOfTriage'])}
                  </Typography>
                </Box>
              )}
              {formData.timeOfPhysicianAssessment && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Time of Physician Assessment:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfPhysicianAssessment), !!timelineWarnings['timeOfPhysicianAssessment'])}
                  </Typography>
                </Box>
              )}
              {formData.srcaCallTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">SRCA Call Time:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.srcaCallTime), !!timelineWarnings['srcaCallTime'])}
                  </Typography>
                </Box>
              )}
              {renderWarningsList(assessmentWarnings)}
            </CardContent>
          </Card>
        </Grid>

        {/* Diagnosis Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(diagnosisWarnings.length > 0)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Diagnosis
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">Stroke Type:</Typography>
                <Typography variant="body1">{StrokeService.getStrokeTypeLabel(formData.strokeType)}</Typography>
              </Box>
              {formData.ctScanPerformed && formData.timeOfCtScanStart && (
                <Box>
                  <Typography variant="body2" color="text.secondary">CT Scan Start:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfCtScanStart), !!timelineWarnings['timeOfCtScanStart'])}
                  </Typography>
                </Box>
              )}
              {formData.ctScanPerformed && formData.timeOfCtReportFinal && (
                <Box>
                  <Typography variant="body2" color="text.secondary">CT Report Final:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfCtReportFinal), !!timelineWarnings['timeOfCtReportFinal'])}
                  </Typography>
                </Box>
              )}
              {formData.swallowingScreeningPerformed && formData.timeOfSwallowingScreening && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Swallowing Screening:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfSwallowingScreening), !!timelineWarnings['timeOfSwallowingScreening'])}
                  </Typography>
                </Box>
              )}
              {renderWarningsList(diagnosisWarnings)}
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(treatmentWarnings.length > 0)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Treatment
              </Typography>
              {formData.thrombolysisOrderTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Thrombolysis Order Time:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.thrombolysisOrderTime), !!timelineWarnings['thrombolysisOrderTime'])}
                  </Typography>
                </Box>
              )}
              {formData.ivThrombolysisAdministrationTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">IV Thrombolysis Administration:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.ivThrombolysisAdministrationTime), !!timelineWarnings['ivThrombolysisAdministrationTime'])}
                  </Typography>
                </Box>
              )}
              {formData.timeOfMechanicalThrombectomyPuncture && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Thrombectomy Puncture:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfMechanicalThrombectomyPuncture), !!timelineWarnings['timeOfMechanicalThrombectomyPuncture'])}
                  </Typography>
                </Box>
              )}
              {formData.timeOfThrombectomyComplete && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Thrombectomy Complete:</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(formData.timeOfThrombectomyComplete), !!timelineWarnings['timeOfThrombectomyComplete'])}
                  </Typography>
                </Box>
              )}
              {renderWarningsList(treatmentWarnings)}
            </CardContent>
          </Card>
        </Grid>

        {/* Bed Assignment */}
        {(formData.bedAssignment?.assignedBed || formData.bedAssignment?.bedId || formData.bedAssignment?.bedNumber || hasBedAssignmentErrors) && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles(hasBedAssignmentErrors)}>
              <CardContent sx={cardContentStyles}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Bed Assignment
                </Typography>
                {formData.bedAssignment?.assignedBed ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Bed Number</Typography>
                      {renderValue(formData.bedAssignment.assignedBed.bedNumber)}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Unit</Typography>
                      {renderValue(formData.bedAssignment.assignedBed.unitName)}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Hospital</Typography>
                      {renderValue(formData.bedAssignment.assignedBed.hospitalName)}
                    </Box>
                    {formData.bedAssignment.arrivalDate && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Expected Arrival Date/Time</Typography>
                        {renderValue(formatDateTime(formData.bedAssignment.arrivalDate))}
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">Bed ID</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {formData.bedAssignment.assignedBed.id}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No bed assigned in this step.
                    </Typography>
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
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ReviewStep;
