import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { CreateTicketData } from '../../../../services/ticketService';
import PatientSelect from '../PatientSelect';
import { Patient } from '../../../../services/patientService';
import MultiStepPatientForm from '../../../Patients/components/forms/MultiStepPatientForm';

interface PatientSelectionStepProps {
  formData: Partial<CreateTicketData>;
  onDataChange: (data: Partial<CreateTicketData>) => void;
}

const PatientSelectionStep: React.FC<PatientSelectionStepProps> = ({
  formData,
  onDataChange,
}) => {
  const [patientMode, setPatientMode] = useState<'select' | 'existing' | 'new'>('select');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  const handlePatientModeSelect = (mode: 'existing' | 'new') => {
    setPatientMode(mode);
    if (mode === 'new') {
      setShowPatientForm(true);
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    setCreatedPatientId(patient.id);
    onDataChange({ patientId: patient.id });
    setShowPatientForm(false);
    setPatientMode('existing');
  };

  const handlePatientChange = (patientId: string | null) => {
    onDataChange({ patientId: patientId || undefined });
  };

  const handleBackToSelect = () => {
    setPatientMode('select');
    setCreatedPatientId(null);
    onDataChange({ patientId: undefined });
  };

  if (patientMode === 'select') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" gutterBottom>
          How would you like to add a patient?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Choose whether to select an existing patient or create a new one
        </Typography>
        
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card 
              sx={{ 
                height: 200, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardActionArea 
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                onClick={() => handlePatientModeSelect('existing')}
              >
                <CardContent sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Existing Patient
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search and select from our patient database
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card 
              sx={{ 
                height: 200, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardActionArea 
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                onClick={() => handlePatientModeSelect('new')}
              >
                <CardContent sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <AddIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    New Patient
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a new patient record
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (patientMode === 'new') {
    return (
      <Box sx={{ py: 2 }}>
        <MultiStepPatientForm
          open={showPatientForm}
          onClose={() => setShowPatientForm(false)}
          onPatientCreated={handlePatientCreated}
          onPatientUpdated={() => {}}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Creating new patient...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {createdPatientId && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          icon={<CheckCircleIcon />}
        >
          Patient created successfully! You can now select them below.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <PatientSelect
            value={formData.patientId || null}
            onChange={handlePatientChange}
            required
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={handleBackToSelect}
        >
          Change patient selection method
        </Typography>
      </Box>
    </Box>
  );
};

export default PatientSelectionStep;
