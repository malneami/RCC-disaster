import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Patient } from '../../services/patientService';

interface DuplicateAlertProps {
  duplicates: Patient[];
  loading?: boolean;
  error?: string | null;
  onViewPatient?: (patient: Patient) => void;
  severity?: 'warning' | 'error' | 'info';
}

const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  duplicates,
  loading = false,
  error = null,
  onViewPatient,
  severity = 'warning',
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (loading) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Checking for duplicates...</AlertTitle>
        Please wait while we check for potential duplicate patients.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error checking duplicates</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (duplicates.length === 0) {
    return null;
  }

  const handleViewPatient = (patient: Patient) => {
    if (onViewPatient) {
      onViewPatient(patient);
    }
  };

  return (
    <Alert 
      severity={severity} 
      sx={{ mb: 2 }}
      icon={<WarningIcon />}
    >
      <AlertTitle>
        Potential Duplicate Patients Found ({duplicates.length})
      </AlertTitle>
      
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          We found {duplicates.length} patient{duplicates.length > 1 ? 's' : ''} that may be duplicates. 
          Please review before proceeding.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ p: 0 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {expanded ? 'Hide' : 'Show'} duplicate details
          </Typography>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {duplicates.map((patient) => (
            <Card key={patient.id} sx={{ mb: 1, border: '1px solid', borderColor: 'warning.light' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" fontSize="small" />
                      <Typography variant="body2" fontWeight="medium">
                        {patient.firstName} {patient.lastName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      MRN: {patient.mrn || 'N/A'} | ID: {patient.nationalId || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(patient.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Chip 
                        label="View" 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewPatient(patient)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Collapse>
    </Alert>
  );
};

export default DuplicateAlert;
