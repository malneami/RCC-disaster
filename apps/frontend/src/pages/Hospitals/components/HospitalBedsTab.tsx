import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Bed as BedIcon } from '@mui/icons-material';

import BedsTable from '../../Beds/components/BedsTable';
import BedsCards from '../../Beds/components/BedsCards';
import EditBedDialog from '../../Beds/components/EditBedDialog';
import ViewBedDialog from '../../Beds/components/ViewBedDialog';
import BedHistoryDialog from '../../Beds/components/BedHistoryDialog';
import { useBeds } from '../../Beds/hooks/useBeds';
import { useUnits } from '../../Beds/hooks/useUnits';
import { Bed, BedStatus } from '../../Beds/services/bedService';

interface HospitalBedsTabProps {
  hospitalId: string;
}

const HospitalBedsTab: React.FC<HospitalBedsTabProps> = ({ hospitalId }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [appliedFilters, setAppliedFilters] = useState({
    hospitalId: '', // Not used since we're already filtered by hospital
    unitId: '',
    status: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { units, loading: unitsLoading } = useUnits(hospitalId, true);

  const bedParams: {
    hospitalId?: string;
    unitId?: string;
    status?: Bed['status'];
  } = {
    hospitalId, // Always filter by the hospital
  };

  if (appliedFilters.unitId) {
    bedParams.unitId = appliedFilters.unitId;
  }

  if (appliedFilters.status) {
    bedParams.status = appliedFilters.status as Bed['status'];
  }

  const { beds, loading: bedsLoading, refetch } = useBeds(bedParams);

  useEffect(() => {
    if (editDialogOpen || viewDialogOpen) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetch().then(() => {
          setLastUpdated(new Date());
        });
      }
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [refetch, editDialogOpen, viewDialogOpen]);

  const handleViewDetails = (bed: Bed) => {
    setSelectedBed(bed);
    setViewDialogOpen(true);
  };

  const handleEditBed = (bed: Bed) => {
    setSelectedBed(bed);
    setEditDialogOpen(true);
  };

  const handleViewHistory = (bed: Bed) => {
    setSelectedBed(bed);
    setHistoryDialogOpen(true);
  };

  const handleUpdateBed = async (_bedId: string, _data: { status: BedStatus; location?: string }) => {
    await refetch();
    setEditDialogOpen(false);
    setSelectedBed(null);
    setLastUpdated(new Date());
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
        </Box>
      </Box>

      {viewMode === 'table' ? (
        <BedsTable
          beds={beds}
          loading={bedsLoading || unitsLoading}
          onViewDetails={handleViewDetails}
          onEditBed={handleEditBed}
          onViewHistory={handleViewHistory}
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
          setSelectedBed(null);
        }}
        bed={selectedBed}
        onUpdate={handleUpdateBed}
      />

      <ViewBedDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedBed(null);
        }}
        bed={selectedBed}
      />

      <BedHistoryDialog
        open={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedBed(null);
        }}
        bed={selectedBed}
      />
    </>
  );
};

export default HospitalBedsTab;

