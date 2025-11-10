import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Tabs, Tab, CircularProgress, LinearProgress, Fab, Button, Tooltip, TablePagination, Paper, Typography, TextField, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Add as AddIcon, Assessment, Timeline, Dashboard, Warning, Schedule, FileDownload, Search as SearchIcon, FilterList as FilterIcon, ViewModule as CardsIcon, TableChart as TableIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import StemiCasesList from './components/StemiCasesList';
import StemiCasesCards from './components/StemiCasesCards';
import StemiKPIDashboard from './components/StemiKPIDashboard';
import CreateStemiCaseDialog from './components/CreateStemiCaseDialog';
import EditStemiCaseDialog from './components/EditStemiCaseDialog';
import ViewStemiCaseDialog from './components/ViewStemiCaseDialog';
import LiveFilterDialog from './components/LiveFilterDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import TimelineView, { TimelineEvent } from '../../components/Common/TimelineView';
import { StemiService, StemiCase, StemiKpiResponse, StemiFilterParams } from './services/stemiService';
import { StemiExportService } from './services/stemiExportService';
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
  const [hospitals, setHospitals] = useState<Array<{id: string, name: string}>>([]);
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
    { label: 'Timeline View', description: 'Track case progression', icon: <Timeline /> },
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
        const response = await fetch('http://localhost:3001/api/v1/hospitals');
        const hospitalsData = await response.json();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };
    loadHospitals();
  }, []);

  const convertStemiCasesToTimelineEvents = (cases: StemiCase[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    cases.forEach(case_ => {
      // Patient arrival
      if (case_.createdAt) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-arrival`,
          timestamp: case_.createdAt,
          title: `Patient Arrival - ${patientName}`,
          description: `Patient ${patientName} (ID: ${nationalId}) arrived at ${case_.originHospital?.name || 'hospital'} via ${getModeOfArrivalLabel(case_.modeOfArrival)}`,
          type: 'arrival',
          status: 'completed',
          user: {
            name: 'System',
            role: 'Data Collector',
          },
          hospital: case_.originHospital ? {
            name: case_.originHospital.name,
            id: case_.originHospital.id,
          } : undefined,
          details: {
            modeOfArrival: case_.modeOfArrival,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
            ticketId: case_.ticketId,
            currentStatus: case_.currentStatus,
          },
        });
      }

      // ECG Assessment
      if (case_.firstEcgTime) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-ecg`,
          timestamp: case_.firstEcgTime,
          title: `ECG Assessment - ${patientName}`,
          description: `ECG completed for ${patientName} (ID: ${nationalId}) - ${getEcgResultLabel(case_.ecgResult)}${case_.ecgFindings ? `: ${case_.ecgFindings}` : ''}`,
          type: 'assessment',
          status: 'completed',
          user: {
            name: 'Medical Staff',
            role: 'EMS',
          },
          hospital: case_.originHospital ? {
            name: case_.originHospital.name,
            id: case_.originHospital.id,
          } : undefined,
          details: {
            ecgResult: case_.ecgResult,
            ecgFindings: case_.ecgFindings,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
            currentStatus: case_.currentStatus,
          },
        });
      }

      // RCC Activation
      if (case_.rccActivated) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-rcc-activation`,
          timestamp: case_.pathwayStarted || case_.createdAt,
          title: `RCC Activated - ${patientName}`,
          description: `Regional Cardiac Center activated for ${patientName} (ID: ${nationalId}) transfer to ${case_.destinationHospital?.name || 'destination hospital'}`,
          type: 'treatment',
          status: 'completed',
          user: {
            name: 'RCC Coordinator',
            role: 'RCC',
          },
          hospital: case_.destinationHospital ? {
            name: case_.destinationHospital.name,
            id: case_.destinationHospital.id,
          } : undefined,
          details: {
            rccUnit: case_.rccUnit,
            destinationHospital: case_.destinationHospital?.name,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
            currentStatus: case_.currentStatus,
          },
        });
      }

      // Treatment Selection
      if (case_.selectedTreatment) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-treatment`,
          timestamp: case_.pathwayStarted || case_.createdAt,
          title: `Treatment Selected - ${patientName}`,
          description: `${getTreatmentLabel(case_.selectedTreatment)} pathway initiated for ${patientName} (ID: ${nationalId})`,
          type: 'treatment',
          status: 'completed',
          user: {
            name: 'Cardiologist',
            role: 'CATH_LAB_USER',
          },
          hospital: case_.destinationHospital ? {
            name: case_.destinationHospital.name,
            id: case_.destinationHospital.id,
          } : undefined,
          details: {
            selectedTreatment: case_.selectedTreatment,
            pciLocation: case_.pciLocation,
            eligibleForPrimaryPci: case_.eligibleForPrimaryPci,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
            currentStatus: case_.currentStatus,
          },
        });
      }

      // Door Out Time (Transfer)
      if (case_.doorOutTime) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-transfer`,
          timestamp: case_.doorOutTime,
          title: `Patient Transfer - ${patientName}`,
          description: `${patientName} (ID: ${nationalId}) transferred from ${case_.originHospital?.name} to ${case_.destinationHospital?.name || 'destination hospital'}`,
          type: 'treatment',
          status: 'completed',
          user: {
            name: 'Transfer Team',
            role: 'EMS',
          },
          hospital: case_.originHospital ? {
            name: case_.originHospital.name,
            id: case_.originHospital.id,
          } : undefined,
          details: {
            doorOutTime: case_.doorOutTime,
            originHospital: case_.originHospital?.name,
            destinationHospital: case_.destinationHospital?.name,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
            currentStatus: case_.currentStatus,
          },
        });
      }

      // Pathway Completion
      if (case_.pathwayCompleted) {
        const patientName = case_.patient ? `${case_.patient.firstName} ${case_.patient.lastName}` : 'Unknown Patient';
        const nationalId = case_.patient?.nationalId || 'N/A';
        
        events.push({
          id: `${case_.id}-completion`,
          timestamp: case_.pathwayCompleted,
          title: `Treatment Completed - ${patientName}`,
          description: `STEMI treatment pathway successfully completed for ${patientName} (ID: ${nationalId})`,
          type: 'treatment',
          status: 'completed',
          user: {
            name: 'Medical Team',
            role: 'CATH_LAB_USER',
          },
          hospital: case_.destinationHospital ? {
            name: case_.destinationHospital.name,
            id: case_.destinationHospital.id,
          } : undefined,
          details: {
            pathwayCompleted: case_.pathwayCompleted,
            currentStatus: case_.currentStatus,
            patientId: case_.patientId,
            patientName: patientName,
            patientNationalId: nationalId,
          },
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getModeOfArrivalLabel = (mode?: string) => {
    switch (mode) {
      case 'AMBULANCE_RED_CRESCENT':
      case 'AMBULANCE':
        return 'Ambulance';
      case 'PRIVATE_CAR':
      case 'PRIVATE_VEHICLE':
        return 'Private Vehicle';
      case 'TRANSFERRED_FROM_ANOTHER_HOSPITAL':
      case 'TRANSFERRED_FROM_HOSPITAL':
        return 'Hospital Transfer';
      case 'AIR_TRANSPORT':
        return 'Air Transport';
      case 'WALK_IN':
        return 'Walk-in';
      case 'POLICE':
        return 'Police Transport';
      case 'OTHER':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getEcgResultLabel = (result?: string) => {
    switch (result) {
      case 'STEMI_ANTERIOR': return 'STEMI Anterior';
      case 'STEMI_INFERIOR': return 'STEMI Inferior';
      case 'STEMI_LATERAL': return 'STEMI Lateral';
      case 'STEMI_POSTERIOR': return 'STEMI Posterior';
      case 'NSTEMI_CHANGES': return 'NSTEMI Changes';
      case 'UNSTABLE_PATTERN': return 'Unstable Pattern';
      case 'NORMAL': return 'Normal';
      case 'PENDING': return 'Pending';
      case 'TECHNICAL_ISSUE': return 'Technical Issue';
      default: return 'Unknown';
    }
  };

  const getTreatmentLabel = (treatment?: string) => {
    switch (treatment) {
      case 'PRIMARY_PCI': return 'Primary PCI';
      case 'RESCUE_PCI': return 'Rescue PCI';
      case 'FIBRINOLYSIS': return 'Fibrinolysis';
      case 'TRANSFER_FOR_PRIMARY_PCI': return 'Transfer for Primary PCI';
      case 'MEDICAL_MANAGEMENT': return 'Medical Management';
      default: return 'Unknown';
    }
  };

  const timelineEvents = useMemo(
    () => convertStemiCasesToTimelineEvents(stemiCases),
    [stemiCases]
  );

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

    const paginationParams = {
      ...unifiedFilters,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    };

    let casesFailed = false;

    try {
      const casesResponse = await StemiService.getStemiCases(paginationParams);

      if (requestRef.current !== requestId) {
        return;
      }

      setStemiCases(casesResponse.cases);
      setTotalCases(casesResponse.total);
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
      setEditDialogOpen(false);
      setSelectedCase(null);
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
      await StemiExportService.exportToExcel();
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

  // Header actions
  const headerActions = (
    <Button
      variant="contained"
      color="primary"
      onClick={() => setCreateDialogOpen(true)}
    >
      Create STEMI Case
    </Button>
  );

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
        headerActions={headerActions}
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
            <Tab 
              label="Timeline View" 
              sx={{ 
                fontSize: '1rem', 
                fontWeight: activeTab === 2 ? 'bold' : 'normal',
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

        <TabPanel value={activeTab} index={2}>
          <TimelineView
            events={timelineEvents}
            title="STEMI Cases Timeline"
            portalType="stemi"
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
    </>
  );
};

export default StemiPortalPage;
