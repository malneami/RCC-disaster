import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Tooltip, Typography, Button, TextField, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Add, Assessment, Dashboard, Warning, TransferWithinAStation, Schedule, FileDownload, FilterList, Search, ViewModule as CardsIcon, TableChart as TableIcon } from '@mui/icons-material';

import { Helmet } from 'react-helmet-async';

import TraumaCasesList from './components/TraumaCasesList';
import TraumaCasesCards from './components/TraumaCasesCards';
import TraumaKPIDashboard from './components/TraumaKPIDashboardMain';
import CreateTraumaCaseDialog from './components/CreateTraumaCaseDialog';
import ViewTraumaCaseDialog from './components/ViewTraumaCaseDialog';
import EditTraumaCaseDialog from './components/EditTraumaCaseDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import GenericFilterDialog from '../../components/Common/GenericFilterDialog';
import { TraumaService, TraumaCase } from '../../services/traumaService';
import { TraumaKPIsResponse } from './types/traumaTypes';
import { useAuth } from '../../contexts/AuthContext';
import { TraumaExportService } from './services/traumaExportService';
import apiClient from '../../services/apiClient';
import { TRAUMA_FILTER_FIELDS } from './constants/traumaConstants';

import { TraumaCaseFilters } from './components/TraumaCasesList';


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
      id={`trauma-tabpanel-${index}`}
      aria-labelledby={`trauma-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TraumaPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [traumaCases, setTraumaCases] = useState<TraumaCase[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [kpiSummary, setKpiSummary] = useState<TraumaKPIsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TraumaCase | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // KPI Filters
  const [kpiFilters, setKpiFilters] = useState<{
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [hospitals, setHospitals] = useState<Array<{ id: string, name: string }>>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  const [exportLoading, setExportLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TraumaCaseFilters>({
    search: '',
    modeOfArrival: '',
    mechanismOfInjury: '',
    edDisposition: '',
    criticalCase: null,
    transferCase: null,
    dateFrom: '',
    dateTo: '',
    hospitalId: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // ... portalSteps

  useEffect(() => {
    loadData();
    loadHospitals();
  }, []);

  useEffect(() => {
    loadData();
  }, [appliedFilters, page, rowsPerPage]);

  const loadHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const response = await apiClient.get('/hospitals');
      setHospitals(response.data);
    } catch (error) {
      console.error('Error loading hospitals:', error);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      
      if (appliedFilters.modeOfArrival) filters.modeOfArrival = appliedFilters.modeOfArrival;
      if (appliedFilters.mechanismOfInjury) filters.mechanismOfInjury = appliedFilters.mechanismOfInjury;
      if (appliedFilters.criticalCase !== null && appliedFilters.criticalCase !== undefined) {
        filters.criticalCase = appliedFilters.criticalCase === true || (typeof appliedFilters.criticalCase === 'string' && appliedFilters.criticalCase === 'true');
      }
      if (appliedFilters.transferCase !== null && appliedFilters.transferCase !== undefined) {
        filters.transferCase = appliedFilters.transferCase === true || (typeof appliedFilters.transferCase === 'string' && appliedFilters.transferCase === 'true');
      }
      if (appliedFilters.dateFrom) filters.startDate = appliedFilters.dateFrom;
      if (appliedFilters.dateTo) filters.endDate = appliedFilters.dateTo;
      if (appliedFilters.hospitalId) filters.originHospitalId = appliedFilters.hospitalId;
      if (appliedFilters.search) filters.search = appliedFilters.search;

      filters.limit = rowsPerPage;
      filters.offset = page * rowsPerPage;

      const [casesData, kpiData] = await Promise.all([
        TraumaService.getTraumaCases(filters),
        TraumaService.getKPISummary()
      ]);

      setTraumaCases(casesData.cases);
      setTotalCases(casesData.total);
      setKpiSummary(kpiData);

    } catch (err) {
      console.error('Error loading trauma portal data:', err);
      setError('Failed to load trauma portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilterChange = async (key: string, value: string) => {
    const newFilters = { ...kpiFilters, [key]: value };
    setKpiFilters(newFilters);

    try {
      // Don't set global loading, maybe local loading in KPI dashboard?
      // For now, we'll just fetch updates. 
      // ideally we should have a loading state for KPIs specifically if we wanted to show a spinner there
      const kpiData = await TraumaService.getKPISummary(
        newFilters.hospitalId,
        newFilters.startDate,
        newFilters.endDate
      );
      setKpiSummary(kpiData);
    } catch (err) {
      console.error('Error updating KPI data:', err);
    }
  };

  const handleClearKpiFilters = () => {
    const cleared = {};
    setKpiFilters(cleared);
    handleKpiFilterChange('clear', ''); // Trigger reload with empty filters
    // Actually handleKpiFilterChange merges, so we should arguably just call getKPISummary directly or fix the handler
    // Let's just reload:
    loadKpiData({});
  };

  const loadKpiData = async (filters: { hospitalId?: string; startDate?: string; endDate?: string }) => {
    try {
      const kpiData = await TraumaService.getKPISummary(
        filters.hospitalId,
        filters.startDate,
        filters.endDate
      );
      setKpiSummary(kpiData);
    } catch (err) {
      console.error('Error updating KPI data:', err);
    }
  }

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage trauma cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateCase = async (_data: any) => {
    try {
      // The case is already created in the dialog
      setCreateDialogOpen(false);
      loadData();
    } catch (err) {
      console.error('Error creating trauma case:', err);
    }
  };

  const handleUpdateCase = async (id: string, data: any) => {
    try {
      await TraumaService.updateTraumaCase(id, data);
      loadData();
    } catch (err) {
      console.error('Error updating trauma case:', err);
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await TraumaService.deleteTraumaCase(id);
      loadData();
    } catch (err) {
      console.error('Error deleting trauma case:', err);
    }
  };

  const handleAddCaseNote = (case_: TraumaCase) => {
    console.log('Add case note for:', case_);
  };

  const handleFiltersChange = (filters: TraumaCaseFilters) => {
    setAppliedFilters((prev) => {
      // Only update if filters have actually changed to prevent unnecessary re-renders
      const hasChanged = 
        prev.search !== filters.search ||
        prev.modeOfArrival !== filters.modeOfArrival ||
        prev.mechanismOfInjury !== filters.mechanismOfInjury ||
        prev.edDisposition !== filters.edDisposition ||
        prev.criticalCase !== filters.criticalCase ||
        prev.transferCase !== filters.transferCase ||
        prev.dateFrom !== filters.dateFrom ||
        prev.dateTo !== filters.dateTo ||
        prev.hospitalId !== filters.hospitalId;
      
      if (hasChanged) {
        setPage(0); 
      }
      
      return hasChanged ? filters : prev;
    });
  };

  const handleSearchChange = (value: string) => {
    setAppliedFilters((prev: TraumaCaseFilters) => ({ ...prev, search: value }));
  };

  const handleFilterDialogApply = (newFilters: any) => {
    // Convert string boolean values to actual booleans for criticalCase and transferCase
    const processedFilters: any = { ...newFilters };
    if (processedFilters.criticalCase !== undefined) {
      if (typeof processedFilters.criticalCase === 'string') {
        if (processedFilters.criticalCase === 'true') {
          processedFilters.criticalCase = true;
        } else if (processedFilters.criticalCase === 'false') {
          processedFilters.criticalCase = false;
        } else {
          processedFilters.criticalCase = null;
        }
      }
    }
    if (processedFilters.transferCase !== undefined) {
      if (typeof processedFilters.transferCase === 'string') {
        if (processedFilters.transferCase === 'true') {
          processedFilters.transferCase = true;
        } else if (processedFilters.transferCase === 'false') {
          processedFilters.transferCase = false;
        } else {
          processedFilters.transferCase = null;
        }
      }
    }
    handleFiltersChange(processedFilters);
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: TraumaCaseFilters = {
      search: '',
      modeOfArrival: '',
      mechanismOfInjury: '',
      edDisposition: '',
      criticalCase: null,
      transferCase: null,
      dateFrom: '',
      dateTo: '',
      hospitalId: '',
    };
    setPage(0); // Reset to first page when clearing filters
    handleFiltersChange(clearedFilters);
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportFilters: any = {};

      if (appliedFilters.hospitalId) {
        exportFilters.originHospitalId = appliedFilters.hospitalId;
      } else {
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (key === 'hospitalId' || key === 'dateFrom' || key === 'dateTo' ||
            key === 'criticalCase' || key === 'transferCase' || key === 'search') {
            return;
          }

          if (value !== undefined && value !== null && value !== '') {
            exportFilters[key] = value;
          }
        });
      }

      if (appliedFilters.criticalCase !== null && appliedFilters.criticalCase !== undefined) {
        exportFilters.criticalCase = appliedFilters.criticalCase === true || (typeof appliedFilters.criticalCase === 'string' && appliedFilters.criticalCase === 'true');
      }
      if (appliedFilters.transferCase !== null && appliedFilters.transferCase !== undefined) {
        exportFilters.transferCase = appliedFilters.transferCase === true || (typeof appliedFilters.transferCase === 'string' && appliedFilters.transferCase === 'true');
      }

      if (appliedFilters.dateFrom) {
        exportFilters.startDate = appliedFilters.dateFrom;
      }
      if (appliedFilters.dateTo) {
        exportFilters.endDate = appliedFilters.dateTo;
      }

      if (appliedFilters.search && appliedFilters.search.trim()) {
        exportFilters.search = appliedFilters.search.trim();
      }

      await TraumaExportService.exportToExcel(exportFilters);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export trauma cases to Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <h2>Error Loading Trauma Portal</h2>
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </Box>
      </Box>
    );
  }

  // KPI Cards for the portal skeleton
  const kpiCards = [
    {
      title: 'Total Cases',
      value: kpiSummary?.totalCases || 0,
      color: '#1976d2',
      icon: <Assessment />,
    },
    {
      title: 'Critical Cases',
      value: kpiSummary?.criticalCases || 0,
      color: '#d32f2f',
      icon: <Warning />,
    },
    {
      title: 'Transfer Cases',
      value: kpiSummary?.transferCases || 0,
      color: '#ed6c02',
      icon: <TransferWithinAStation />,
    },
    {
      title: 'Avg Response Time',
      value: kpiSummary?.averageResponseTime ? `${Math.round(kpiSummary.averageResponseTime)} min` : 'N/A',
      color: '#2e7d32',
      icon: <Schedule />,
    },
    {
      title: 'Mortality Rate',
      value: kpiSummary?.mortalityRate !== undefined ? `${kpiSummary.mortalityRate.toFixed(1)}%` : 'N/A',
      color: '#d32f2f',
      icon: <Warning />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Trauma Portal - RCC Healthcare Platform</title>
      </Helmet>

      <PortalSkeleton
        title="Trauma Portal"
        subtitle="Comprehensive trauma care coordination and emergency protocols"
        portalType="trauma"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={loadData}
        onCreateCase={() => setCreateDialogOpen(true)}
        kpiCards={kpiCards}
      >
        {/* Main Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="trauma portal tabs"
            sx={{ minHeight: 48 }}
          >
            <Tab
              label="Cases"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }}
            />
            <Tab
              label="KPI Dashboard"
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
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Trauma Cases
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {traumaCases.length} of {totalCases} cases
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filters
              </Button>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table">
                  <TableIcon />
                </ToggleButton>
                <ToggleButton value="cards">
                  <CardsIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Case
              </Button>
            </Box>
          </Box>

          {/* Search Bar */}
          <Box mb={3}>
            <TextField
              fullWidth
              placeholder="Search trauma cases..."
              value={appliedFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Cases View */}
          {viewMode === 'table' ? (
            <TraumaCasesList
              cases={traumaCases}
              totalCount={totalCases}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onAddCaseNote={handleAddCaseNote}
              isAdmin={isAdmin}
              loading={loading}
            />
          ) : (
            <TraumaCasesCards
              cases={traumaCases}
              totalCount={totalCases}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onViewDetails={(case_) => {
                setSelectedCase(case_);
                setViewDialogOpen(true);
              }}
              onEditCase={(case_) => {
                setSelectedCase(case_);
                setEditDialogOpen(true);
              }}
              isAdmin={isAdmin}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TraumaKPIDashboard
            kpiSummary={kpiSummary}
            filters={kpiFilters}
            onFilterChange={handleKpiFilterChange}
            onClearFilters={handleClearKpiFilters}
            hospitals={hospitals}
            loading={hospitalsLoading}
          />
        </TabPanel>



        {/* Floating Action Button */}
        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Export Button */}
          <Tooltip title="Export to Excel" placement="left">
            <span>
              <Fab
                color="secondary"
                aria-label="export to excel"
                onClick={handleExportToExcel}
                disabled={exportLoading}
                sx={{ width: 56, height: 56 }}
              >
                {exportLoading ? <CircularProgress size={24} color="inherit" /> : <FileDownload />}
              </Fab>
            </span>
          </Tooltip>

          {/* Create Button */}
          <Tooltip title="Create Trauma Case" placement="left">
            <Fab
              color="primary"
              aria-label="create trauma case"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ width: 56, height: 56 }}
            >
              <Add />
            </Fab>
          </Tooltip>
        </Box>

        {/* Create Case Dialog */}
        <CreateTraumaCaseDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateCase}
        />

        {/* View Case Dialog */}
        <ViewTraumaCaseDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          traumaCase={selectedCase}
        />

        {/* Edit Case Dialog */}
        <EditTraumaCaseDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSubmit={handleUpdateCase}
          traumaCase={selectedCase}
        />

        {/* Filter Dialog */}
        <GenericFilterDialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          onApply={handleFilterDialogApply}
          onReset={handleClearFilters}
          fields={TRAUMA_FILTER_FIELDS as any}
          values={appliedFilters}
        />
      </PortalSkeleton>
    </>
  );
};

export default TraumaPortalPage;
