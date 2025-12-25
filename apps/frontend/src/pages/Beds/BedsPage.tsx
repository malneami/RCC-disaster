import React, { useState, useEffect } from 'react';
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
import { useBeds } from './hooks/useBeds';
import { useHospitals } from './hooks/useHospitals';
import { useUnits } from './hooks/useUnits';
import { Bed, BedStatus } from './services/bedService';
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
  
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [appliedFilters, setAppliedFilters] = useState({
    hospitalId: '',
    unitId: '',
    status: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { hospitals, loading: hospitalsLoading } = useHospitals(isAdmin);
  
  const { units, loading: unitsLoading } = useUnits(
    isHospitalUser ? user?.hospitalId : null,
    !!isHospitalUser
  );

  const bedParams: {
    hospitalId?: string;
    unitId?: string;
    status?: Bed['status'];
  } = {};

  if (isAdmin && appliedFilters.hospitalId) {
    bedParams.hospitalId = appliedFilters.hospitalId;
  }

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

  const portalSteps: PortalStep[] = [
    { label: 'Beds', description: 'View and manage bed availability', icon: <BedIcon /> },
    { label: 'Dashboard', description: 'Monitor bed occupancy metrics', icon: <Dashboard /> },
  ];


  const kpiCards = [
    {
      title: 'Total Beds',
      value: beds.length,
      icon: <BedIcon />,
      color: '#1976d2',
    },
    {
      title: 'Vacant',
      value: beds.filter(b => b.status === 'VACANT').length,
      icon: <BedIcon />,
      color: '#2e7d32',
    },
    {
      title: 'Occupied',
      value: beds.filter(b => b.status === 'OCCUPIED').length,
      icon: <BedIcon />,
      color: '#d32f2f',
    },
    {
      title: 'Cleaning',
      value: beds.filter(b => b.status === 'CLEANING').length,
      icon: <BedIcon />,
      color: '#ed6c02',
    },
  ];

  if (bedsLoading && beds.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bed Management - RCC Healthcare Platform</title>
      </Helmet>
      
      <PortalSkeleton
        title="Bed Management"
        subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
        portalType="patients"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={loadData}
        kpiCards={kpiCards}
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
              isAdmin={isAdmin}
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

export default BedsPage;