import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Merge,
  Close,
  Visibility,
  CheckCircle,
  Cancel,
  Person,
  Phone,
  Email,
  Badge,
  CalendarToday,
} from '@mui/icons-material';
import { patientService, DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { format } from 'date-fns';

// Color scheme matching Statistics design
const GRADIENT_COLORS = {
  high: 'linear-gradient(135deg, #ff9a9a 0%, #ffb3b3 100%)', // Soft red for high confidence
  medium: 'linear-gradient(135deg, #ffd54f 0%, #ffe082 100%)', // Soft yellow for medium confidence
  low: 'linear-gradient(135deg, #a5d8ff 0%, #c5e3ff 100%)', // Soft blue for low confidence
  primary: 'linear-gradient(135deg, #6ec6ff 0%, #a5d8ff 100%)', // Primary blue
  success: 'linear-gradient(135deg, #8dd88f 0%, #b8e6b9 100%)', // Success green
};

const getConfidenceGradient = (confidence: number) => {
  if (confidence > 0.9) return GRADIENT_COLORS.high;
  if (confidence > 0.8) return GRADIENT_COLORS.medium;
  return GRADIENT_COLORS.low;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence > 0.9) return '#ff9a9a';
  if (confidence > 0.8) return '#ffd54f';
  return '#a5d8ff';
};

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)',
          borderRadius: '16px',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={56}
            thickness={4}
            sx={{
              color: '#6ec6ff',
              mb: 2.5,
            }}
          />
          <Box
            sx={{
              color: '#6ec6ff',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Loading duplicates...
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={400}>
      <Box sx={{ p: 2 }}>
        {/* Modern Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(110, 198, 255, 0.25)',
            mb: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                fontSize: '1.5rem',
              }}
            >
              Duplicate Patient Detection
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Confidence Threshold"
                type="number"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.8)}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                size="small"
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6ec6ff',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6ec6ff',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={loadDuplicates}
                sx={{
                  background: GRADIENT_COLORS.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '8px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(110, 198, 255, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4db8ff 0%, #6ec6ff 100%)',
                    boxShadow: '0 6px 16px rgba(110, 198, 255, 0.45)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
        </Box>

        {/* Duplicate Groups */}
        {duplicateGroups.length === 0 ? (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
              borderRadius: '16px',
              padding: '60px 20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(110, 198, 255, 0.25)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: GRADIENT_COLORS.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 6px 20px rgba(141, 216, 143, 0.3)',
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: '#ffffff' }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#424242',
                mb: 1.5,
              }}
            >
              No Duplicates Found
            </Typography>
            <Typography
              sx={{
                color: '#6ec6ff',
                fontSize: '0.9375rem',
                maxWidth: '400px',
                margin: '0 auto',
                fontWeight: 500,
              }}
            >
              All patient records appear to be unique.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {duplicateGroups.map((group, groupIndex) => (
              <Grid item xs={12} key={group.groupId}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(110, 198, 255, 0.25)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  {/* Group Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: '#1a237e',
                          fontSize: '1.125rem',
                        }}
                      >
                        Duplicate Group ({group.patients.length} patients)
                      </Typography>
                      <Chip
                        label={`${(group.totalConfidence * 100).toFixed(0)}% Confidence`}
                        sx={{
                          background: getConfidenceGradient(group.totalConfidence),
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: '28px',
                          boxShadow: `0 2px 8px ${getConfidenceColor(group.totalConfidence)}40`,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Comparison" arrow>
                        <IconButton
                          size="small"
                          onClick={() => openComparisonDialog(group)}
                          sx={{
                            color: '#6ec6ff',
                            background: 'rgba(110, 198, 255, 0.1)',
                            '&:hover': {
                              background: 'rgba(110, 198, 255, 0.2)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Merge Duplicates" arrow>
                        <IconButton
                          size="small"
                          onClick={() => openMergeDialog(group)}
                          sx={{
                            color: '#8dd88f',
                            background: 'rgba(141, 216, 143, 0.1)',
                            '&:hover': {
                              background: 'rgba(141, 216, 143, 0.2)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Merge fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ignore" arrow>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleIgnore(group.patients.map((p: DuplicateMatch & { patientId: string }) => p.patientId))
                          }
                          sx={{
                            color: '#ff9a9a',
                            background: 'rgba(255, 154, 154, 0.1)',
                            '&:hover': {
                              background: 'rgba(255, 154, 154, 0.2)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Patient Cards */}
                  <Grid container spacing={2}>
                    {group.patients.map((match: DuplicateMatch & { patientId: string; patient?: any }, index: number) => {
                      const isPrimary = match.patientId === group.primaryPatientId;
                      return (
                        <Grid item xs={12} md={6} key={match.patientId}>
                          <Box
                            sx={{
                              background: isPrimary
                                ? 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)'
                                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                              borderRadius: '12px',
                              padding: '16px',
                              border: isPrimary
                                ? '2px solid rgba(110, 198, 255, 0.4)'
                                : '1px solid rgba(110, 198, 255, 0.15)',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                            }}
                          >
                            {isPrimary && (
                              <Chip
                                label="Primary"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  background: GRADIENT_COLORS.primary,
                                  color: '#ffffff',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: '22px',
                                }}
                              />
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 48,
                                  height: 48,
                                  background: GRADIENT_COLORS.primary,
                                  fontSize: '1.2rem',
                                  fontWeight: 700,
                                }}
                              >
                                {match.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                                {match.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#1a237e',
                                    fontSize: '1rem',
                                  }}
                                >
                                  {match.patient?.firstName} {match.patient?.lastName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#666',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Confidence: {(match.confidence * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {match.patient?.mrn && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Badge sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                    MRN: {match.patient.mrn}
                                  </Typography>
                                </Box>
                              )}
                              {match.patient?.nationalId && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Badge sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                    ID: {match.patient.nationalId}
                                  </Typography>
                                </Box>
                              )}
                              {match.patient?.phoneNumber && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Phone sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                    {match.patient.phoneNumber}
                                  </Typography>
                                </Box>
                              )}
                              {match.patient?.createdAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarToday sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                    {format(new Date(match.patient.createdAt), 'MMM dd, yyyy')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(110, 198, 255, 0.15)' }}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Chip
                                  label={match.matchReason}
                                  size="small"
                                  sx={{
                                    background: getConfidenceGradient(match.confidence),
                                    color: '#ffffff',
                                    fontWeight: 500,
                                    fontSize: '0.7rem',
                                    height: '20px',
                                  }}
                                />
                              </Box>
                              {match.matchedFields.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {match.matchedFields.map((field: string) => (
                                    <Chip
                                      key={field}
                                      label={field}
                                      size="small"
                                      sx={{
                                        background: 'rgba(110, 198, 255, 0.1)',
                                        color: '#6ec6ff',
                                        fontSize: '0.65rem',
                                        height: '18px',
                                        border: '1px solid rgba(110, 198, 255, 0.2)',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modern Merge Dialog */}
        <Dialog
          open={mergeDialogOpen}
          onClose={() => setMergeDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <Box
            sx={{
              background: GRADIENT_COLORS.primary,
              padding: '20px 24px',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  fontSize: '1.25rem',
                }}
              >
                Merge Duplicate Patients
              </Typography>
              <IconButton
                onClick={() => setMergeDialogOpen(false)}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            {selectedGroup && (
              <Box>
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                  }}
                >
                  Merging will combine all duplicate records into the primary patient. This action cannot be undone.
                </Alert>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    mt: 2,
                    mb: 1.5,
                    fontWeight: 600,
                    color: '#1a237e',
                    fontSize: '0.9375rem',
                  }}
                >
                  Primary Patient (will be kept):
                </Typography>
                {selectedGroup.patients
                  .filter((p: DuplicateMatch & { patientId: string }) => p.patientId === primaryPatientId)
                  .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                    <Box
                      key={p.patientId}
                      sx={{
                        background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                        borderRadius: '12px',
                        padding: '16px',
                        mb: 2,
                        border: '2px solid rgba(110, 198, 255, 0.4)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            background: GRADIENT_COLORS.primary,
                            fontSize: '1.2rem',
                            fontWeight: 700,
                          }}
                        >
                          {p.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                          {p.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5 }}>
                            {p.patient?.firstName} {p.patient?.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                            MRN: {p.patient?.mrn || 'N/A'} | National ID: {p.patient?.nationalId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    mt: 2,
                    mb: 1.5,
                    fontWeight: 600,
                    color: '#1a237e',
                    fontSize: '0.9375rem',
                  }}
                >
                  Duplicates to merge (will be deleted):
                </Typography>
                {selectedGroup.patients
                  .filter((p: DuplicateMatch & { patientId: string }) => p.patientId !== primaryPatientId)
                  .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                    <Box
                      key={p.patientId}
                      sx={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                        borderRadius: '12px',
                        padding: '16px',
                        mb: 1.5,
                        border: '1px solid rgba(110, 198, 255, 0.15)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            background: GRADIENT_COLORS.primary,
                            fontSize: '1.2rem',
                            fontWeight: 700,
                          }}
                        >
                          {p.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                          {p.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5 }}>
                            {p.patient?.firstName} {p.patient?.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                            MRN: {p.patient?.mrn || 'N/A'} | National ID: {p.patient?.nationalId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setMergeDialogOpen(false)}
              sx={{
                color: '#666',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              variant="contained"
              disabled={loading || !primaryPatientId || selectedDuplicates.length === 0}
              sx={{
                background: GRADIENT_COLORS.success,
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(141, 216, 143, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7bc87d 0%, #8dd88f 100%)',
                  boxShadow: '0 6px 16px rgba(141, 216, 143, 0.45)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                },
              }}
            >
              Merge Patients
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modern Comparison Dialog */}
        <Dialog
          open={comparisonDialogOpen}
          onClose={() => setComparisonDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <Box
            sx={{
              background: GRADIENT_COLORS.primary,
              padding: '20px 24px',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  fontSize: '1.25rem',
                }}
              >
                Patient Comparison
              </Typography>
              <IconButton
                onClick={() => setComparisonDialogOpen(false)}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            {selectedGroup && (
              <Grid container spacing={2}>
                {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                  <Grid item xs={12} md={6} key={p.patientId}>
                    <Box
                      sx={{
                        background:
                          p.patientId === selectedGroup.primaryPatientId
                            ? 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        border:
                          p.patientId === selectedGroup.primaryPatientId
                            ? '2px solid rgba(110, 198, 255, 0.4)'
                            : '1px solid rgba(110, 198, 255, 0.15)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#1a237e',
                            fontSize: '1rem',
                          }}
                        >
                          {p.patient?.firstName} {p.patient?.lastName}
                        </Typography>
                        {p.patientId === selectedGroup.primaryPatientId && (
                          <Chip
                            label="Primary"
                            size="small"
                            sx={{
                              background: GRADIENT_COLORS.primary,
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                            MRN
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                            {p.patient?.mrn || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                            National ID
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                            {p.patient?.nationalId || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                            Phone
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                            {p.patient?.phoneNumber || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                            Created
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                            {p.patient?.createdAt
                              ? format(new Date(p.patient.createdAt), 'MMM dd, yyyy')
                              : 'N/A'}
                          </Typography>
                        </Box>
                        {p.patient?.createdBy && (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                              Created By
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                              {p.patient.createdBy.firstName} {p.patient.createdBy.lastName}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setComparisonDialogOpen(false)}
              sx={{
                background: GRADIENT_COLORS.primary,
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(110, 198, 255, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4db8ff 0%, #6ec6ff 100%)',
                  boxShadow: '0 6px 16px rgba(110, 198, 255, 0.45)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default DuplicateDetection;
