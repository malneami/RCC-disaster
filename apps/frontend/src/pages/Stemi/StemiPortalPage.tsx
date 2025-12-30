import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Tabs, Tab, CircularProgress, LinearProgress, Fab, Button, Tooltip, TablePagination, Paper, Typography, TextField, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Add as AddIcon, Assessment, Dashboard, Warning, Schedule, FileDownload, Search as SearchIcon, FilterList as FilterIcon, ViewModule as CardsIcon, TableChart as TableIcon, Timeline } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import StemiCasesList from './components/StemiCasesList';
import StemiCasesCards from './components/StemiCasesCards';
import StemiKPIDashboard from './components/StemiKPIDashboard';
import CreateStemiCaseDialog from './components/CreateStemiCaseDialog';
import EditStemiCaseDialog from './components/EditStemiCaseDialog';
import ViewStemiCaseDialog from './components/ViewStemiCaseDialog';
import LiveFilterDialog from './components/LiveFilterDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';

import FloatingScrollbar from '../../components/Common/FloatingScrollbar';
import { StemiService, StemiCase, StemiKpiResponse, StemiFilterParams } from './services/stemiService';
import { StemiExportService } from './services/stemiExportService';
import { useAuth } from '../../contexts/AuthContext';
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
      id={`stemi-tabpanel-${index}`}
      aria-labelledby={`stemi-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StemiPortalPage: React.FC = () => {
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stemiCases, setStemiCases] = useState<StemiCase[]>([]);
  const [kpiSummary, setKpiSummary] = useState<StemiKpiResponse | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StemiCase | null>(null);
  const [kpiFilters, setKpiFilters] = useState<{
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [exportLoading, setExportLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{ id: string, name: string }>>([]);
  const [totalCases, setTotalCases] = useState(0);
  const requestRef = useRef(0);
  const kpiRequestRef = useRef(0);

  // Unified filters state for both views
  const [unifiedFilters, setUnifiedFilters] = useState<StemiFilterParams>({
    search: '',
    modeOfArrival: '',
    currentStatus: '',
    selectedTreatment: '',
    ecgResult: '',
    rccActivated: undefined,
    originHospitalId: '',
    destinationHospitalId: '',
    startDate: '',
    endDate: '',
  });
  const [searchInput, setSearchInput] = useState(unifiedFilters.search ?? '');

  // const isAdmin = user?.role === 'ADMIN';

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage STEMI cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
  ];

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, unifiedFilters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setUnifiedFilters(prev => {
        const currentSearch = prev.search ?? '';
        if (currentSearch === searchInput) {
          return prev;
        }

        return {
          ...prev,
          search: searchInput,
        };
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load hospitals on component mount
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await apiClient.get('/hospitals');
        setHospitals(response.data);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };
    loadHospitals();
  }, []);



  // Filter fields configuration
  const filterFields = useMemo(() => [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by patient name, ID, or symptoms...',
    },
    {
      key: 'modeOfArrival',
      label: 'Mode of Arrival',
      type: 'select' as const,
      options: [
        { value: 'AMBULANCE_RED_CRESCENT', label: 'Ambulance (Red Crescent)' },
        { value: 'PRIVATE_CAR', label: 'Private Vehicle' },
        { value: 'TRANSFERRED_FROM_ANOTHER_HOSPITAL', label: 'Hospital Transfer' },
      ],
    },
    {
      key: 'currentStatus',
      label: 'Current Status',
      type: 'select' as const,
      options: [
        { value: 'SUSPECTED', label: 'Suspected' },
        { value: 'ECG_PENDING', label: 'ECG Pending' },
        { value: 'STEMI_CONFIRMED', label: 'STEMI Confirmed' },
        { value: 'NSTEMI_CONFIRMED', label: 'NSTEMI Confirmed' },
        { value: 'UNSTABLE_ANGINA', label: 'Unstable Angina' },
        { value: 'RCC_ACTIVATED', label: 'RCC Activated' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'PCI_READY', label: 'PCI Ready' },
        { value: 'BALLOON_INFLATED', label: 'Balloon Inflated' },
        { value: 'CCU_ADMITTED', label: 'CCU Admitted' },
        { value: 'DISCHARGED', label: 'Discharged' },
        { value: 'EXPIRED', label: 'Expired' },
      ],
    },
    {
      key: 'selectedTreatment',
      label: 'Selected Treatment',
      type: 'select' as const,
      options: [
        { value: 'PRIMARY_PCI', label: 'Primary PCI' },
        { value: 'RESCUE_PCI', label: 'Rescue PCI' },
        { value: 'FIBRINOLYSIS', label: 'Fibrinolysis' },
        { value: 'TRANSFER_FOR_PRIMARY_PCI', label: 'Transfer for Primary PCI' },
        { value: 'MEDICAL_MANAGEMENT', label: 'Medical Management' },
      ],
    },
    {
      key: 'ecgResult',
      label: 'ECG Result',
      type: 'select' as const,
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'STEMI_ANTERIOR', label: 'STEMI Anterior' },
        { value: 'STEMI_INFERIOR', label: 'STEMI Inferior' },
        { value: 'STEMI_LATERAL', label: 'STEMI Lateral' },
        { value: 'STEMI_POSTERIOR', label: 'STEMI Posterior' },
        { value: 'NSTEMI_CHANGES', label: 'NSTEMI Changes' },
        { value: 'UNSTABLE_PATTERN', label: 'Unstable Pattern' },
        { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
      ],
    },
    {
      key: 'rccActivated',
      label: 'RCC Activated',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      key: 'originHospitalId',
      label: 'Origin Hospital',
      type: 'select' as const,
      options: hospitals.map(hospital => ({
        value: hospital.id,
        label: hospital.name
      })),
    },
    {
      key: 'destinationHospitalId',
      label: 'Destination Hospital',
      type: 'select' as const,
      options: hospitals.map(hospital => ({
        value: hospital.id,
        label: hospital.name
      })),
    },
    {
      key: 'startDate',
      label: 'From Date',
      type: 'date' as const,
    },
    {
      key: 'endDate',
      label: 'To Date',
      type: 'date' as const,
    },
  ], [hospitals]);

  const loadData = async (options?: { forceGlobalSpinner?: boolean }) => {
    const requestId = ++requestRef.current;
    const useGlobalSpinner = initialLoading || options?.forceGlobalSpinner;

    if (useGlobalSpinner) {
      setInitialLoading(true);
    } else {
      setDataLoading(true);
    }

    setError(null);

    // Prepare pagination params, excluding rccActivated for client-side filtering
    const { rccActivated, ...backendFilters } = unifiedFilters;

    // Convert rccActivated to string for comparison (filter dialog sends strings)
    const rccActivatedStr = (rccActivated === true || rccActivated === 'true') ? 'true' :
      (rccActivated === false || rccActivated === 'false') ? 'false' : undefined;

    // When RCC filter is active, fetch all data for proper client-side filtering
    // Otherwise use normal pagination
    const needsClientSideRccFilter = rccActivatedStr === 'true' || rccActivatedStr === 'false';
    const paginationParams = {
      ...backendFilters,
      limit: needsClientSideRccFilter ? 10000 : rowsPerPage, // Fetch large number when RCC filter active
      offset: needsClientSideRccFilter ? 0 : page * rowsPerPage,
    };

    let casesFailed = false;

    try {
      const casesResponse = await StemiService.getStemiCases(paginationParams);

      if (requestRef.current !== requestId) {
        return;
      }

      // Apply client-side filtering for RCC Activated
      let filteredCases = casesResponse.cases;
      if (rccActivatedStr === 'true') {
        // Filter for RCC Activated = Yes: cases with rccActivationToDoorOutMinutes not null/undefined/empty
        filteredCases = filteredCases.filter(
          (item) =>
            item.rccActivationToDoorOutMinutes !== null &&
            item.rccActivationToDoorOutMinutes !== undefined &&
            String(item.rccActivationToDoorOutMinutes) !== ''
        );
      } else if (rccActivatedStr === 'false') {
        // Filter for RCC Activated = No: cases with rccActivationToDoorOutMinutes null/undefined/empty
        filteredCases = filteredCases.filter(
          (item) =>
            item.rccActivationToDoorOutMinutes === null ||
            item.rccActivationToDoorOutMinutes === undefined ||
            String(item.rccActivationToDoorOutMinutes) === ''
        );
      }

      // Apply pagination to filtered results if RCC filter was active
      const totalFilteredCount = filteredCases.length;
      if (needsClientSideRccFilter) {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        filteredCases = filteredCases.slice(startIndex, endIndex);
      }

      setStemiCases(filteredCases);
      // Update total count: if RCC filter active, use filtered count; otherwise use backend total
      setTotalCases(needsClientSideRccFilter ? totalFilteredCount : casesResponse.total);
    } catch (err: any) {
      if (requestRef.current !== requestId) {
        return;
      }

      console.error('Error loading STEMI cases:', err);
      setError(err.response?.data?.message || 'Failed to load STEMI data');
      casesFailed = true;
    } finally {
      if (requestRef.current === requestId) {
        if (useGlobalSpinner) {
          setInitialLoading(false);
        } else {
          setDataLoading(false);
        }
      }
    }

    if (casesFailed || requestRef.current !== requestId) {
      return;
    }

    const kpiRequestId = ++kpiRequestRef.current;
    setKpiLoading(true);

    try {
      const kpiResponse = await StemiService.getKpiSummary(
        kpiFilters.hospitalId,
        kpiFilters.startDate,
        kpiFilters.endDate
      );

      if (requestRef.current === requestId && kpiRequestRef.current === kpiRequestId) {
        setKpiSummary(kpiResponse);
      }
    } catch (err) {
      if (requestRef.current === requestId && kpiRequestRef.current === kpiRequestId) {
        console.error('Error loading KPI data:', err);
      }
    } finally {
      if (kpiRequestRef.current === kpiRequestId) {
        setKpiLoading(false);
      }
    }
  };


  const handleCreateCase = async (caseData: any) => {
    try {
      const newCase = await StemiService.createStemiCase(caseData);
      setStemiCases(prev => [newCase, ...prev]);
      setCreateDialogOpen(false);
      await loadData(); // Refresh KPIs
    } catch (err: any) {
      console.error('Error creating STEMI case:', err);
      throw err;
    }
  };

  const handleUpdateCase = async (id: string, caseData: any) => {
    try {
      const updatedCase = await StemiService.updateStemiCase(id, caseData);
      setStemiCases(prev => prev.map(c => c.id === id ? updatedCase : c));
      // Update selectedCase if it's the one being edited
      setSelectedCase(prev => prev?.id === id ? updatedCase : prev);
      // Don't close dialog here - let the dialog handle closing after showing success message
      await loadData(); // Refresh KPIs
    } catch (err: any) {
      console.error('Error updating STEMI case:', err);
      throw err;
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await StemiService.deleteStemiCase(id);
      setStemiCases(prev => prev.filter(c => c.id !== id));
      await loadData(); // Refresh KPIs
    } catch (err: any) {
      console.error('Error deleting STEMI case:', err);
      throw err;
    }
  };

  const handleEditCase = (case_: StemiCase) => {
    setSelectedCase(case_);
    setEditDialogOpen(true);
  };

  const handleViewCase = (case_: StemiCase) => {
    setSelectedCase(case_);
    setViewDialogOpen(true);
  };

  const handleAddCaseNote = (case_: StemiCase) => {
    // TODO: Implement case note creation dialog
    console.log('Add case note for:', case_);
    // For now, just log the case - you can implement a dialog later
  };

  const handleOutcomeFormUpdate = (caseId: string, updatedData: any) => {
    // Update the specific case in the local state
    setStemiCases(prev => prev.map(c =>
      c.id === caseId
        ? {
          ...c,
          // Update outcome form related fields
          cathLabActivationTime: updatedData.cathLabActivationTime,
          cathLabArrivalTime: updatedData.cathLabArrivalTime,
          pciProcedureStartTime: updatedData.pciProcedureStartTime,
          pciProcedureCompleteTime: updatedData.pciProcedureCompleteTime,
          postPciComplications: updatedData.postPciComplications,
          dischargeStatus: updatedData.dischargeStatus,
          dischargeMedications: updatedData.dischargeMedications,
          followUpAppointmentDate: updatedData.followUpAppointmentDate,
          followUpAppointmentProvider: updatedData.followUpAppointmentProvider,
          outcomeFormCompleted: updatedData.outcomeFormCompleted,
          outcomeFormCompletionDate: updatedData.outcomeFormCompletionDate,
          outcomePercentageCompleteness: updatedData.outcomePercentageCompleteness,
        }
        : c
    ));

    // Refresh KPIs to reflect any changes
    loadData();
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const { rccActivated, limit, offset, ...backendFilters } = unifiedFilters;

      const exportFilters: StemiFilterParams = {};

      Object.entries(backendFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          exportFilters[key as keyof StemiFilterParams] = value as any;
        }
      });

      if (rccActivated !== undefined && rccActivated !== null && rccActivated !== '') {
        if (rccActivated === true || rccActivated === 'true') {
          exportFilters.rccActivated = true;
        } else if (rccActivated === false || rccActivated === 'false') {
          exportFilters.rccActivated = false;
        }
      }

      await StemiExportService.exportToExcel(exportFilters);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export STEMI cases to Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleKpiFilterChange = async (newFilters: { hospitalId?: string; startDate?: string; endDate?: string }) => {
    setKpiFilters(newFilters);
    const kpiRequestId = ++kpiRequestRef.current;
    setKpiLoading(true);
    try {
      const kpiResponse = await StemiService.getKpiSummary(
        newFilters.hospitalId,
        newFilters.startDate,
        newFilters.endDate
      );

      if (kpiRequestRef.current === kpiRequestId) {
        setKpiSummary(kpiResponse);
      }
    } catch (err) {
      if (kpiRequestRef.current === kpiRequestId) {
        console.error('Error loading KPI data:', err);
      }
    } finally {
      if (kpiRequestRef.current === kpiRequestId) {
        setKpiLoading(false);
      }
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  // Unified filter handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    setPage(0); // Reset to first page when searching
  };

  const handleFilterChange = (newFilters: StemiFilterParams) => {
    setUnifiedFilters(newFilters);
    setSearchInput(newFilters.search ?? '');
    setPage(0); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      modeOfArrival: '',
      currentStatus: '',
      selectedTreatment: '',
      ecgResult: '',
      rccActivated: undefined,
      originHospitalId: '',
      destinationHospitalId: '',
      startDate: '',
      endDate: '',
    };
    setUnifiedFilters(clearedFilters);
    setSearchInput('');
    setPage(0);
  };


  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <h2>Error Loading STEMI Portal</h2>
          <p>{error}</p>
          <Button
            variant="contained"
            onClick={() => loadData({ forceGlobalSpinner: true })}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  // KPI Cards for the portal skeleton
  const kpiCards = [
    {
      title: 'Total Cases',
      value: kpiLoading ? '...' : (kpiSummary?.totalCases ?? 0),
      color: '#388e3c',
      icon: <Assessment />,
    },
    {
      title: 'Cases This Month',
      value: kpiLoading ? '...' : (kpiSummary?.casesThisMonth ?? 0),
      color: '#1976d2',
      icon: <Schedule />,
    },
    {
      title: 'Cases This Week',
      value: kpiLoading ? '...' : (kpiSummary?.casesThisWeek ?? 0),
      color: '#ed6c02',
      icon: <Timeline />,
    },
    {
      title: 'Avg Door-to-Balloon',
      value: kpiLoading
        ? '...'
        : kpiSummary?.averageDoorToBalloonTime
          ? `${Math.round(kpiSummary.averageDoorToBalloonTime)} min`
          : 'N/A',
      color: '#2e7d32',
      icon: <Schedule />,
    },
    {
      title: 'Mortality Rate',
      value: kpiLoading
        ? '...'
        : kpiSummary?.kpi9?.percentage !== undefined
          ? `${kpiSummary.kpi9.percentage.toFixed(1)}%`
          : 'N/A',
      color: '#d32f2f',
      icon: <Warning />,
    },
  ];


  return (
    <>
      <Helmet>
        <title>STEMI Portal - RCC Healthcare Platform</title>
      </Helmet>

      <PortalSkeleton
        title="STEMI Portal"
        subtitle="Comprehensive STEMI care coordination and emergency protocols"
        portalType="stemi"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={() => loadData({ forceGlobalSpinner: true })}
        onCreateCase={() => setCreateDialogOpen(true)}
        kpiCards={kpiCards}
      >
        {/* Main Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="stemi portal tabs"
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

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Unified Header for Cases Tab */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                STEMI Cases
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stemiCases.length} of {totalCases} cases
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
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
                startIcon={<AddIcon />}
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
              placeholder="Search STEMI cases..."
              value={searchInput}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {dataLoading && (
            <Box mb={3}>
              <LinearProgress />
            </Box>
          )}

          {viewMode === 'table' ? (
            <StemiCasesList
              cases={stemiCases}
              loading={dataLoading}
              onEditCase={handleEditCase}
              onViewCase={handleViewCase}
              onDeleteCase={handleDeleteCase}
              onAddCaseNote={handleAddCaseNote}
              onOutcomeFormUpdate={handleOutcomeFormUpdate}
              totalCount={totalCases}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          ) : (
            <>
              <StemiCasesCards
                cases={stemiCases}
                loading={dataLoading}
                onEditCase={handleEditCase}
                onViewCase={handleViewCase}
                onDeleteCase={handleDeleteCase}
                onOutcomeFormUpdate={handleOutcomeFormUpdate}
              />
              <Box sx={{ mt: 2 }}>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 15, 20]}
                    component="div"
                    count={totalCases}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    labelRowsPerPage="Rows per page:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                    }
                  />
                </Paper>
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StemiKPIDashboard
            kpiSummary={kpiSummary}
            filters={kpiFilters}
            onFilterChange={handleKpiFilterChange}
          />
        </TabPanel>


      </PortalSkeleton>

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
              sx={{
                width: 56,
                height: 56,
              }}
            >
              {exportLoading ? <CircularProgress size={24} color="inherit" /> : <FileDownload />}
            </Fab>
          </span>
        </Tooltip>

        {/* Create Button */}
        <Tooltip title="Create STEMI Case" placement="left">
          <Fab
            color="primary"
            aria-label="create stemi case"
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              width: 56,
              height: 56,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Dialogs */}
      <CreateStemiCaseDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateCase}
      />

      <EditStemiCaseDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedCase(null);
        }}
        onSubmit={handleUpdateCase}
        stemiCase={selectedCase}
      />

      <ViewStemiCaseDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedCase(null);
        }}
        stemiCase={selectedCase}
      />

      {/* Unified Filter Dialog */}
      <LiveFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          handleFilterChange(newFilters);
          setFilterDialogOpen(false);
        }}
        onReset={handleClearFilters}
        fields={filterFields}
        values={{ ...unifiedFilters, search: searchInput }}
        resetButtonText="Reset All"
      />

      {/* Floating Horizontal Scrollbar */}
      <FloatingScrollbar />
    </>
  );
};

export default StemiPortalPage;
