import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase } from '../../../services/strokeService';
import PatientInformationCard from './StrokeCaseDetails/PatientInformationCard';
import CaseInformationCard from './StrokeCaseDetails/CaseInformationCard';
import ClinicalAssessmentsCard from './StrokeCaseDetails/ClinicalAssessmentsCard';
import PerformanceTimingsCard from './StrokeCaseDetails/PerformanceTimingsCard';
import KPIPerformanceCard from './StrokeCaseDetails/KPIPerformanceCard';
import TreatmentInformationCard from './StrokeCaseDetails/TreatmentInformationCard';
import HospitalInformationCard from './StrokeCaseDetails/HospitalInformationCard';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

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
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);

  if (!strokeCase) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(strokeCase);
    }
  };

  const handleAddCaseNote = () => {
    setShowCaseNoteModal(true);
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      // You could add a success notification here
    } catch (error) {
      console.error('Error creating case note:', error);
      // You could add an error notification here
    }
  };

  const handleCaseNoteClose = () => {
    setShowCaseNoteModal(false);
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

            {/* Fifth Row - Case Notes Section */}
            <Grid item xs={12}>
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FontAwesomeIcon icon={faComment} />
                    <Typography variant="h6">Quick Case Note</Typography>
                  </Box>
                  <Button 
                    onClick={handleAddCaseNote} 
                    variant="outlined" 
                    startIcon={<FontAwesomeIcon icon={faComment} />}
                    fullWidth
                  >
                    Add Case Note
                  </Button>
                </CardContent>
              </Card>
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

      {/* Case Note Modal */}
      <CaseNoteModal
        open={showCaseNoteModal}
        onClose={handleCaseNoteClose}
        onSubmit={handleCaseNoteSubmit}
        patientName={`${strokeCase.patient?.firstName || ''} ${strokeCase.patient?.lastName || ''}`.trim()}
        caseType="STROKE"
        caseId={strokeCase.id}
        patientId={strokeCase.patientId}
        ticketId={strokeCase.ticketId}
      />
    </Dialog>
  );
};

export default StrokeCaseDetailsDialog;