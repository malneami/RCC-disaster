import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientDemographicsCardProps {
  patient: PatientWithDetails;
}

const PatientDemographicsCard: React.FC<PatientDemographicsCardProps> = ({ patient }) => {

  return (
    <Card>
      <CardHeader title="Demographics" avatar={<Person />} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1">
              {patient.age ? `${patient.age} years` : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Gender</Typography>
            <Typography variant="body1">{patient.gender}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Marital Status</Typography>
            <Typography variant="body1">{patient.maritalStatus || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Blood Type</Typography>
            <Typography variant="body1">{patient.bloodType || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">RH Factor</Typography>
            <Typography variant="body1">{patient.rhFactor || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientDemographicsCard;
