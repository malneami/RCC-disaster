import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientEmergencyCardProps {
  patient: PatientWithDetails;
}

const PatientEmergencyCard: React.FC<PatientEmergencyCardProps> = ({ patient }) => {
  return (
    <Card>
      <CardHeader title="Emergency Contact" avatar={<Warning />} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Contact Name</Typography>
            <Typography variant="body1">{patient.emergencyContact || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{patient.emergencyPhone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{patient.emergencyEmail || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Relationship</Typography>
            <Typography variant="body1">{patient.emergencyRelationship || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientEmergencyCard;
