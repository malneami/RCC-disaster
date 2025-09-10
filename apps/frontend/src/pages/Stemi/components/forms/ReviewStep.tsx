import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { PatientInfo, CriticalTimestamps, InterventionsAndTreatments, ClinicalAssessment } from '../../services/stemiService';

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
    ecgFindings: string;
    isTroponinPositive: boolean;
    troponinValue?: number;
    additionalNotes: string;
  };
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  patientInfo,
  admissionDetails,
  criticalTimestamps,
  interventionsAndTreatments,
  clinicalAssessment,
  additionalData,
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

  const formatDate = (date: string) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review and Submit
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please review all the information before submitting the STEMI case.
      </Typography>

      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {patientInfo.firstName} {patientInfo.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>National ID:</strong> {patientInfo.nationalId}
              </Typography>
              <Typography variant="body2">
                <strong>Date of Birth:</strong> {formatDate(patientInfo.dateOfBirth)}
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Admission Details
              </Typography>
              <Typography variant="body2">
                <strong>Admission Time:</strong> {formatDateTime(admissionDetails.admissionTime)}
              </Typography>
              <Typography variant="body2">
                <strong>Mode of Arrival:</strong> {admissionDetails.modeOfArrival.replace(/_/g, ' ')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Timestamps */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Critical Timestamps
              </Typography>
              <Typography variant="body2">
                <strong>Triage Time:</strong> {formatDateTime(criticalTimestamps.triageTime || '')}
              </Typography>
              <Typography variant="body2">
                <strong>First ECG Time:</strong> {formatDateTime(criticalTimestamps.firstEcgTime || '')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Interventions and Treatments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interventions & Treatments
              </Typography>
              <Typography variant="body2">
                <strong>Eligible for Primary PCI:</strong> {interventionsAndTreatments.eligibleForPrimaryPci ? 'Yes' : 'No'}
              </Typography>
              {interventionsAndTreatments.pciLocation && (
                <Typography variant="body2">
                  <strong>PCI Location:</strong> {interventionsAndTreatments.pciLocation}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Thrombolytic Given:</strong> {interventionsAndTreatments.thrombolyticGiven ? 'Yes' : 'No'}
              </Typography>
              {interventionsAndTreatments.doorOutTime && (
                <Typography variant="body2">
                  <strong>Door Out Time:</strong> {formatDateTime(interventionsAndTreatments.doorOutTime)}
                </Typography>
              )}
              {interventionsAndTreatments.balloonInflationTime && (
                <Typography variant="body2">
                  <strong>Balloon Inflation Time:</strong> {formatDateTime(interventionsAndTreatments.balloonInflationTime)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Clinical Assessment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
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
                  <strong>Symptom Onset:</strong> {formatDateTime(clinicalAssessment.symptomOnset)}
                </Typography>
              )}
              {clinicalAssessment.symptomDuration !== undefined && (
                <Typography variant="body2">
                  <strong>Symptom Duration:</strong> {clinicalAssessment.symptomDuration} minutes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
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
              <Typography variant="body2">
                <strong>Troponin Positive:</strong> {additionalData.isTroponinPositive ? 'Yes' : 'No'}
              </Typography>
              {additionalData.troponinValue && (
                <Typography variant="body2">
                  <strong>Troponin Value:</strong> {additionalData.troponinValue}
                </Typography>
              )}
              {additionalData.ecgFindings && (
                <Typography variant="body2">
                  <strong>ECG Findings:</strong> {additionalData.ecgFindings}
                </Typography>
              )}
              {additionalData.additionalNotes && (
                <Typography variant="body2">
                  <strong>Additional Notes:</strong> {additionalData.additionalNotes}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewStep;
