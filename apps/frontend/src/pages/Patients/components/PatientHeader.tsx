import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Print,
  Download,
} from '@mui/icons-material';
import { PatientWithDetails } from '../../../services/patientService';

interface PatientHeaderProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onExport: () => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onEdit,
  onPrint,
  onExport,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} color="primary">
            <ArrowBack />
          </IconButton>
          
          <Box>
            <Typography variant="h4" component="h1">
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              MRN: {patient.mrn || 'N/A'} | National ID: {patient.nationalId || 'N/A'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={onPrint}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={onExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {patient._count?.tickets || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tickets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {patient._count?.medicalRecords || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Medical Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {patient._count?.accessLogs || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access Logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip
                label={patient.privacyLevel}
                color={patient.privacyLevel === 'CONFIDENTIAL' ? 'error' : 'default'}
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Privacy Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PatientHeader;
