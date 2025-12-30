import React from 'react';
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

  const cardStyles = (highlight = false) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: 3,
    boxShadow: '0px 12px 30px rgba(15, 23, 42, 0.08)',
    border: highlight ? '2px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(15, 23, 42, 0.05)',
    transition: 'border 0.3s ease',
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
  const triageHasIssue = triageWarnings.length > 0;
  const ecgWarnings = getWarnings('criticalTimestamps.firstEcgTime');
  const ecgHasIssue = ecgWarnings.length > 0;
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

      <Grid container spacing={3} alignItems="stretch">
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(false)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {patientInfo.firstName} {patientInfo.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>National ID:</strong> {patientInfo.nationalId}
              </Typography>
              {patientInfo.dateOfBirth && (
                <Typography variant="body2">
                  <strong>Date of Birth:</strong> {new Date(patientInfo.dateOfBirth).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Age:</strong> {patientInfo.age ? `${patientInfo.age} years` : 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Gender:</strong> {patientInfo.gender}
              </Typography>
              {patientInfo.phoneNumber && (
                <Typography variant="body2">
                  <strong>Phone:</strong> {patientInfo.phoneNumber}
                </Typography>
              )}
              {patientInfo.address && (
                <Typography variant="body2">
                  <strong>Address:</strong> {patientInfo.address}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Admission Details */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(admissionHasIssue)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Admission Details
              </Typography>
              <Typography variant="body2">
                <strong>Admission Time:</strong>
                {renderValue(formatDateTime(admissionDetails.admissionTime), admissionHasIssue)}
              </Typography>
              <Typography variant="body2">
                <strong>Mode of Arrival:</strong> {admissionDetails.modeOfArrival.replace(/_/g, ' ')}
              </Typography>
            </CardContent>
            {renderWarningsList(admissionWarnings)}
          </Card>
        </Grid>

        {/* Critical Timestamps */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(triageHasIssue || ecgHasIssue)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Critical Timestamps
              </Typography>
              <Typography variant="body2">
                <strong>Triage Time:</strong>
                {renderValue(formatDateTime(criticalTimestamps.triageTime || ''), triageHasIssue)}
              </Typography>
              <Typography variant="body2">
                <strong>First ECG Time:</strong>
                {renderValue(formatDateTime(criticalTimestamps.firstEcgTime || ''), ecgHasIssue)}
              </Typography>
            </CardContent>
            {renderWarningsList(criticalWarnings)}
          </Card>
        </Grid>

        {/* Interventions and Treatments */}
        <Grid item xs={12} md={6}>
          <Card
            sx={cardStyles(
              doorOutWarnings.length > 0 ||
              balloonWarnings.length > 0 ||
              thrombolyticWarnings.length > 0
            )}
          >
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Interventions & Treatments
              </Typography>
              <Typography variant="body2">
                <strong>Eligible for Primary PCI:</strong> {interventionsAndTreatments.eligibleForPrimaryPci ? 'Yes' : 'No'}
              </Typography>
              {interventionsAndTreatments.pciType && (
                <Typography variant="body2">
                  <strong>Type of PCI:</strong> {interventionsAndTreatments.pciType.replace('_', ' ')}
                </Typography>
              )}
              {interventionsAndTreatments.pciLocation && (
                <Typography variant="body2">
                  <strong>PCI Location:</strong> {interventionsAndTreatments.pciLocation}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Thrombolytic Given:</strong> {interventionsAndTreatments.thrombolyticGiven ? 'Yes' : 'No'}
              </Typography>
              {interventionsAndTreatments.thrombolyticAdminTime && (
                <Typography variant="body2">
                  <strong>Thrombolytic Administration Time:</strong>
                  {renderValue(
                    formatDateTime(interventionsAndTreatments.thrombolyticAdminTime),
                    thrombolyticWarnings.length > 0
                  )}
                </Typography>
              )}
              {interventionsAndTreatments.doorOutTime && (
                <Typography variant="body2">
                  <strong>Door Out Time:</strong>
                  {renderValue(
                    formatDateTime(interventionsAndTreatments.doorOutTime),
                    doorOutWarnings.length > 0
                  )}
                </Typography>
              )}
              {interventionsAndTreatments.balloonInflationTime && (
                <Typography variant="body2">
                  <strong>Balloon Inflation Time:</strong>
                  {renderValue(
                    formatDateTime(interventionsAndTreatments.balloonInflationTime),
                    balloonWarnings.length > 0
                  )}
                </Typography>
              )}
              {interventionsAndTreatments.fibrinolyticAbsoluteContraindications && (
                <Typography variant="body2">
                  <strong>Fibrinolytic Absolute Contraindications:</strong> {interventionsAndTreatments.fibrinolyticAbsoluteContraindications.replace(/_/g, ' ')}
                </Typography>
              )}
              {interventionsAndTreatments.fibrinolyticRelativeContraindications && (
                <Typography variant="body2">
                  <strong>Fibrinolytic Relative Contraindications:</strong> {interventionsAndTreatments.fibrinolyticRelativeContraindications}
                </Typography>
              )}
            </CardContent>
            {renderWarningsList(interventionWarnings)}
          </Card>
        </Grid>

        {/* Clinical Assessment */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(symptomWarnings.length > 0)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Clinical Assessment
              </Typography>
              {clinicalAssessment.heartScore !== undefined && (
                <Typography variant="body2">
                  <strong>HEART Score:</strong> {clinicalAssessment.heartScore}
                </Typography>
              )}
              {clinicalAssessment.clinicalRiskLevel && (
                <Typography variant="body2">
                  <strong>Risk Level:</strong> {clinicalAssessment.clinicalRiskLevel}
                </Typography>
              )}
              {clinicalAssessment.presentingSymptoms && (
                <Typography variant="body2">
                  <strong>Presenting Symptoms:</strong> {clinicalAssessment.presentingSymptoms}
                </Typography>
              )}
              {clinicalAssessment.symptomOnset && (
                <Typography variant="body2">
                  <strong>Symptom Onset:</strong>
                  {renderValue(
                    formatDateTime(clinicalAssessment.symptomOnset),
                    symptomWarnings.length > 0
                  )}
                </Typography>
              )}
              {clinicalAssessment.symptomDuration !== undefined && (
                <Typography variant="body2">
                  <strong>Symptom Duration:</strong> {clinicalAssessment.symptomDuration} minutes
                </Typography>
              )}
            </CardContent>
            {renderWarningsList(symptomWarnings)}
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyles(false)}>
            <CardContent sx={cardContentStyles}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Typography variant="body2">
                <strong>Current Status:</strong>
                <Chip
                  label={additionalData.currentStatus.replace(/_/g, ' ')}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              {additionalData.selectedTreatment && (
                <Typography variant="body2">
                  <strong>Selected Treatment:</strong> {additionalData.selectedTreatment.replace(/_/g, ' ')}
                </Typography>
              )}
              {additionalData.ecgResult && (
                <Typography variant="body2">
                  <strong>ECG Result:</strong> {additionalData.ecgResult.replace(/_/g, ' ')}
                </Typography>
              )}
              {additionalData.troponinValue && (
                <Typography variant="body2">
                  <strong>Troponin Value:</strong> {additionalData.troponinValue}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bed Assignment */}
        {(bedAssignment?.assignedBed || bedAssignment?.bedId || bedAssignment?.bedNumber) && (
          <Grid item xs={12} md={6}>
            <Card sx={cardStyles(false)}>
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
