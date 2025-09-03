import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientInsuranceCardProps {
  patient: PatientWithDetails;
}

const PatientInsuranceCard: React.FC<PatientInsuranceCardProps> = ({ patient }) => {
  return (
    <Card>
      <CardHeader title="Insurance Information" avatar={<CheckCircle />} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Provider</Typography>
            <Typography variant="body1">{patient.insuranceProvider || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Policy Number</Typography>
            <Typography variant="body1">{patient.insuranceNumber || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Group</Typography>
            <Typography variant="body1">{patient.insuranceGroup || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
            <Typography variant="body1">
              {patient.insuranceExpiry ? format(new Date(patient.insuranceExpiry), 'PPP') : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientInsuranceCard;
