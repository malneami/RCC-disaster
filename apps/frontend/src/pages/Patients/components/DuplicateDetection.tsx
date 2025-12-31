import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Fade, Grid } from '@mui/material';
import { patientService, DuplicateGroup, DuplicateMatch } from '@/services/patientService';

import DuplicateHeader from './duplicate-detection/DuplicateHeader';
import DuplicateEmptyState from './duplicate-detection/DuplicateEmptyState';
import DuplicateGroupCard from './duplicate-detection/DuplicateGroupCard';
import DuplicateMergeDialog from './duplicate-detection/DuplicateMergeDialog';
import DuplicateComparisonDialog from './duplicate-detection/DuplicateComparisonDialog';

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
        <DuplicateHeader
          error={error}
          setError={setError}
          confidenceThreshold={confidenceThreshold}
          setConfidenceThreshold={setConfidenceThreshold}
          loadDuplicates={loadDuplicates}
        />

        {duplicateGroups.length === 0 ? (
          <DuplicateEmptyState />
        ) : (
          <Grid container spacing={2}>
            {duplicateGroups.map((group) => (
              <Grid item xs={12} key={group.groupId}>
                <DuplicateGroupCard
                  group={group}
                  openMergeDialog={openMergeDialog}
                  openComparisonDialog={openComparisonDialog}
                  handleIgnore={handleIgnore}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <DuplicateMergeDialog
          open={mergeDialogOpen}
          onClose={() => setMergeDialogOpen(false)}
          selectedGroup={selectedGroup}
          primaryPatientId={primaryPatientId}
          handleMerge={handleMerge}
          loading={loading}
          selectedDuplicates={selectedDuplicates}
        />

        <DuplicateComparisonDialog
          open={comparisonDialogOpen}
          onClose={() => setComparisonDialogOpen(false)}
          selectedGroup={selectedGroup}
        />
      </Box>
    </Fade>
  );
};

export default DuplicateDetection;
