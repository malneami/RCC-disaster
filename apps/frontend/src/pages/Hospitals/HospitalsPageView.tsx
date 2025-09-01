import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { Hospital, CapacityAlert, HospitalFilters } from '../../services/hospitalService';
import PageHeader from './components/PageHeader';
import HospitalTabs from './components/HospitalTabs';
import CreateHospitalDialog from './components/CreateHospitalDialog';
import UpdateCapacityDialog from './components/UpdateCapacityDialog';
import AlertDialog from './components/AlertDialog';
import FilterDialog from './components/FilterDialog';

interface HospitalsPageProps {
  hospitals: Hospital[];
  alerts: CapacityAlert[];
  loading: boolean;
  error: string | null;
  tabValue: number;
  selectedHospital: Hospital | null;
  filters: HospitalFilters;
  dialogStates: {
    createDialogOpen: boolean;
    updateCapacityDialogOpen: boolean;
    alertDialogOpen: boolean;
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
  alerts,
  loading,
  error,
  tabValue,
  selectedHospital,
  filters,
  dialogStates,
  onTabChange,
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
  const getFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== undefined).length;
  };

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

      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Hospital Management"
          filterCount={getFilterCount()}
          alertCount={alerts.length}
          onFilterClick={() => onDialogOpen('filter')}
          onAlertClick={() => onDialogOpen('alert')}
          onRefresh={onRefresh}
          onAddClick={() => onDialogOpen('create')}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <HospitalTabs
          tabValue={tabValue}
          hospitals={hospitals}
          alerts={alerts}
          onTabChange={onTabChange}
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

        <AlertDialog
          open={dialogStates.alertDialogOpen}
          alerts={alerts}
          onClose={() => onDialogClose('alert')}
        />

        <FilterDialog
          open={dialogStates.filterDialogOpen}
          filters={filters}
          onClose={() => onDialogClose('filter')}
          onApply={onApplyFilters}
          onReset={onResetFilters}
        />
      </Box>
    </>
  );
};

export default HospitalsPage;
