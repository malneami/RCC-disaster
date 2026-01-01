import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBeds } from '../../Beds/hooks/useBeds';
import { useUnits } from '../../Beds/hooks/useUnits';
import { useBedMutations } from '../../Beds/hooks/useBedMutations';
import { BedListItem, BedStatus, GetBedsParams } from '../../Beds/services/bedService';

interface UseHospitalBedsTabProps {
  hospitalId: string;
  externalFilters?: {
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

export const useHospitalBedsTab = ({
  hospitalId,
  externalFilters,
  onFiltersChange
}: UseHospitalBedsTabProps) => {
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
  
  // Dialog states
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

  useEffect(() => {
    if (beds.length > 0 || !bedsLoading) {
      setLastUpdated(new Date());
    }
  }, [beds, bedsLoading]);

  const handleUpdateBed = async () => {
    setEditDialogOpen(false);
    setSelectedBedId(null);
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

  const handleFiltersApplied = (filters: typeof appliedFilters) => {
    setAppliedFilters(filters);
    setPage(0);
  };

  return {
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
    setAppliedFilters: handleFiltersApplied,
    
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
  };
};
