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
          <Typography variant="body2" color="text.secondary">Birth Date:</Typography>
          <Typography variant="body1">{formData.patientInfo?.dateOfBirth || 'Not provided'}</Typography>
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
          <Typography variant="body2" color="text.secondary">Severity:</Typography>
          <Typography variant="body1">
            {formData.strokeSeverity ? StrokeService.getStrokeSeverityLabel(formData.strokeSeverity) : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">NIHSS Baseline:</Typography>
          <Typography variant="body1">{formData.nihssBaseline || 'Not specified'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Current Status:</Typography>
          <Typography variant="body1">{StrokeService.getStrokeStatusLabel(formData.currentStatus)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Selected Treatment:</Typography>
          <Typography variant="body1">
            {formData.selectedTreatment ? StrokeService.getStrokeTreatmentLabel(formData.selectedTreatment) : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Door to Imaging:</Typography>
          <Typography variant="body1">
            {formData.doorToImagingMinutes ? `${formData.doorToImagingMinutes} minutes` : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Door to Needle:</Typography>
          <Typography variant="body1">
            {formData.doorToNeedleMinutes ? `${formData.doorToNeedleMinutes} minutes` : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Door to Groin:</Typography>
          <Typography variant="body1">
            {formData.doorToGroinMinutes ? `${formData.doorToGroinMinutes} minutes` : 'Not specified'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Eligible for Thrombolysis:</Typography>
          <Typography variant="body1">{formData.eligibleForThrombolysis ? 'Yes' : 'No'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Eligible for Thrombectomy:</Typography>
          <Typography variant="body1">{formData.eligibleForThrombectomy ? 'Yes' : 'No'}</Typography>
        </Grid>
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
