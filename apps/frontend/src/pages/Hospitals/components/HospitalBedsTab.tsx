import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import BedsTable from '../../Beds/components/BedsTable';
import BedsCards from '../../Beds/components/BedsCards';
import { useHospitalBedsTab } from '../hooks/useHospitalBedsTab';
import { HospitalBedsHeader } from './beds-tab/HospitalBedsHeader';
import { HospitalBedsDialogs } from './beds-tab/HospitalBedsDialogs';
import { BedListItem } from '../../Beds/services/bedService';

interface HospitalBedsTabProps {
  hospitalId: string;
  filters?: {
    hospitalId?: string;
    unitId: string;
    status: string;
  };
  onFiltersChange?: (filters: {
    hospitalId?: string;
    unitId: string;
    status: string;
  }) => void;
}

const HospitalBedsTab: React.FC<HospitalBedsTabProps> = ({
  hospitalId,
  filters: externalFilters,
  onFiltersChange
}) => {
  const {
    canManageBeds,
    viewMode,
    setViewMode,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    searchTerm,
    setSearchTerm,
    lastUpdated,
    units,
    unitsLoading,
    beds,
    bedsLoading,
    appliedFilters,

    // Dialog states & handlers
    selectedBedId,
    setSelectedBedId,
    editDialogOpen,
    setEditDialogOpen,
    viewDialogOpen,
    setViewDialogOpen,
    historyDialogOpen,
    setHistoryDialogOpen,
    addBedDialogOpen,
    setAddBedDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteError,
    setDeleteError,
    deleteBedLoading,
    handleDeleteBed,
    handleConfirmDelete,
    handleUpdateBed,
    handleFiltersApplied,
  } = useHospitalBedsTab({ hospitalId, externalFilters, onFiltersChange });

  if (bedsLoading && beds.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Common props for both views
  const commonViewProps = {
    beds,
    loading: bedsLoading || unitsLoading,
    onViewDetails: (bed: BedListItem) => { setSelectedBedId(bed.id); setViewDialogOpen(true); },
    onEditBed: (bed: BedListItem) => { setSelectedBedId(bed.id); setEditDialogOpen(true); },
    onViewHistory: (bed: BedListItem) => { setSelectedBedId(bed.id); setHistoryDialogOpen(true); },
    onDeleteBed: canManageBeds ? handleDeleteBed : undefined,
    isHospitalUser: canManageBeds,
    totalCount: beds.length,
    hospitals: undefined,
    units,
    appliedFilters,
    onFiltersApplied: handleFiltersApplied,
    isAdmin: false,
    userHospitalId: hospitalId,
    onViewModeChange: setViewMode,
    searchValue: searchTerm,
    onSearchChange: (value: string) => { setSearchTerm(value); setPage(0); },
    page,
    rowsPerPage,
    onPageChange: (_: unknown, newPage: number) => setPage(newPage),
    onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); },
  };

  return (
    <>
      <HospitalBedsHeader
        lastUpdated={lastUpdated}
        canManageBeds={canManageBeds}
        onAddBed={() => setAddBedDialogOpen(true)}
      />

      {viewMode === 'table' ? (
        <BedsTable {...commonViewProps} />
      ) : (
        <BedsCards {...commonViewProps} />
      )}

      <HospitalBedsDialogs
        hospitalId={hospitalId}
        canManageBeds={canManageBeds}
        selectedBedId={selectedBedId}
        setSelectedBedId={setSelectedBedId}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        historyDialogOpen={historyDialogOpen}
        setHistoryDialogOpen={setHistoryDialogOpen}
        addBedDialogOpen={addBedDialogOpen}
        setAddBedDialogOpen={setAddBedDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        deleteBedLoading={deleteBedLoading}
        onConfirmDelete={handleConfirmDelete}
        onUpdateBed={handleUpdateBed}
      />
    </>
  );
};

export default HospitalBedsTab;
