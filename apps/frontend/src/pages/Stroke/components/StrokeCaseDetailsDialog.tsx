import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
} from '@mui/material';

import { StrokeCase } from '../../../services/strokeService';
import PatientInformationCard from './StrokeCaseDetails/PatientInformationCard';
import CaseInformationCard from './StrokeCaseDetails/CaseInformationCard';
import ClinicalAssessmentsCard from './StrokeCaseDetails/ClinicalAssessmentsCard';
import PerformanceTimingsCard from './StrokeCaseDetails/PerformanceTimingsCard';
import KPIPerformanceCard from './StrokeCaseDetails/KPIPerformanceCard';
import TreatmentInformationCard from './StrokeCaseDetails/TreatmentInformationCard';
import HospitalInformationCard from './StrokeCaseDetails/HospitalInformationCard';

interface StrokeCaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  strokeCase: StrokeCase | null;
  onEdit?: (strokeCase: StrokeCase) => void;
}

const StrokeCaseDetailsDialog: React.FC<StrokeCaseDetailsDialogProps> = ({
  open,
  onClose,
  strokeCase,
  onEdit,
}) => {
  if (!strokeCase) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(strokeCase);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        Stroke Case Details - Case #{strokeCase.id.slice(-8).toUpperCase()}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ flexGrow: 1, py: 2 }}>
          <Grid container spacing={3}>
            {/* First Row - Patient and Case Info */}
            <Grid item xs={12} md={6}>
              <PatientInformationCard strokeCase={strokeCase} />
            </Grid>
            <Grid item xs={12} md={6}>
              <CaseInformationCard strokeCase={strokeCase} />
            </Grid>

            {/* Second Row - Clinical Assessments */}
            <Grid item xs={12}>
              <ClinicalAssessmentsCard strokeCase={strokeCase} />
            </Grid>

            {/* Third Row - Performance and KPIs */}
            <Grid item xs={12} md={6}>
              <PerformanceTimingsCard strokeCase={strokeCase} />
            </Grid>
            <Grid item xs={12} md={6}>
              <KPIPerformanceCard strokeCase={strokeCase} />
            </Grid>

            {/* Fourth Row - Treatment and Hospital Info */}
            <Grid item xs={12} md={6}>
              <TreatmentInformationCard strokeCase={strokeCase} />
            </Grid>
            <Grid item xs={12} md={6}>
              <HospitalInformationCard strokeCase={strokeCase} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button 
            onClick={handleEdit} 
            variant="contained" 
            color="primary"
          >
            Edit Case
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StrokeCaseDetailsDialog;