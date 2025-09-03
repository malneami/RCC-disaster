import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
} from '@mui/material';
import { Phone } from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientContactCardProps {
  patient: PatientWithDetails;
}

const PatientContactCard: React.FC<PatientContactCardProps> = ({ patient }) => {
  const formatAddress = () => {
    if (!patient.address) return 'N/A';
    const parts = [patient.address, patient.city, patient.state, patient.zipCode].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Card>
      <CardHeader title="Contact Information" avatar={<Phone />} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{patient.phoneNumber || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{patient.email || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{formatAddress()}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientContactCard;
