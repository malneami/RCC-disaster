import React, { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Button } from '@mui/material';
import { Bed as BedIcon, Add as AddIcon } from '@mui/icons-material';

import BedsTable from '../../Beds/components/BedsTable';
import BedsCards from '../../Beds/components/BedsCards';
import EditBedDialog from '../../Beds/components/EditBedDialog';
import ViewBedDialog from '../../Beds/components/ViewBedDialog';
import BedHistoryDialog from '../../Beds/components/BedHistoryDialog';
import AddBedDialog from '../../Beds/components/AddBedDialog';
import DeleteBedDialog from '../../Beds/components/DeleteBedDialog';
import { useBeds } from '../../Beds/hooks/useBeds';
import { useUnits } from '../../Beds/hooks/useUnits';
import { BedListItem, BedStatus, GetBedsParams } from '../../Beds/services/bedService';
import { useAuth } from '../../../contexts/AuthContext';
import { useBedMutations } from '../../Beds/hooks/useBedMutations';

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
  const { user } = useAuth();
  
  // Check if user can create/delete beds
  const canManageBeds = user?.role === 'HOSPITAL_USER' || 
                        user?.role === 'ED_NURSE' || 
                        user?.role === 'UNIT_NURSE' || 
                        user?.role === 'ADMIN' || 
                        user?.role === 'RCC';
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  const defaultFilters = {
    unitId: '',
    status: '',
  };
  
  const [localFilters, setLocalFilters] = useState(defaultFilters);
  
  const appliedFilters = externalFilters !== undefined ? externalFilters : localFilters;
  
  const setAppliedFilters = (filters: typeof defaultFilters) => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    } else {
      setLocalFilters(filters);
    }
  };
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { units, loading: unitsLoading } = useUnits(hospitalId, true);

  const bedFilters = useMemo((): GetBedsParams => {
    const filters: GetBedsParams = {
      hospitalId,
    };
    
    if (appliedFilters.unitId) {
      filters.unitId = appliedFilters.unitId;
    }
    
    if (appliedFilters.status) {
      filters.status = appliedFilters.status as BedStatus;
    }
    
    return filters;
  }, [hospitalId, appliedFilters.unitId, appliedFilters.status]);

  const { beds, loading: bedsLoading } = useBeds(bedFilters);
  
  const { deleteBed, deleteBedLoading } = useBedMutations(bedFilters);

  useEffect(() => {
    if (!externalFilters && !onFiltersChange) {
      setLocalFilters({
        unitId: '',
        status: '',
      });
    }
  }, [hospitalId, externalFilters, onFiltersChange]);

  // Update lastUpdated when beds data changes
  useEffect(() => {
    if (beds.length > 0 || !bedsLoading) {
      setLastUpdated(new Date());
    }
  }, [beds, bedsLoading]);

  const handleViewDetails = (bed: BedListItem) => {
    setSelectedBedId(bed.id);
    setViewDialogOpen(true);
  };

  const handleEditBed = (bed: BedListItem) => {
    setSelectedBedId(bed.id);
    setEditDialogOpen(true);
  };

  const handleViewHistory = (bed: BedListItem) => {
    setSelectedBedId(bed.id);
    setHistoryDialogOpen(true);
  };

  const handleUpdateBed = async () => {
    setEditDialogOpen(false);
    setSelectedBedId(null);
  };

  const handleFiltersApplied = (filters: typeof appliedFilters) => {
    setAppliedFilters(filters);
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const handleDeleteBed = (bed: BedListItem) => {
    setSelectedBedId(bed.id);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBedId) return;

    try {
      setDeleteError(null);
      await deleteBed(selectedBedId);
      setDeleteDialogOpen(false);
      setSelectedBedId(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete bed';
      setDeleteError(errorMessage);
    }
  };

  if (bedsLoading && beds.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <BedIcon color="primary" />
              <Box>
                <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Box>
              </Box>
            </Box>
          </Box>
          {canManageBeds && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddBedDialogOpen(true)}
            >
              Add Bed
            </Button>
          )}
        </Box>
      </Box>

      {viewMode === 'table' ? (
        <BedsTable
          beds={beds}
          loading={bedsLoading || unitsLoading}
          onViewDetails={handleViewDetails}
          onEditBed={handleEditBed}
          onViewHistory={handleViewHistory}
          onDeleteBed={canManageBeds ? handleDeleteBed : undefined}
          isHospitalUser={canManageBeds}
          isAdmin={false} // Never show hospital filter in hospital dashboard context
          totalCount={beds.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          hospitals={undefined} // No hospital filter needed since we're already scoped to one hospital
          units={units}
          appliedFilters={appliedFilters}
          onFiltersApplied={handleFiltersApplied}
          userHospitalId={hospitalId}
          onViewModeChange={setViewMode}
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(0);
          }}
        />
      ) : (
        <BedsCards
          beds={beds}
          loading={bedsLoading || unitsLoading}
          onViewDetails={handleViewDetails}
          onEditBed={handleEditBed}
          onViewHistory={handleViewHistory}
          onDeleteBed={canManageBeds ? handleDeleteBed : undefined}
          isHospitalUser={canManageBeds}
          totalCount={beds.length}
          hospitals={undefined} // No hospital filter needed since we're already scoped to one hospital
          units={units}
          appliedFilters={appliedFilters}
          onFiltersApplied={handleFiltersApplied}
          isAdmin={false} // Never show hospital filter in hospital dashboard context
          userHospitalId={hospitalId}
          onViewModeChange={setViewMode}
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(0);
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <EditBedDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedBedId(null);
        }}
        bedId={selectedBedId}
        onUpdate={handleUpdateBed}
      />

      <ViewBedDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedBedId(null);
        }}
        bedId={selectedBedId}
      />

      <BedHistoryDialog
        open={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedBedId(null);
        }}
        bedId={selectedBedId}
      />

      {canManageBeds && (
        <>
          <AddBedDialog
            open={addBedDialogOpen}
            onClose={() => setAddBedDialogOpen(false)}
            hospitalId={hospitalId}
          />

          <DeleteBedDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedBedId(null);
              setDeleteError(null);
            }}
            onConfirm={handleConfirmDelete}
            bedId={selectedBedId}
            loading={deleteBedLoading}
            error={deleteError}
          />
        </>
      )}
    </>
  );
};

export default HospitalBedsTab;

