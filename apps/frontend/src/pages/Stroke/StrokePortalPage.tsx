import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Tooltip, Alert } from '@mui/material';
import { Add, Assessment, Dashboard, FileDownload, Timeline } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import StrokeCasesList from './components/StrokeCasesList';
import StrokeCasesCards from './components/StrokeCasesCards';
import StrokeKPIDashboard from './components/StrokeKPIDashboardMain';
import CreateStrokeCaseDialog from './components/CreateStrokeCaseDialog';
import StrokeCaseDetailsDialog from './components/StrokeCaseDetailsDialog';
import EditStrokeCaseDialog from './components/EditStrokeCaseDialog';
import StrokeOutcomeForm from './components/StrokeOutcomeForm';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import FloatingScrollbar from '../../components/Common/FloatingScrollbar';
import { StrokeService, StrokeCase, StrokeKPISummary, StrokeCaseFilters } from '../../services/strokeService';
import { StrokeExportService } from './services/strokeExportService';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`stroke-tabpanel-${index}`}
      aria-labelledby={`stroke-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StrokePortalPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [strokeCases, setStrokeCases] = useState<StrokeCase[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [kpiSummary, setKpiSummary] = useState<StrokeKPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StrokeCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [outcomeFormDialogOpen, setOutcomeFormDialogOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<StrokeCaseFilters>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage stroke cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
  ];

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/v1/hospitals');
        const hospitalsData = await response.json();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };

    loadHospitals();
  }, []);



  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesResult, kpiResult] = await Promise.allSettled([
        StrokeService.getStrokeCasesPaginated({
          hospitalId: appliedFilters.hospitalId,
          originHospitalId: appliedFilters.originHospitalId,
          destinationHospitalId: appliedFilters.destinationHospitalId,
          strokeType: appliedFilters.strokeType,
          status: appliedFilters.status,
          modeOfArrival: appliedFilters.modeOfArrival,
          dateFrom: appliedFilters.dateFrom,
          dateTo: appliedFilters.dateTo,
          search: searchTerm || undefined,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        }),
        StrokeService.getKPISummary()
      ]);

      if (casesResult.status === 'fulfilled') {
        setStrokeCases(casesResult.value.cases);
        setTotalCases(casesResult.value.total);
      } else {
        console.error('Failed to load cases:', casesResult.reason);
        setError('Failed to load stroke cases');
      }

      if (kpiResult.status === 'fulfilled') {
        setKpiSummary(kpiResult.value);
      } else {
        console.error('Failed to load KPI summary:', kpiResult.reason);
        // Don't set error here so cases can still be viewed
      }
    } catch (err) {
      setError('Failed to load stroke portal data');
      console.error('Error loading stroke portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleFiltersApplied = (filters: {
    strokeType: string;
    status: string;
    originHospitalId: string;
    destinationHospitalId: string;
    modeOfArrival: string;
    dateFrom: string;
    dateTo: string;
  }) => {
    const nextFilters: StrokeCaseFilters = {
      originHospitalId: filters.originHospitalId || undefined,
      destinationHospitalId: filters.destinationHospitalId || undefined,
      strokeType: (filters.strokeType as any) || undefined,
      status: (filters.status as any) || undefined,
      modeOfArrival: (filters.modeOfArrival as any) || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    };

    setAppliedFilters(nextFilters);
    setPage(0);
  };

  const handleCreateCase = async (data: any) => {
    try {
      const newCase = await StrokeService.createStrokeCase(data);
      setStrokeCases(prev => [newCase, ...prev]);
      setCreateDialogOpen(false);
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error creating stroke case:', err);
      throw err;
    }
  };

  const handleUpdateCase = async (id: string, data: any) => {
    try {
      const updatedCase = await StrokeService.updateStrokeCase(id, data);
      setStrokeCases(prev => prev.map(case_ => case_.id === id ? updatedCase : case_));
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error updating stroke case:', err);
      throw err;
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await StrokeService.deleteStrokeCase(id);
      setStrokeCases(prev => prev.filter(case_ => case_.id !== id));
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error deleting stroke case:', err);
      throw err;
    }
  };

  const handleAddCaseNote = (case_: StrokeCase) => {
    // TODO: Implement case note creation dialog
    console.log('Add case note for:', case_);
    // For now, just log the case - you can implement a dialog later
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportFilters: StrokeCaseFilters = {};

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          exportFilters[key as keyof StrokeCaseFilters] = value as any;
        }
      });

      if (searchTerm && searchTerm.trim()) {
        exportFilters.search = searchTerm.trim();
      }

      await StrokeExportService.exportToExcel(exportFilters);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export stroke cases to Excel');
    } finally {
      setExportLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RCC';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const headerActions = (
    <Fab
      color="primary"
      size="medium"
      onClick={() => setCreateDialogOpen(true)}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      }}
    >
      <Add />
    </Fab>
  );

  // Create KPI cards data
  const kpiCards = [
    {
      title: 'Total Cases',
      value: strokeCases.length,
      icon: <Assessment />,
      color: '#1976d2',
    },
    {
      title: 'Avg Registration to CT',
      value: kpiSummary?.averageTimings.registrationToCt ?
        `${Math.round(kpiSummary.averageTimings.registrationToCt)} min` : 'N/A',
      icon: <Timeline />,
      color: '#ed6c02',
    },
    {
      title: 'KPI 1 Performance',
      value: kpiSummary?.kpiPerformance.kpi1.percentage ?
        `${Math.round(kpiSummary.kpiPerformance.kpi1.percentage)}%` : 'N/A',
      icon: <Dashboard />,
      color: '#2e7d32',
    },
    {
      title: 'Success Rate',
      value: kpiSummary?.outcomes.successRate ?
        `${Math.round(kpiSummary.outcomes.successRate)}%` : 'N/A',
      icon: <Assessment />,
      color: '#d32f2f',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Stroke Portal - RCC Healthcare Platform</title>
      </Helmet>

      <PortalSkeleton
        title="Stroke Portal"
        subtitle="Comprehensive stroke care coordination and time-sensitive protocols"
        portalType="stroke"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={loadData}
        headerActions={headerActions}
        kpiCards={kpiCards}
      >
        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Main Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="stroke portal tabs"
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
            <StrokeCasesList
              cases={strokeCases}
              onUpdateCase={handleUpdateCase}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onAddCaseNote={handleAddCaseNote}
              isAdmin={isAdmin}
              onViewModeChange={setViewMode}
              totalCount={totalCases}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onFiltersApplied={handleFiltersApplied}
              hospitals={hospitals}
              appliedFilters={{
                strokeType: appliedFilters.strokeType || '',
                status: appliedFilters.status || '',
                originHospitalId: appliedFilters.originHospitalId || '',
                destinationHospitalId: appliedFilters.destinationHospitalId || '',
                modeOfArrival: (appliedFilters as any).modeOfArrival || '',
                dateFrom: appliedFilters.dateFrom || '',
                dateTo: appliedFilters.dateTo || '',
              }}
              searchValue={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setPage(0);
              }}
            />
          ) : (
            <StrokeCasesCards
              cases={strokeCases}
              loading={loading}
              onUpdateCase={handleUpdateCase}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onViewDetails={(case_) => {
                setSelectedCase(case_);
                setDetailsDialogOpen(true);
              }}
              onEditCase={(case_) => {
                setSelectedCase(case_);
                setEditDialogOpen(true);
              }}
              onOpenOutcomeForm={(case_) => {
                setSelectedCase(case_);
                setOutcomeFormDialogOpen(true);
              }}
              isAdmin={isAdmin}
              onViewModeChange={setViewMode}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StrokeKPIDashboard kpiSummary={kpiSummary} />
        </TabPanel>



        {/* Create Case Dialog */}
        <CreateStrokeCaseDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateCase}
        />

        {/* View Case Dialog */}
        <StrokeCaseDetailsDialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          strokeCase={selectedCase}
          onEdit={(case_) => {
            setDetailsDialogOpen(false);
            setSelectedCase(case_);
            setEditDialogOpen(true);
          }}
        />

        {/* Edit Case Dialog */}
        <EditStrokeCaseDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          strokeCase={selectedCase}
          onUpdate={handleUpdateCase}
        />

        {/* Outcome Form Dialog */}
        <StrokeOutcomeForm
          open={outcomeFormDialogOpen}
          onClose={() => setOutcomeFormDialogOpen(false)}
          strokeCaseId={selectedCase?.id || ''}
          strokeCaseData={selectedCase}
          onSuccess={() => {
            setOutcomeFormDialogOpen(false);
            setSelectedCase(null);
          }}
        />
      </PortalSkeleton>

      {/* Floating Action Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000,
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
        <Tooltip title="Create Stroke Case" placement="left">
          <Fab
            color="primary"
            aria-label="create stroke case"
            onClick={() => setCreateDialogOpen(true)}
            sx={{ width: 56, height: 56 }}
          >
            <Add />
          </Fab>
        </Tooltip>
      </Box>

      {/* Floating Horizontal Scrollbar */}
      <FloatingScrollbar />
    </>
  );
};

export default StrokePortalPage;
