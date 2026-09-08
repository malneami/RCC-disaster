import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Bed as BedIcon, Dashboard } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import BedsTable from './components/BedsTable';
import BedsCards from './components/BedsCards';
import EditBedDialog from './components/EditBedDialog';
import ViewBedDialog from './components/ViewBedDialog';
import BedHistoryDialog from './components/BedHistoryDialog';
import AddBedDialog from './components/AddBedDialog';
import DeleteBedDialog from './components/DeleteBedDialog';
import { useBeds } from './hooks/useBeds';
import { useBedStats } from './hooks/useBedStats';
import { useHospitals } from './hooks/useHospitals';
import { useUnits } from './hooks/useUnits';
import { BedListItem, BedStatus, GetBedsParams, GetBedStatsParams } from './services/bedService';
import { useBedMutations } from './hooks/useBedMutations';
import { useAuth } from '../../contexts/AuthContext';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`beds-tabpanel-${index}`}
      aria-labelledby={`beds-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BedsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RCC';
  const isHospitalUser = !isAdmin && !!user?.hospitalId;
  const isHospitalUserRole = user?.role === 'HOSPITAL_USER';
  
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [appliedFilters, setAppliedFilters] = useState<{
    hospitalId?: string;
    unitId: string;
    status: string;
  }>({
    unitId: '',
    status: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { hospitals, loading: hospitalsLoading } = useHospitals(isAdmin);
  
  const { units, loading: unitsLoading } = useUnits(
    isHospitalUser ? user?.hospitalId : null,
    !!isHospitalUser
  );

  const bedFilters = useMemo((): GetBedsParams => {
    const filters: GetBedsParams = {};
    
    if (isAdmin && appliedFilters.hospitalId) {
      filters.hospitalId = appliedFilters.hospitalId;
    }
    
    if (appliedFilters.unitId) {
      filters.unitId = appliedFilters.unitId;
    }
    
    if (appliedFilters.status) {
      filters.status = appliedFilters.status as BedStatus;
    }
    
    return filters;
  }, [appliedFilters, isAdmin]);

  const statsFilters = useMemo((): GetBedStatsParams => {
    const filters: GetBedStatsParams = {};
    
    if (isAdmin && appliedFilters.hospitalId) {
      filters.hospitalId = appliedFilters.hospitalId;
    }
    
    if (appliedFilters.unitId) {
      filters.unitId = appliedFilters.unitId;
    }
    
    
    return filters;
  }, [appliedFilters, isAdmin]);

  // Fetch beds with filters from backend
  const { beds, loading: bedsLoading, refetch } = useBeds(bedFilters);
  const { stats } = useBedStats(statsFilters);

  const clientStats = stats || {
    total: 0,
    vacant: 0,
    occupied: 0,
    cleaning: 0,
    blocked: 0,
    reserved: 0,
  };

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

  const { deleteBed, deleteBedLoading } = useBedMutations(bedFilters);

  const handleUpdateBed = async () => {
    setEditDialogOpen(false);
    setSelectedBedId(null);
  };

  const handleFiltersApplied = (filters: typeof appliedFilters) => {
    setAppliedFilters(filters);
    setPage(0); 
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const loadData = async () => {
    await refetch();
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

  const portalSteps: PortalStep[] = [
    { label: 'Beds', description: 'View and manage bed availability', icon: <BedIcon /> },
    { label: 'Dashboard', description: 'Monitor bed occupancy metrics', icon: <Dashboard /> },
  ];


  const kpiCards = [
    {
      title: 'Total Beds',
      value: clientStats.total,
      icon: <BedIcon />,
      color: '#1976d2',
    },
    {
      title: 'Vacant',
      value: clientStats.vacant,
      icon: <BedIcon />,
      color: '#2e7d32',
    },
    {
      title: 'Occupied',
      value: clientStats.occupied,
      icon: <BedIcon />,
      color: '#d32f2f',
    },
    {
      title: 'Cleaning',
      value: clientStats.cleaning,
      icon: <BedIcon />,
      color: '#ed6c02',
    },
  ];

  if (bedsLoading && beds.length === 0 && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bed Management | MASAR</title>
      </Helmet>
      
      <PortalSkeleton
        title="Bed Management"
        subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
        portalType="beds"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={loadData}
        kpiCards={kpiCards}
        onCreateCase={isHospitalUserRole ? () => setAddBedDialogOpen(true) : undefined}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="bed management tabs"
            sx={{ minHeight: 48 }}
          >
            <Tab 
              label="Beds" 
              sx={{ 
                fontSize: '1rem', 
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }} 
            />
            <Tab 
              label="Dashboard" 
              sx={{ 
                fontSize: '1rem', 
                fontWeight: activeTab === 1 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }} 
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {viewMode === 'table' ? (
            <BedsTable
              beds={beds}
              loading={bedsLoading || hospitalsLoading || unitsLoading}
              onViewDetails={handleViewDetails}
              onEditBed={handleEditBed}
              onViewHistory={handleViewHistory}
              onDeleteBed={handleDeleteBed}
              isAdmin={isAdmin}
              isHospitalUser={isHospitalUserRole}
              totalCount={beds.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              hospitals={isAdmin ? hospitals : undefined}
              units={units}
              appliedFilters={appliedFilters}
              onFiltersApplied={handleFiltersApplied}
              userHospitalId={user?.hospitalId || null}
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
              loading={bedsLoading || hospitalsLoading || unitsLoading}
              onViewDetails={handleViewDetails}
              onEditBed={handleEditBed}
              onViewHistory={handleViewHistory}
              onDeleteBed={handleDeleteBed}
              isHospitalUser={isHospitalUserRole}
              totalCount={beds.length}
              hospitals={isAdmin ? hospitals : undefined}
              units={units}
              appliedFilters={appliedFilters}
              onFiltersApplied={handleFiltersApplied}
              isAdmin={isAdmin}
              userHospitalId={user?.hospitalId || null}
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
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Bed Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dashboard view coming soon...
            </Typography>
          </Box>
        </TabPanel>
      </PortalSkeleton>

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

      <AddBedDialog
        open={addBedDialogOpen}
        onClose={() => setAddBedDialogOpen(false)}
        hospitalId={isAdmin ? appliedFilters.hospitalId : undefined}
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
  );
};

export default BedsPage;