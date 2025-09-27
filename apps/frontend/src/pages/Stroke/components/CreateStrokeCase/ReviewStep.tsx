import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
} from '@mui/material';

import { CreateStrokeCaseData, StrokeService } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: CreateStrokeCaseData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Stroke Case Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Patient Name:</Typography>
          <Typography variant="body1">{formData.patientInfo?.firstName} {formData.patientInfo?.lastName}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">National ID:</Typography>
          <Typography variant="body1">{formData.patientInfo?.nationalId || 'Not provided'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Medical Record Number (MRN):</Typography>
          <Typography variant="body1">{formData.patientInfo?.mrn || 'Not provided'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Age:</Typography>
          <Typography variant="body1">{formData.patientInfo?.age ? `${formData.patientInfo.age} years` : 'Not provided'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Origin Hospital:</Typography>
          <Typography variant="body1">{getHospitalName(formData.originHospitalId)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Destination Hospital:</Typography>
          <Typography variant="body1">
            {formData.destinationHospitalId ? getHospitalName(formData.destinationHospitalId) : 'None'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Stroke Type:</Typography>
          <Typography variant="body1">{StrokeService.getStrokeTypeLabel(formData.strokeType)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Current Status:</Typography>
          <Typography variant="body1">{StrokeService.getStrokeStatusLabel(formData.currentStatus)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Mode of Arrival:</Typography>
          <Typography variant="body1">
            {formData.modeOfArrival ? StrokeService.getModeOfArrivalLabel(formData.modeOfArrival) : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Chief Complaint:</Typography>
          <Typography variant="body1">{formData.chiefComplaint || 'Not provided'}</Typography>
        </Grid>
        {formData.srcaCallTime && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">SRCA Call Time:</Typography>
            <Typography variant="body1">{new Date(formData.srcaCallTime).toLocaleString()}</Typography>
          </Grid>
        )}
        {formData.timeOfSymptomOnset && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Time of Symptom Onset:</Typography>
            <Typography variant="body1">{new Date(formData.timeOfSymptomOnset).toLocaleString()}</Typography>
          </Grid>
        )}
        {formData.dateOfAdmission && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Date of Admission:</Typography>
            <Typography variant="body1">{new Date(formData.dateOfAdmission).toLocaleString()}</Typography>
          </Grid>
        )}
        {formData.timeOfTriage && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Time of Triage:</Typography>
            <Typography variant="body1">{new Date(formData.timeOfTriage).toLocaleString()}</Typography>
          </Grid>
        )}
        {formData.timeOfPhysicianAssessment && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Time of Physician Assessment:</Typography>
            <Typography variant="body1">{new Date(formData.timeOfPhysicianAssessment).toLocaleString()}</Typography>
          </Grid>
        )}
        {formData.ctScanPerformed !== undefined && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">CT Scan Performed:</Typography>
            <Typography variant="body1">{formData.ctScanPerformed ? 'Yes' : 'No'}</Typography>
          </Grid>
        )}
        {formData.swallowingScreeningPerformed !== undefined && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Swallowing Screening Performed:</Typography>
            <Typography variant="body1">{formData.swallowingScreeningPerformed ? 'Yes' : 'No'}</Typography>
          </Grid>
        )}
        {formData.presentingSymptoms && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Presenting Symptoms:</Typography>
            <Typography variant="body1">{formData.presentingSymptoms}</Typography>
          </Grid>
        )}
        {formData.thrombolysisContraindications && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Thrombolysis Contraindications:</Typography>
            <Typography variant="body1">{formData.thrombolysisContraindications}</Typography>
          </Grid>
        )}
        {formData.thrombectomyContraindications && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Thrombectomy Contraindications:</Typography>
            <Typography variant="body1">{formData.thrombectomyContraindications}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ReviewStep;
