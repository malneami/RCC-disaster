import React from 'react';
import { Box, Grid } from '@mui/material';
import { PatientWithDetails } from '../../../../services/patientService';
import {
  PatientDemographicsCard,
  PatientContactCard,
  PatientEmergencyCard,
  PatientInsuranceCard,
  PatientMedicalCard,
} from '../cards';

interface PatientOverviewTabProps {
  patient: PatientWithDetails;
}

const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({ patient }) => {
  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <PatientDemographicsCard patient={patient} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <PatientContactCard patient={patient} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <PatientEmergencyCard patient={patient} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <PatientInsuranceCard patient={patient} />
        </Grid>
        
        <Grid item xs={12}>
          <PatientMedicalCard patient={patient} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientOverviewTab;
