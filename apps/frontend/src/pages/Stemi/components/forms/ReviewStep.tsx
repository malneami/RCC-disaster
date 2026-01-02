import React from 'react';
import { KpiViolation } from '../../../../utils/kpiValidationUtils';
import {
  Alert,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { PatientInfo, CriticalTimestamps, InterventionsAndTreatments, ClinicalAssessment } from '../../services/stemiService';
import { BedAssignmentFormData } from '../../../Trauma/types/traumaTypes';

interface ReviewStepProps {
  patientInfo: PatientInfo;
  admissionDetails: {
    admissionTime: string;
    modeOfArrival: string;
  };
  criticalTimestamps: CriticalTimestamps;
  interventionsAndTreatments: InterventionsAndTreatments;
  clinicalAssessment: ClinicalAssessment;
  additionalData: {
    currentStatus: string;
    selectedTreatment?: string;
    ecgResult?: string;
    troponinValue?: number;
  };
  timelineWarnings?: Record<string, string[]>;
  kpiViolations?: Record<string, KpiViolation>;
  bedAssignment?: BedAssignmentFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  patientInfo,
  admissionDetails,
  criticalTimestamps,
  interventionsAndTreatments,
  clinicalAssessment,
  additionalData,
  timelineWarnings = {},
  kpiViolations = {},
  bedAssignment,
}) => {
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
  const hasKpiViolations = Object.keys(kpiViolations).length > 0;

  const emphasizeKeywords = (text: string) => {
    const keywords = ['Admission', 'Triage', 'ECG', 'PCI', 'Door', 'Balloon', 'Symptom', 'Transfer', 'Thrombolytic'];
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);

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

  const cardStyles = (severity?: 'error' | 'warning' | null) => {
    let borderColor = 'rgba(15, 23, 42, 0.05)';
    let boxShadow = '0px 12px 30px rgba(15, 23, 42, 0.08)';

    if (severity === 'error') {
      borderColor = 'rgba(239, 68, 68, 0.6)'; // Red
      boxShadow = '0px 12px 30px rgba(239, 68, 68, 0.15)';
    } else if (severity === 'warning') {
      borderColor = 'rgba(245, 158, 11, 0.6)'; // Amber/Yellow
      boxShadow = '0px 12px 30px rgba(245, 158, 11, 0.15)';
    } else if (severity) {
      // Fallback for boolean true if passed by mistake (though we should use strict types)
      borderColor = 'rgba(245, 158, 11, 0.6)';
    }

    return {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: 3,
      boxShadow,
      border: `2px solid ${borderColor}`,
      transition: 'all 0.3s ease',
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

  const renderWarningsList = (warnings: string[]) => {
    if (!warnings.length) {
      return null;
    }

    return (
      <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
        {warnings.map((warning, index) => (
          <Alert
            key={`${warning}-${index}`}
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
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'inherit' }}>
              {emphasizeKeywords(warning)}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  const renderKpiViolationsList = (violations: KpiViolation[]) => {
    if (!violations.length) return null;

    return (
      <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
        {violations.map((violation, index) => (
          <Alert
            key={`${violation.message}-${index}`}
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
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'inherit' }}>
              {violation.message}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  const renderValue = (value: string, hasIssue: boolean) => (
    <Box
      component="span"
      sx={{
        ml: 0.5,
        fontWeight: hasIssue ? 700 : 400,
        color: hasIssue ? 'warning.main' : 'inherit',
      }}
    >
      {value}
    </Box>
  );

  const admissionWarnings = getWarnings(
    'admissionDetails.admissionTime',
    'admissionDetails.transferRequestDateTime',
    'admissionDetails.transferArrivalDateTime'
  );
  const admissionHasIssue = admissionWarnings.length > 0;
  const triageWarnings = getWarnings('criticalTimestamps.triageTime');
  const ecgWarnings = getWarnings('criticalTimestamps.firstEcgTime');
  const doorOutWarnings = getWarnings('interventionsAndTreatments.doorOutTime');
  const balloonWarnings = getWarnings('interventionsAndTreatments.balloonInflationTime');
  const thrombolyticWarnings = getWarnings('interventionsAndTreatments.thrombolyticAdminTime');
  const symptomWarnings = getWarnings('clinicalAssessment.symptomOnset');
  const criticalWarnings = [...new Set([...triageWarnings, ...ecgWarnings])];
  const interventionWarnings = [
    ...new Set([
      ...doorOutWarnings,
      ...balloonWarnings,
      ...thrombolyticWarnings,
    ]),
  ];

  const getKpiViolations = (...fields: string[]) => {
    return fields.map(field => kpiViolations[field]).filter(Boolean);
  };

  const admissionKpiViolations = getKpiViolations('admissionDetails.admissionTime', 'admissionDetails.transferRequestDateTime', 'admissionDetails.transferArrivalDateTime');
  const criticalKpiViolations = getKpiViolations('criticalTimestamps.triageTime', 'criticalTimestamps.firstEcgTime');
  const interventionKpiViolations = getKpiViolations('interventionsAndTreatments.doorOutTime', 'interventionsAndTreatments.balloonInflationTime', 'interventionsAndTreatments.thrombolyticAdminTime');
  const symptomKpiViolations = getKpiViolations('clinicalAssessment.symptomOnset');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review and Submit
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please review all the information before submitting the STEMI case.
      </Typography>



      {hasWarnings && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'warning.dark',
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            We spotted some timeline issues. Please double-check the highlighted timestamps before submitting.
          </Typography>
        </Alert>
      )}

      {hasKpiViolations && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'error.dark',
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: 'error.main',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            KPI Violations Detected in:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
            {Object.keys(kpiViolations).map((key) => {
              // Make key human readable e.g. "criticalTimestamps.triageTime" -> "Triage Time"
              const label = key.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim() || key;
              return <li key={key}><Typography variant="body2">{label}</Typography></li>;
            })}
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Patient Info Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(null)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Patient Information
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{patientInfo.firstName} {patientInfo.lastName}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">National ID</Typography>
                <Typography variant="body1">{patientInfo.nationalId || 'Not provided'}</Typography>
              </Box>
              {patientInfo.dateOfBirth && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">
                    {new Date(patientInfo.dateOfBirth).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">Age</Typography>
                <Typography variant="body1">{patientInfo.age ? `${patientInfo.age} years` : 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{patientInfo.gender}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Admission Details Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(admissionKpiViolations.length > 0 ? 'error' : admissionHasIssue ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Admission Details
                </Typography>
                {(admissionKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="error" size="small" />
                ) : admissionHasIssue ? (
                  <Chip label="Timeline Warning" color="warning" size="small" />
                ) : null}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Admission Date & Time</Typography>
                <Typography variant="body1">
                  {renderValue(formatDateTime(admissionDetails.admissionTime), !!timelineWarnings['admissionDetails.admissionTime'])}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Mode of Arrival</Typography>
                <Typography variant="body1">{admissionDetails.modeOfArrival}</Typography>
              </Box>
              {renderWarningsList(admissionWarnings)}
              {renderKpiViolationsList(admissionKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Clinical Assessment Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(symptomKpiViolations.length > 0 ? 'error' : symptomWarnings.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Clinical Assessment
                </Typography>
                {(symptomKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="error" size="small" />
                ) : (symptomWarnings.length > 0) ? (
                  <Chip label="Timeline Warning" color="warning" size="small" />
                ) : null}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Killip Class</Typography>
                <Typography variant="body1">{(clinicalAssessment as any).killipClass || 'Not specified'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Symptom Onset</Typography>
                <Typography variant="body1">
                  {renderValue(formatDateTime(clinicalAssessment.symptomOnset || ''), !!timelineWarnings['clinicalAssessment.symptomOnset'])}
                </Typography>
              </Box>
              {additionalData.ecgResult && (
                <Box>
                  <Typography variant="body2" color="text.secondary">ECG Result</Typography>
                  <Typography variant="body1">{additionalData.ecgResult}</Typography>
                </Box>
              )}
              {additionalData.troponinValue !== undefined && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Troponin Value</Typography>
                  <Typography variant="body1">{additionalData.troponinValue} ng/mL</Typography>
                </Box>
              )}
              {renderWarningsList(symptomWarnings)}
              {renderKpiViolationsList(symptomKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Timestamps Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(criticalKpiViolations.length > 0 ? 'error' : criticalWarnings.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Critical Timestamps
                </Typography>
                {(criticalKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="error" size="small" />
                ) : (criticalWarnings.length > 0) ? (
                  <Chip label="Timeline Warning" color="warning" size="small" />
                ) : null}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Triage Time</Typography>
                <Typography variant="body1">
                  {renderValue(formatDateTime(criticalTimestamps.triageTime || ''), !!timelineWarnings['criticalTimestamps.triageTime'])}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">First ECG Time</Typography>
                <Typography variant="body1">
                  {renderValue(formatDateTime(criticalTimestamps.firstEcgTime || ''), !!timelineWarnings['criticalTimestamps.firstEcgTime'])}
                </Typography>
              </Box>
              {renderWarningsList(criticalWarnings)}
              {renderKpiViolationsList(criticalKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Card */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(interventionKpiViolations.length > 0 ? 'error' : interventionWarnings.length > 0 ? 'warning' : null)}>
            <CardContent sx={cardContentStyles}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Treatment
                </Typography>
                {(interventionKpiViolations.length > 0) ? (
                  <Chip label="KPI Violation" color="error" size="small" />
                ) : (interventionWarnings.length > 0) ? (
                  <Chip label="Timeline Warning" color="warning" size="small" />
                ) : null}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Selected Treatment</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {additionalData.selectedTreatment?.replace('_', ' ') || 'None'}
                </Typography>
              </Box>
              {interventionsAndTreatments.thrombolyticAdminTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Thrombolytic Admin Time</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(interventionsAndTreatments.thrombolyticAdminTime), !!timelineWarnings['interventionsAndTreatments.thrombolyticAdminTime'])}
                  </Typography>
                </Box>
              )}
              {interventionsAndTreatments.balloonInflationTime && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Balloon Inflation Time</Typography>
                  <Typography variant="body1">
                    {renderValue(formatDateTime(interventionsAndTreatments.balloonInflationTime), !!timelineWarnings['interventionsAndTreatments.balloonInflationTime'])}
                  </Typography>
                </Box>
              )}
              {renderWarningsList(interventionWarnings)}
              {renderKpiViolationsList(interventionKpiViolations)}
            </CardContent>
          </Card>
        </Grid>

        {/* Bed Assignment Card */}
        {bedAssignment && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles(null)}>
              <CardContent sx={cardContentStyles}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Bed Assignment
                </Typography>
                {bedAssignment.assignedBed ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Bed Number</Typography>
                      <Typography variant="body2">{bedAssignment.assignedBed.bedNumber}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Unit</Typography>
                      <Typography variant="body2">{bedAssignment.assignedBed.unitName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Hospital</Typography>
                      <Typography variant="body2">{bedAssignment.assignedBed.hospitalName}</Typography>
                    </Box>
                    {bedAssignment.arrivalDate && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Expected Arrival Date/Time</Typography>
                        <Typography variant="body2">{formatDateTime(bedAssignment.arrivalDate)}</Typography>
                      </Box>
                    )}
                    {bedAssignment.assignedBed.id && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Bed ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {bedAssignment.assignedBed.id}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No bed assigned in this step.
                    </Typography>
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
