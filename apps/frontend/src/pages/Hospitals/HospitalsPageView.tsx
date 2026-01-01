import React from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Chip, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';

import { Hospital, HospitalFilters } from '../../services/hospitalService';
import HospitalDetailDrawer from './components/HospitalDetailDrawer';
import CreateHospitalDialog from './components/CreateHospitalDialog';
import UpdateCapacityDialog from './components/UpdateCapacityDialog';
import FilterDialog from './components/FilterDialog';

import { HospitalsHeader } from './components/view/HospitalsHeader';
import { HospitalsMetrics } from './components/view/HospitalsMetrics';
import { HospitalCard } from './components/view/HospitalCard';
import { useHospitalsView } from './hooks/useHospitalsView';

interface HospitalsPageProps {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  tabValue: number;
  selectedHospital: Hospital | null;
  filters: HospitalFilters;
  dialogStates: {
    createDialogOpen: boolean;
    updateCapacityDialogOpen: boolean;
    filterDialogOpen: boolean;
  };
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onUpdateCapacity: (hospital: Hospital) => void;
  onViewDashboard: (hospitalId: string) => void;
  onCreateHospital: (hospitalData: any) => void;
  onUpdateCapacitySubmit: (hospitalId: string, capacityData: any) => void;
  onApplyFilters: (filters: HospitalFilters) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onDialogClose: (dialogType: string) => void;
  onDialogOpen: (dialogType: string) => void;
}

const HospitalsPage: React.FC<HospitalsPageProps> = ({
  hospitals,
  loading,
  error,
  selectedHospital,
  filters,
  dialogStates,
  onUpdateCapacity,
  onViewDashboard,
  onCreateHospital,
  onUpdateCapacitySubmit,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  onDialogClose,
  onDialogOpen,
}) => {
  const theme = useTheme();

  const {
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    selectedHospitalForDrawer,
    drawerOpen,
    setDrawerOpen,
    stats,
    filteredHospitals,
    handleCardClick,
    filterChips,
    getChipStyles,
  } = useHospitalsView(hospitals);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hospital Management - RCC Healthcare</title>
      </Helmet>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f8fafc',
          pb: 4,
        }}
      >
        <HospitalsHeader
          totalHospitals={stats.total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={onRefresh}
          onAddHospital={() => onDialogOpen('create')}
        />

        <HospitalsMetrics stats={stats} />

        {error && (
          <Alert severity="error" sx={{ mx: 4, mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filter Chips */}
        <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Filter:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {filterChips.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                onClick={() => setStatusFilter(f.key)}
                sx={getChipStyles(f.key, f.color)}
              />
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            Showing {filteredHospitals.length} of {hospitals.length} hospitals
          </Typography>
        </Box>

        {/* Hospital Cards List */}
        <Box sx={{ px: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredHospitals.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <HospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No hospitals found</Typography>
            </Paper>
          ) : (
            filteredHospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                isSelected={selectedHospitalForDrawer?.id === hospital.id}
                onClick={() => handleCardClick(hospital)}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Side Drawer */}
      <HospitalDetailDrawer
        hospital={selectedHospitalForDrawer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateCapacity={onUpdateCapacity}
        onViewDashboard={onViewDashboard}
      />

      {/* Dialogs */}
      <CreateHospitalDialog
        open={dialogStates.createDialogOpen}
        onClose={() => onDialogClose('create')}
        onSubmit={onCreateHospital}
      />

      <UpdateCapacityDialog
        open={dialogStates.updateCapacityDialogOpen}
        hospital={selectedHospital}
        onClose={() => onDialogClose('updateCapacity')}
        onSubmit={onUpdateCapacitySubmit}
      />



      <FilterDialog
        open={dialogStates.filterDialogOpen}
        filters={filters}
        onClose={() => onDialogClose('filter')}
        onApply={onApplyFilters}
        onReset={onResetFilters}
      />
    </>
  );
};

export default HospitalsPage;
