import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface PatientDemographicsCardProps {
  patient: PatientWithDetails;
}

const PatientDemographicsCard: React.FC<PatientDemographicsCardProps> = ({ patient }) => {
  // Validate date of birth
  const validateDateOfBirth = (dateOfBirth: string | undefined): { isValid: boolean; error?: string } => {
    if (!dateOfBirth) {
      return { isValid: true }; // Optional field
    }
    
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const minDate = new Date('1900-01-01');
      
      if (dob > today) {
        return { isValid: false, error: 'Date of birth is in the future' };
      }
      if (dob < minDate) {
        return { isValid: false, error: 'Date of birth is before 1900' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid date format' };
    }
  };

  const dobValidation = validateDateOfBirth(patient.dateOfBirth);

  return (
    <Card>
      <CardHeader title="Demographics" avatar={<Person />} />
      <CardContent>
        {!dobValidation.isValid && patient.dateOfBirth && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Date of Birth Validation: {dobValidation.error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1">
              {formatAgeForDisplay(patient.age, patient.dateOfBirth, patient.ageMonths, patient.ageDays)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
            <Typography variant="body1">
              {patient.dateOfBirth 
                ? (() => {
                    try {
                      return new Date(patient.dateOfBirth).toLocaleDateString();
                    } catch {
                      return 'Invalid date';
                    }
                  })()
                : 'N/A'}
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
