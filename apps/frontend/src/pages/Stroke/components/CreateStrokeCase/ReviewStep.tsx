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

import { CreateStrokeCaseData, StrokeService } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: CreateStrokeCaseData;
  timelineWarnings?: Record<string, string[]>;
  kpiViolations?: Record<string, string>;
  validationErrors?: Record<string, string>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, timelineWarnings = {}, kpiViolations = {}, validationErrors = {} }) => {
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

  const cardStyles = (severity: 'error' | 'warning' | null = null) => {
    let borderColor = 'rgba(15, 23, 42, 0.05)';
    let boxShadow = '0px 12px 30px rgba(15, 23, 42, 0.08)';

    if (severity === 'error') {
      borderColor = 'rgba(239, 68, 68, 0.6)'; // Red
      boxShadow = '0px 12px 30px rgba(239, 68, 68, 0.15)';
    } else if (severity === 'warning') {
      borderColor = 'rgba(245, 158, 11, 0.6)'; // Amber/Yellow
      boxShadow = '0px 12px 30px rgba(245, 158, 11, 0.15)';
    }

    return {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: 3,
      boxShadow,
      border: `1px solid ${borderColor}`,
      transition: 'border-color 0.3s ease',
    };
  };

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

  const getKpiViolations = (...fields: string[]) => {
    return fields.filter(field => kpiViolations[field]).map(field => kpiViolations[field]);
  };

  const renderKpiViolationsList = (violations: string[]) => {
    if (!violations.length) return null;

    return (
      <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
        {violations.map((violation, index) => (
          <Alert
            key={`${violation}-${index}`}
            severity="warning"
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontSize: '0.95rem',
              bgcolor: 'transparent',
              borderColor: 'warning.main',
              color: 'warning.dark',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'inherit' }}>
              {violation}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  const renderWarningsList = (warnings: string[]) => {
    if (!warnings.length) {
      return null;
    }

    return (
      <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
        {warnings.map((warning, index) => (
          <Alert
            key={`${warning}-${index}`}
            severity="error"
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontSize: '0.95rem',
              bgcolor: 'transparent',
              borderColor: 'error.main',
              color: 'error.dark',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'inherit' }}>
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
  const hasKpiViolations = Object.keys(kpiViolations).length > 0;

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
  const assessmentKpiViolations = getKpiViolations(
    'timeOfTriage',
    'timeOfPhysicianAssessment'
  );

  const diagnosisKpiViolations = getKpiViolations(
    'timeOfCtScanStart',
    'timeOfCtReportFinal'
  );

  const treatmentKpiViolations = getKpiViolations(
    'ivThrombolysisAdministrationTime',
    'timeOfMechanicalThrombectomyPuncture'
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Stroke Case Details
      </Typography>

      {hasWarnings && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
            Submission Blocked: Please resolve the timeline errors (red) below:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
            {Object.keys(timelineWarnings).map((key) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
              return <li key={key}><Typography variant="body2">{label}</Typography></li>;
            })}
          </Box>
        </Alert>
      )}

      {hasKpiViolations && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
            KPI Attention: Some timings exceed target thresholds (yellow). You may proceed with these warnings.
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
            {Object.keys(kpiViolations).map((key) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
              return <li key={key}><Typography variant="body2">{label}</Typography></li>;
            })}
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Patient Information Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(patientWarnings.length > 0 ? 'error' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Patient Information
                </Typography>
                {(patientWarnings.length > 0) ? (
                  <Chip label="Timeline Issue" color="error" size="small" />
                ) : null}
              </Box>
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
          <Card sx={cardStyles(assessmentWarnings.length > 0 ? 'error' : assessmentKpiViolations.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Assessment & Timing
                </Typography>
                {(assessmentWarnings.length > 0) ? (
                  <Chip label="Timeline Issue" color="error" size="small" />
                ) : (assessmentKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="warning" size="small" />
                ) : null}
              </Box>
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
              {renderKpiViolationsList(assessmentKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Diagnosis Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(diagnosisWarnings.length > 0 ? 'error' : diagnosisKpiViolations.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Diagnosis
                </Typography>
                {(diagnosisWarnings.length > 0) ? (
                  <Chip label="Timeline Issue" color="error" size="small" />
                ) : (diagnosisKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="warning" size="small" />
                ) : null}
              </Box>
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
              {renderKpiViolationsList(diagnosisKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(treatmentWarnings.length > 0 ? 'error' : treatmentKpiViolations.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Treatment
                </Typography>
                {(treatmentWarnings.length > 0) ? (
                  <Chip label="Timeline Issue" color="error" size="small" />
                ) : (treatmentKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="warning" size="small" />
                ) : null}
              </Box>
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
              {renderKpiViolationsList(treatmentKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Bed Assignment */}
        {(formData.bedAssignment?.assignedBed || formData.bedAssignment?.bedId || formData.bedAssignment?.bedNumber || hasBedAssignmentErrors) && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles(hasBedAssignmentErrors ? 'error' : null)}>
              <CardContent sx={cardContentStyles}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Bed Assignment
                  </Typography>
                  {hasBedAssignmentErrors && (
                    <Chip label="Validation Error" color="error" size="small" />
                  )}
                </Box>
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
