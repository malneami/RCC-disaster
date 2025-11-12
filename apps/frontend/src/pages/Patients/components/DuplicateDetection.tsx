import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  Merge,
  Close,
  Visibility,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { patientService, DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { format } from 'date-fns';

const DuplicateDetection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [primaryPatientId, setPrimaryPatientId] = useState<string>('');
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getDuplicateGroups();
      setDuplicateGroups(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, [confidenceThreshold]);

  const handleMerge = async () => {
    if (!primaryPatientId || selectedDuplicates.length === 0) {
      setError('Please select a primary patient and at least one duplicate to merge');
      return;
    }

    try {
      setLoading(true);
      await patientService.mergeDuplicates(primaryPatientId, selectedDuplicates);
      setMergeDialogOpen(false);
      setPrimaryPatientId('');
      setSelectedDuplicates([]);
      await loadDuplicates();
    } catch (err: any) {
      setError(err.message || 'Failed to merge duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async (patientIds: string[]) => {
    try {
      setLoading(true);
      await patientService.ignoreDuplicates(patientIds);
      await loadDuplicates();
    } catch (err: any) {
      setError(err.message || 'Failed to ignore duplicates');
    } finally {
      setLoading(false);
    }
  };

  const openMergeDialog = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setPrimaryPatientId(group.primaryPatientId);
    setSelectedDuplicates(
      group.patients
        .filter((p: DuplicateMatch & { patientId: string }) => p.patientId !== group.primaryPatientId)
        .map((p: DuplicateMatch & { patientId: string }) => p.patientId),
    );
    setMergeDialogOpen(true);
  };

  const openComparisonDialog = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setComparisonDialogOpen(true);
  };

  if (loading && duplicateGroups.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Duplicate Patient Detection</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Confidence Threshold"
              type="number"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.8)}
              inputProps={{ min: 0, max: 1, step: 0.1 }}
              size="small"
              sx={{ width: 200 }}
            />
            <Button variant="outlined" onClick={loadDuplicates}>
              Refresh
            </Button>
          </Box>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Duplicate Groups */}
      {duplicateGroups.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Duplicates Found
              </Typography>
              <Typography color="textSecondary">
                All patient records appear to be unique.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {duplicateGroups.map((group) => (
            <Grid item xs={12} key={group.groupId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Duplicate Group ({group.patients.length} patients)
                    </Typography>
                    <Box>
                      <Chip
                        label={`Confidence: ${(group.totalConfidence * 100).toFixed(0)}%`}
                        color={group.totalConfidence > 0.9 ? 'error' : 'warning'}
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="View Comparison">
                        <IconButton
                          size="small"
                          onClick={() => openComparisonDialog(group)}
                          sx={{ mr: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Merge Duplicates">
                        <IconButton
                          size="small"
                          onClick={() => openMergeDialog(group)}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <Merge />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ignore">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleIgnore(group.patients.map((p: DuplicateMatch & { patientId: string }) => p.patientId))
                          }
                          color="default"
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Patient Name</TableCell>
                          <TableCell>MRN</TableCell>
                          <TableCell>National ID</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Match Reason</TableCell>
                          <TableCell>Matched Fields</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.patients.map((match: DuplicateMatch & { patientId: string; patient?: any }) => (
                          <TableRow key={match.patientId}>
                            <TableCell>
                              {match.patient?.firstName} {match.patient?.lastName}
                              {match.patientId === group.primaryPatientId && (
                                <Chip
                                  label="Primary"
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>{match.patient?.mrn || 'N/A'}</TableCell>
                            <TableCell>{match.patient?.nationalId || 'N/A'}</TableCell>
                            <TableCell>{match.patient?.phoneNumber || 'N/A'}</TableCell>
                            <TableCell>
                              {match.patient?.createdAt
                                ? format(new Date(match.patient.createdAt), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={match.matchReason}
                                size="small"
                                color={
                                  match.confidence > 0.9
                                    ? 'error'
                                    : match.confidence > 0.8
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {match.matchedFields.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {match.matchedFields.map((field: string) => (
                                    <Chip key={field} label={field} size="small" />
                                  ))}
                                </Box>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {(match.confidence * 100).toFixed(0)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Merge Duplicate Patients
          <IconButton
            aria-label="close"
            onClick={() => setMergeDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Merging will combine all duplicate records into the primary patient. This action
                cannot be undone.
              </Alert>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Primary Patient (will be kept):
              </Typography>
              {selectedGroup.patients
                .filter((p: DuplicateMatch & { patientId: string }) => p.patientId === primaryPatientId)
                .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                  <Card key={p.patientId} sx={{ mb: 2, bgcolor: 'primary.light' }}>
                    <CardContent>
                      <Typography>
                        {p.patient?.firstName} {p.patient?.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        MRN: {p.patient?.mrn || 'N/A'} | National ID:{' '}
                        {p.patient?.nationalId || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Duplicates to merge (will be deleted):
              </Typography>
              {selectedGroup.patients
                .filter((p: DuplicateMatch & { patientId: string }) => p.patientId !== primaryPatientId)
                .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                  <Card key={p.patientId} sx={{ mb: 1 }}>
                    <CardContent>
                      <Typography>
                        {p.patient?.firstName} {p.patient?.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        MRN: {p.patient?.mrn || 'N/A'} | National ID:{' '}
                        {p.patient?.nationalId || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleMerge}
            variant="contained"
            color="primary"
            disabled={loading || !primaryPatientId || selectedDuplicates.length === 0}
          >
            Merge Patients
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Patient Comparison
          <IconButton
            aria-label="close"
            onClick={() => setComparisonDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                      <TableCell key={p.patientId}>
                        {p.patient?.firstName} {p.patient?.lastName}
                        {p.patientId === selectedGroup.primaryPatientId && (
                          <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>MRN</TableCell>
                    {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                      <TableCell key={p.patientId}>{p.patient?.mrn || 'N/A'}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>National ID</TableCell>
                    {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                      <TableCell key={p.patientId}>{p.patient?.nationalId || 'N/A'}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Phone</TableCell>
                    {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                      <TableCell key={p.patientId}>{p.patient?.phoneNumber || 'N/A'}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Created</TableCell>
                    {selectedGroup.patients.map((p: any) => (
                      <TableCell key={p.patientId}>
                        {p.patient?.createdAt
                          ? format(new Date(p.patient.createdAt), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Created By</TableCell>
                    {selectedGroup.patients.map((p: any) => (
                      <TableCell key={p.patientId}>
                        {p.patient?.createdBy
                          ? `${p.patient.createdBy.firstName} ${p.patient.createdBy.lastName}`
                          : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuplicateDetection;
