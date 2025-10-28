import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Avatar,
  Stack,
  CircularProgress,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faClock,
  faCheckCircle,
  faInfoCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

import { StrokeCase } from '../../../services/strokeService';
import PatientInformationCard from './StrokeCaseDetails/PatientInformationCard';
import CaseInformationCard from './StrokeCaseDetails/CaseInformationCard';
import ClinicalAssessmentsCard from './StrokeCaseDetails/ClinicalAssessmentsCard';
import PerformanceTimingsCard from './StrokeCaseDetails/PerformanceTimingsCard';
import KPIPerformanceCard from './StrokeCaseDetails/KPIPerformanceCard';
import TreatmentInformationCard from './StrokeCaseDetails/TreatmentInformationCard';
import HospitalInformationCard from './StrokeCaseDetails/HospitalInformationCard';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService, CaseNote } from '../../../services/notificationService';
import StrokeTimelineView from './StrokeTimelineView';

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
  const theme = useTheme();
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [loadingCaseNotes, setLoadingCaseNotes] = useState(false);

  useEffect(() => {
    if (open && strokeCase) {
      loadCaseNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, strokeCase]);

  const loadCaseNotes = async () => {
    if (!strokeCase) return;
    try {
      setLoadingCaseNotes(true);
      const notes = await notificationService.getCaseNotes('STROKE', strokeCase.id);
      setCaseNotes(notes);
    } catch (error) {
      console.error('Error loading case notes:', error);
    } finally {
      setLoadingCaseNotes(false);
    }
  };

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
      // Reload case notes after creating a new one
      await loadCaseNotes();
    } catch (error) {
      console.error('Error creating case note:', error);
    }
  };

  const handleCaseNoteClose = () => {
    setShowCaseNoteModal(false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
          {/* Tabs for Case Details and Timeline */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Case Details" />
              <Tab 
                label="Timeline" 
                icon={<FontAwesomeIcon icon={faClock} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
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
                      <Typography variant="h6">Case Notes</Typography>
                    </Box>
                    
                    {/* Existing Case Notes */}
                    {loadingCaseNotes ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : caseNotes.length > 0 ? (
                      <Box sx={{ mb: 2, maxHeight: '400px', overflowY: 'auto' }}>
                        <Stack spacing={2}>
                          {caseNotes.map((note) => (
                            <Box
                              key={note.id}
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderLeft: `4px solid ${
                                  note.priority === 'HIGH' ? theme.palette.error.main :
                                  note.priority === 'MEDIUM' ? theme.palette.warning.main :
                                  theme.palette.success.main
                                }`,
                              }}
                            >
                              <Box display="flex" alignItems="flex-start" gap={2}>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: note.priority === 'HIGH' ? 'error.main' :
                                            note.priority === 'MEDIUM' ? 'warning.main' :
                                            'success.main',
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {note.priority === 'HIGH' && <FontAwesomeIcon icon={faExclamationTriangle} />}
                                  {note.priority === 'MEDIUM' && <FontAwesomeIcon icon={faInfoCircle} />}
                                  {note.priority === 'LOW' && <FontAwesomeIcon icon={faCheckCircle} />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {note.createdBy.firstName} {note.createdBy.lastName}
                                    </Typography>
                                    <Chip 
                                      label={note.priority} 
                                      size="small" 
                                      color={
                                        note.priority === 'HIGH' ? 'error' :
                                        note.priority === 'MEDIUM' ? 'warning' :
                                        'success'
                                      }
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                      {new Date(note.createdAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {note.content}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ) : (
                      <Box py={2} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                          No case notes yet. Click below to add one.
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Add Case Note Button */}
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
          )}

          {activeTab === 1 && (
            <Box>
              <StrokeTimelineView strokeCase={strokeCase} />
            </Box>
          )}
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