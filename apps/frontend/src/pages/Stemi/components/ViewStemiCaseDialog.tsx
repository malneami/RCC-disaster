/**
 * View STEMI Case Dialog Component
 * Read-only view of STEMI case details
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Tabs,
  Tab,
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
  Favorite,
} from '@mui/icons-material';

import { StemiCase } from '../services/stemiService';
import StemiTimelineView from './StemiTimelineView';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface ViewStemiCaseDialogProps {
  open: boolean;
  onClose: () => void;
  stemiCase: StemiCase | null;
}

const ViewStemiCaseDialog: React.FC<ViewStemiCaseDialogProps> = ({
  open,
  onClose,
  stemiCase,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);

  if (!stemiCase) return null;

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

  const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      'SUSPECTED': '#ff9800',
      'ECG_PENDING': '#2196f3',
      'STEMI_CONFIRMED': '#f44336',
      'NSTEMI_CONFIRMED': '#ff9800',
      'UNSTABLE_ANGINA': '#ff9800',
      'RCC_ACTIVATED': '#2196f3',
      'IN_TRANSIT': '#2196f3',
      'PCI_READY': '#4caf50',
      'BALLOON_INFLATED': '#4caf50',
      'CCU_ADMITTED': '#4caf50',
      'DISCHARGED': '#4caf50',
      'EXPIRED': '#f44336',
    };
    return statusMap[status] || '#757575';
  };

  const getTreatmentColor = (treatment?: string): string => {
    if (!treatment) return '#757575';
    const treatmentMap: Record<string, string> = {
      'PRIMARY_PCI': '#4caf50',
      'RESCUE_PCI': '#ff9800',
      'FIBRINOLYSIS': '#2196f3',
      'TRANSFER_FOR_PRIMARY_PCI': '#2196f3',
      'MEDICAL_MANAGEMENT': '#757575',
    };
    return treatmentMap[treatment] || '#757575';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNationalId = (nationalId: string) => {
    return nationalId.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
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
          <Favorite color="primary" />
          <Typography variant="h6">
            STEMI Case Details - {stemiCase.patient?.firstName} {stemiCase.patient?.lastName}
        </Typography>
          {stemiCase.rccActivated && (
            <Chip
              icon={<Warning />}
              label="RCC Activated"
              color="error"
              size="small"
            />
          )}
          {stemiCase.selectedTreatment === 'TRANSFER_FOR_PRIMARY_PCI' && (
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Case Details" />
            <Tab label="Timeline" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person color="primary" />
                  <Typography variant="h6">Patient Information</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell>{stemiCase.patient?.firstName} {stemiCase.patient?.lastName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>National ID</strong></TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{formatNationalId(stemiCase.patient?.nationalId || '')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Age</strong></TableCell>
                        <TableCell>{stemiCase.patient?.age ? `${stemiCase.patient.age} years` : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Gender</strong></TableCell>
                        <TableCell>{stemiCase.patient?.gender}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Phone</strong></TableCell>
                        <TableCell>{stemiCase.patient?.phoneNumber || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Case Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assessment color="primary" />
                  <Typography variant="h6">Case Information</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={stemiCase.currentStatus.replace(/_/g, ' ')}
                            size="small"
                            sx={{ 
                              backgroundColor: getStatusColor(stemiCase.currentStatus),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Treatment</strong></TableCell>
                        <TableCell>
                          {stemiCase.selectedTreatment ? (
                            <Chip
                              label={stemiCase.selectedTreatment.replace(/_/g, ' ')}
                              size="small"
                              sx={{ 
                                backgroundColor: getTreatmentColor(stemiCase.selectedTreatment),
                                color: 'white'
                              }}
                            />
                          ) : (
                            'Not specified'
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Heart Score</strong></TableCell>
                        <TableCell>{stemiCase.heartScore || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Clinical Risk</strong></TableCell>
                        <TableCell>{stemiCase.clinicalRiskLevel || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Presenting Symptoms</strong></TableCell>
                        <TableCell>{stemiCase.presentingSymptoms || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Created By</strong></TableCell>
                        <TableCell>{stemiCase.createdBy?.firstName} {stemiCase.createdBy?.lastName} ({stemiCase.createdBy?.email})</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Hospital Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocalHospital color="primary" />
                  <Typography variant="h6">Hospital Information</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Origin Hospital</strong></TableCell>
                        <TableCell>{stemiCase.originHospital?.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Cluster</strong></TableCell>
                        <TableCell>{stemiCase.originHospital?.cluster}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Primary PCI</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={stemiCase.originHospital?.hasPrimaryPci ? 'Available' : 'Not Available'}
                            color={stemiCase.originHospital?.hasPrimaryPci ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>PCI Lab 24x7</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={stemiCase.originHospital?.pciLab24x7 ? 'Yes' : 'No'}
                            color={stemiCase.originHospital?.pciLab24x7 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      {stemiCase.destinationHospital && (
                        <>
                          <TableRow>
                            <TableCell><strong>Destination Hospital</strong></TableCell>
                            <TableCell>{stemiCase.destinationHospital.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Destination Cluster</strong></TableCell>
                            <TableCell>{stemiCase.destinationHospital.cluster}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Timestamps */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Schedule color="primary" />
                  <Typography variant="h6">Timestamps</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Created</strong></TableCell>
                        <TableCell>{formatDate(stemiCase.createdAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Updated</strong></TableCell>
                        <TableCell>{formatDate(stemiCase.updatedAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Triage Time</strong></TableCell>
                        <TableCell>{stemiCase.triageTime ? formatDate(stemiCase.triageTime) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>First ECG Time</strong></TableCell>
                        <TableCell>{stemiCase.firstEcgTime ? formatDate(stemiCase.firstEcgTime) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Balloon Inflation</strong></TableCell>
                        <TableCell>{stemiCase.balloonInflationTime ? formatDate(stemiCase.balloonInflationTime) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Door Out Time</strong></TableCell>
                        <TableCell>{stemiCase.doorOutTime ? formatDate(stemiCase.doorOutTime) : 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quality Metrics */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assessment color="primary" />
                  <Typography variant="h6">Quality Metrics</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="h6" color="primary">
                        {stemiCase.doorToEcgMinutes || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Door to ECG (min)</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="h6" color="primary">
                        {stemiCase.doorToBalloonMinutes || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Door to Balloon (min)</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="h6" color="primary">
                        {stemiCase.doorToNeedleMinutes || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Door to Needle (min)</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="h6" color="primary">
                        {stemiCase.doorInDoorOutMinutes || 'N/A'}
                      </Typography>
                      <Typography variant="caption">Door In Door Out (min)</Typography>
                    </Box>
                  </Grid>
                </Grid>
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
        )}

        {activeTab === 1 && (
          <StemiTimelineView stemiCase={stemiCase} />
        )}
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
        patientName={`${stemiCase.patient?.firstName || ''} ${stemiCase.patient?.lastName || ''}`.trim()}
        caseType="STEMI"
        caseId={stemiCase.id}
        patientId={stemiCase.patientId}
        ticketId={stemiCase.ticketId}
      />
    </Dialog>
  );
};

export default ViewStemiCaseDialog;

