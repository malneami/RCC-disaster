import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Tooltip } from '@mui/material';
import { Add, Assessment, Dashboard, Warning, TransferWithinAStation, Schedule, FileDownload } from '@mui/icons-material';

import { Helmet } from 'react-helmet-async';

import TraumaCasesList from './components/TraumaCasesList';
import TraumaCasesCards from './components/TraumaCasesCards';
import TraumaKPIDashboard from './components/TraumaKPIDashboardMain';
import CreateTraumaCaseDialog from './components/CreateTraumaCaseDialog';
import ViewTraumaCaseDialog from './components/ViewTraumaCaseDialog';
import EditTraumaCaseDialog from './components/EditTraumaCaseDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import { TraumaService, TraumaCase } from '../../services/traumaService';
import { TraumaKPIsResponse } from './types/traumaTypes';
import { useAuth } from '../../contexts/AuthContext';
import { TraumaExportService } from './services/traumaExportService';
import apiClient from '../../services/apiClient';

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
  const [kpiSummary, setKpiSummary] = useState<TraumaKPIsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [currentFilters, setCurrentFilters] = useState<any>({});

  // ... portalSteps

  useEffect(() => {
    loadData();
    loadHospitals();
  }, []);

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

      // Initial load uses default filters (empty)
      const [casesData, kpiData] = await Promise.all([
        TraumaService.getTraumaCases(),
        TraumaService.getKPISummary()
      ]);

      setTraumaCases(casesData.cases);
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

  const handleCreateCase = async (data: any) => {
    try {
      await TraumaService.createTraumaCase(data);
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

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportFilters: any = {};

      if (currentFilters.hospitalId) {
        exportFilters.originHospitalId = currentFilters.hospitalId;
      } else {
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (key === 'hospitalId' || key === 'dateFrom' || key === 'dateTo' ||
            key === 'criticalCase' || key === 'transferCase' || key === 'search') {
            return;
          }

          if (value !== undefined && value !== null && value !== '') {
            exportFilters[key] = value;
          }
        });
      }

      if (currentFilters.criticalCase !== null && currentFilters.criticalCase !== '') {
        exportFilters.criticalCase = currentFilters.criticalCase === true || currentFilters.criticalCase === 'true';
      }
      if (currentFilters.transferCase !== null && currentFilters.transferCase !== '') {
        exportFilters.transferCase = currentFilters.transferCase === true || currentFilters.transferCase === 'true';
      }

      if (currentFilters.dateFrom) {
        exportFilters.startDate = currentFilters.dateFrom;
      }
      if (currentFilters.dateTo) {
        exportFilters.endDate = currentFilters.dateTo;
      }

      if (currentFilters.search && currentFilters.search.trim()) {
        exportFilters.search = currentFilters.search.trim();
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
          {viewMode === 'table' ? (
            <TraumaCasesList
              cases={traumaCases}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onAddCaseNote={handleAddCaseNote}
              isAdmin={isAdmin}
              onViewModeChange={setViewMode}
              onFiltersChange={setCurrentFilters}
            />
          ) : (
            <TraumaCasesCards
              cases={traumaCases}
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
              onViewModeChange={setViewMode}
              onFiltersChange={setCurrentFilters}
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
      </PortalSkeleton>
    </>
  );
};

export default TraumaPortalPage;
