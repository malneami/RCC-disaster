import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Button, Tooltip } from '@mui/material';
import { Add, Assessment, Timeline, Dashboard, Warning, TransferWithinAStation, Schedule, FileDownload } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import TraumaCasesList from './components/TraumaCasesList';
import TraumaCasesCards from './components/TraumaCasesCards';
import TraumaKPIDashboard from './components/TraumaKPIDashboardMain';
import CreateTraumaCaseDialog from './components/CreateTraumaCaseDialog';
import ViewTraumaCaseDialog from './components/ViewTraumaCaseDialog';
import EditTraumaCaseDialog from './components/EditTraumaCaseDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import TimelineView, { TimelineEvent } from '../../components/Common/TimelineView';
import { TraumaService, TraumaCase } from '../../services/traumaService';
import { TraumaKPIsResponse } from './types/traumaTypes';
import { useAuth } from '../../contexts/AuthContext';
import { TraumaExportService } from './services/traumaExportService';

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
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage trauma cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
    { label: 'Timeline View', description: 'Track case progression', icon: <Timeline /> },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const convertTraumaCasesToTimelineEvents = (cases: TraumaCase[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    cases.forEach(case_ => {
      // Patient arrival
      if (case_.createdAt) {
        events.push({
          id: `${case_.id}-arrival`,
          timestamp: case_.createdAt,
          title: `Patient Arrival - ${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
          description: `Patient arrived at ${case_.originHospital?.name || 'hospital'} via ${TraumaService.getModeOfArrivalLabel(case_.modeOfArrival)}`,
          type: 'arrival',
          status: 'completed',
          user: {
            name: case_.createdBy?.firstName ? `${case_.createdBy.firstName} ${case_.createdBy.lastName}` : 'System',
            role: 'Data Collector',
          },
          hospital: case_.originHospital ? {
            name: case_.originHospital.name,
            id: case_.originHospital.id,
          } : undefined,
          details: {
            modeOfArrival: case_.modeOfArrival,
            mechanismOfInjury: case_.mechanismOfInjury,
            chiefComplaint: case_.chiefComplaint,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Assessment
      if (case_.glasgowComaScale) {
        events.push({
          id: `${case_.id}-assessment`,
          timestamp: case_.createdAt,
          title: `Glasgow Coma Scale Assessment - Score: ${case_.glasgowComaScale}`,
          description: `Initial neurological assessment completed`,
          type: 'assessment',
          status: 'completed',
          details: {
            glasgowComaScale: case_.glasgowComaScale,
            criticalCase: case_.criticalCase,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Treatment/Disposition
      if (case_.edDisposition) {
        events.push({
          id: `${case_.id}-disposition`,
          timestamp: case_.updatedAt,
          title: `Disposition - ${TraumaService.getDispositionLabel(case_.edDisposition)}`,
          description: `Patient disposition determined`,
          type: 'treatment',
          status: 'completed',
          details: {
            disposition: case_.edDisposition,
            transferCase: case_.transferCase,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesData, kpiData] = await Promise.all([
        TraumaService.getTraumaCases(),
        TraumaService.getKPISummary()
      ]);

      setTraumaCases(casesData.cases);
      setKpiSummary(kpiData);
      setTimelineEvents(convertTraumaCasesToTimelineEvents(casesData.cases));
    } catch (err) {
      console.error('Error loading trauma portal data:', err);
      setError('Failed to load trauma portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateCase = async (data: any) => {
    try {
      await TraumaService.createTraumaCase(data);
      await loadData(); // Refresh data
      setCreateDialogOpen(false);
    } catch (err) {
      console.error('Error creating trauma case:', err);
      throw err;
    }
  };


  const handleDeleteCase = async (id: string) => {
    try {
      await TraumaService.deleteTraumaCase(id);
      setTraumaCases(prev => prev.filter(case_ => case_.id !== id));
      // Refresh KPI data
      const updatedKpi = await TraumaService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error deleting trauma case:', err);
      throw err;
    }
  };

  const handleUpdateCase = async (id: string, data: any): Promise<void> => {
    try {
      const updatedCase = await TraumaService.updateTraumaCase(id, data);
      setTraumaCases(prev => prev.map(case_ => case_.id === id ? updatedCase : case_));
      // Refresh KPI data
      const updatedKpi = await TraumaService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error updating trauma case:', err);
      throw err;
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      await TraumaExportService.exportToExcel();
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

  // Header actions
  const headerActions = (
    <Button
      variant="contained"
      color="primary"
      onClick={() => setCreateDialogOpen(true)}
    >
      Create Trauma Case
    </Button>
  );

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
        headerActions={headerActions}
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

        <TabPanel value={activeTab} index={0}>
          {viewMode === 'table' ? (
            <TraumaCasesList
              cases={traumaCases}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              isAdmin={isAdmin}
              onViewModeChange={setViewMode}
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
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TraumaKPIDashboard kpiSummary={kpiSummary} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TimelineView
            events={timelineEvents}
            title="Trauma Cases Timeline"
            portalType="trauma"
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
            <Fab
              color="secondary"
              aria-label="export to excel"
              onClick={handleExportToExcel}
              disabled={exportLoading}
              sx={{ width: 56, height: 56 }}
            >
              {exportLoading ? <CircularProgress size={24} color="inherit" /> : <FileDownload />}
            </Fab>
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
