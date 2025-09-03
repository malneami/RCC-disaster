import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
} from '@mui/material';
import { MedicalServices, History } from '@mui/icons-material';
import { format } from 'date-fns';
import { PatientWithDetails } from '../../../../services/patientService';
import { parseJsonArray } from '../../../../utils/jsonUtils';

interface PatientMedicalCardProps {
  patient: PatientWithDetails;
}

const PatientMedicalCard: React.FC<PatientMedicalCardProps> = ({ patient }) => {
  const formatArrayField = (field: string | null | undefined) => {
    if (!field) return 'None';
    try {
      const array = parseJsonArray(field);
      return array.length > 0 ? array.join(', ') : 'None';
    } catch {
      return field;
    }
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Medical Information" avatar={<MedicalServices />} />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Allergies</Typography>
              <Typography variant="body1">
                {formatArrayField(patient.allergies)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Current Medications</Typography>
              <Typography variant="body1">
                {formatArrayField(patient.medications)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Risk Factors</Typography>
              <Typography variant="body1">
                {formatArrayField(patient.riskFactors)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Chronic Conditions</Typography>
              <Typography variant="body1">
                {formatArrayField(patient.chronicConditions)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Medical History</Typography>
              <Typography variant="body1">{patient.medicalHistory || 'No medical history recorded'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Audit Information" avatar={<History />} />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Created By</Typography>
              <Typography variant="body1">
                {patient.createdBy?.firstName} {patient.createdBy?.lastName}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Created Date</Typography>
              <Typography variant="body1">
                {format(new Date(patient.createdAt), 'PPP')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Last Accessed</Typography>
              <Typography variant="body1">
                {patient.lastAccessedAt ? format(new Date(patient.lastAccessedAt), 'PPP') : 'Never'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Last Accessed By</Typography>
              <Typography variant="body1">
                {patient.lastAccessedByUser ? 
                  `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}` : 'N/A'
                }
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default PatientMedicalCard;
