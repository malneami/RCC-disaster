/**
 * View Trauma Case Dialog Component
 * Read-only view of trauma case details
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import {
  Person,
  LocalHospital,
  Schedule,
  Assessment,
  Warning,
  TransferWithinAStation,
} from '@mui/icons-material';

import { TraumaCase, TraumaService } from '../../../services/traumaService';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface ViewTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  traumaCase: TraumaCase | null;
}

const ViewTraumaCaseDialog: React.FC<ViewTraumaCaseDialogProps> = ({
  open,
  onClose,
  traumaCase,
}) => {
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);

  if (!traumaCase) return null;

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

  const getSeverityColor = (severity: string | undefined): string => {
    if (!severity) return '#757575';
    const severityMap: Record<string, string> = {
      'No Injury': '#4caf50',
      'Minor': '#8bc34a',
      'Moderate': '#ffc107',
      'Serious': '#ff9800',
      'Severe': '#ff5722',
      'Critical': '#f44336',
      'Unsurvivable': '#9c27b0'
    };
    return severityMap[severity] || '#757575';
  };

  const getGlasgowColor = (score: number | undefined): string => {
    if (!score) return '#757575';
    if (score >= 13) return '#4caf50';
    if (score >= 9) return '#ffc107';
    if (score >= 3) return '#ff5722';
    return '#9c27b0';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Person color="primary" />
          <Typography variant="h6">
            Trauma Case Details - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}
          </Typography>
          {traumaCase.criticalCase && (
            <Chip
              icon={<Warning />}
              label="Critical Case"
              color="error"
              size="small"
            />
          )}
          {traumaCase.transferCase && (
            <Chip
              icon={<TransferWithinAStation />}
              label="Transfer Case"
              color="info"
              size="small"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Person color="primary" />
                  Patient Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell>{traumaCase.patient?.firstName} {traumaCase.patient?.lastName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>National ID</strong></TableCell>
                        <TableCell>{traumaCase.patient?.nationalId || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>MRN</strong></TableCell>
                        <TableCell>{traumaCase.patient?.mrn || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Age</strong></TableCell>
                        <TableCell>{traumaCase.patient?.age ? `${traumaCase.patient.age} years` : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Gender</strong></TableCell>
                        <TableCell>{traumaCase.patient?.gender || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Phone</strong></TableCell>
                        <TableCell>{traumaCase.patient?.phoneNumber || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell>{traumaCase.patient?.email || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Hospital Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <LocalHospital color="primary" />
                  Hospital Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Origin Hospital</strong></TableCell>
                        <TableCell>{traumaCase.originHospital?.name || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Origin Cluster</strong></TableCell>
                        <TableCell>{traumaCase.originHospital?.cluster || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Destination Hospital</strong></TableCell>
                        <TableCell>{traumaCase.destinationHospital?.name || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Destination Cluster</strong></TableCell>
                        <TableCell>{traumaCase.destinationHospital?.cluster || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Incident Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Schedule color="primary" />
                  Incident Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Arrival Date/Time</strong></TableCell>
                        <TableCell>{TraumaService.formatDateTime(traumaCase.arrivalDateTime)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Incident Date/Time</strong></TableCell>
                        <TableCell>{traumaCase.incidentDateTime ? TraumaService.formatDateTime(traumaCase.incidentDateTime) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Mode of Arrival</strong></TableCell>
                        <TableCell>{TraumaService.getModeOfArrivalLabel(traumaCase.modeOfArrival)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Mechanism of Injury</strong></TableCell>
                        <TableCell>{TraumaService.getMechanismOfInjuryLabel(traumaCase.mechanismOfInjury)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Chief Complaint</strong></TableCell>
                        <TableCell>{traumaCase.chiefComplaint || 'N/A'}</TableCell>
                      </TableRow>
                      {traumaCase.transferRequestDateTime && (
                        <TableRow>
                          <TableCell><strong>Transfer Request</strong></TableCell>
                          <TableCell>{TraumaService.formatDateTime(traumaCase.transferRequestDateTime)}</TableCell>
                        </TableRow>
                      )}
                      {traumaCase.transferArrivalDateTime && (
                        <TableRow>
                          <TableCell><strong>Transfer Arrival</strong></TableCell>
                          <TableCell>{TraumaService.formatDateTime(traumaCase.transferArrivalDateTime)}</TableCell>
                        </TableRow>
                      )}
                      {traumaCase.transferDurationMinutes && (
                        <TableRow>
                          <TableCell><strong>Transfer Duration</strong></TableCell>
                          <TableCell>{traumaCase.transferDurationMinutes} minutes</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Vitals Assessment */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Assessment color="primary" />
                  Vitals Assessment
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Glasgow Coma Scale</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={`${traumaCase.glasgowComaScale || 'N/A'} - ${TraumaService.getGlasgowComaScaleLabel(traumaCase.glasgowComaScale || 15)}`}
                            sx={{ 
                              backgroundColor: getGlasgowColor(traumaCase.glasgowComaScale),
                              color: 'white'
                            }}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Systolic BP</strong></TableCell>
                        <TableCell>{traumaCase.systolicBloodPressure || 'N/A'} mmHg</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Respiratory Rate</strong></TableCell>
                        <TableCell>{traumaCase.respiratoryRate || 'N/A'} /min</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Additional Vitals</strong></TableCell>
                        <TableCell>{traumaCase.additionalVitalSigns || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Injury Assessment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Warning color="primary" />
                  Injury Assessment
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Body Region</strong></TableCell>
                            <TableCell><strong>Severity</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Head & Neck</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.headAndNeckInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.headAndNeckInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Face</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.faceInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.faceInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Chest</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.chestInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.chestInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Body Region</strong></TableCell>
                            <TableCell><strong>Severity</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Abdomen</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.abdomenInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.abdomenInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Extremities</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.extremitiesInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.extremitiesInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>External</TableCell>
                            <TableCell>
                              <Chip
                                label={traumaCase.externalInjury || 'N/A'}
                                sx={{ 
                                  backgroundColor: getSeverityColor(traumaCase.externalInjury),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>

                {traumaCase.primarySurveyFindings && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Primary Survey Findings:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {traumaCase.primarySurveyFindings}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Disposition */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <TransferWithinAStation color="primary" />
                  Disposition
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>ED Disposition</strong></TableCell>
                        <TableCell>{TraumaService.getDispositionLabel(traumaCase.edDisposition || 'DISCHARGE')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Additional Notes</strong></TableCell>
                        <TableCell>{traumaCase.additionalNotes || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Created By</strong></TableCell>
                        <TableCell>{traumaCase.createdBy?.firstName} {traumaCase.createdBy?.lastName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Created At</strong></TableCell>
                        <TableCell>{TraumaService.formatDateTime(traumaCase.createdAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Last Updated</strong></TableCell>
                        <TableCell>{TraumaService.formatDateTime(traumaCase.updatedAt)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Case Note Section */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
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
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>

      {/* Case Note Modal */}
      <CaseNoteModal
        open={showCaseNoteModal}
        onClose={handleCaseNoteClose}
        onSubmit={handleCaseNoteSubmit}
        patientName={`${traumaCase.patient?.firstName || ''} ${traumaCase.patient?.lastName || ''}`.trim()}
        caseType="TRAUMA"
        caseId={traumaCase.id}
        patientId={traumaCase.patientId}
        ticketId={traumaCase.ticketId}
      />
    </Dialog>
  );
};

export default ViewTraumaCaseDialog;
