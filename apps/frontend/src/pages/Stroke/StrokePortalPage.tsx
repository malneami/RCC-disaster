import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Tooltip } from '@mui/material';
import { Add, Assessment, Timeline, Dashboard, FileDownload } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import StrokeCasesList from './components/StrokeCasesList';
import StrokeCasesCards from './components/StrokeCasesCards';
import StrokeKPIDashboard from './components/StrokeKPIDashboardMain';
import CreateStrokeCaseDialog from './components/CreateStrokeCaseDialog';
import StrokeCaseDetailsDialog from './components/StrokeCaseDetailsDialog';
import EditStrokeCaseDialog from './components/EditStrokeCaseDialog';
import StrokeOutcomeForm from './components/StrokeOutcomeForm';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import TimelineView, { TimelineEvent } from '../../components/Common/TimelineView';
import { StrokeService, StrokeCase, StrokeKPISummary } from '../../services/strokeService';
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
  const [kpiSummary, setKpiSummary] = useState<StrokeKPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StrokeCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [outcomeFormDialogOpen, setOutcomeFormDialogOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage stroke cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
    { label: 'Timeline View', description: 'Track case progression', icon: <Timeline /> },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const convertStrokeCasesToTimelineEvents = (cases: StrokeCase[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    cases.forEach(case_ => {
      // Patient arrival
      if (case_.createdAt) {
        events.push({
          id: `${case_.id}-arrival`,
          timestamp: case_.createdAt,
          title: `Patient Arrival - ${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
          description: `Patient arrived at ${case_.originHospital?.name || 'hospital'} with ${case_.strokeType.toLowerCase()} stroke`,
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
            strokeType: case_.strokeType,
            currentStatus: case_.currentStatus,
            presentingSymptoms: case_.presentingSymptoms,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Assessment
      if (case_.nihssBaseline) {
        events.push({
          id: `${case_.id}-assessment`,
          timestamp: case_.createdAt,
          title: `NIHSS Assessment - Score: ${case_.nihssBaseline}`,
          description: `Initial neurological assessment completed`,
          type: 'assessment',
          status: 'completed',
          details: {
            nihssScore: case_.nihssBaseline,
            strokeSeverity: case_.strokeSeverity,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Treatment
      if (case_.selectedTreatment) {
        events.push({
          id: `${case_.id}-treatment`,
          timestamp: case_.createdAt,
          title: `Treatment Initiated - ${case_.selectedTreatment}`,
          description: `Stroke treatment protocol initiated`,
          type: 'treatment',
          status: case_.currentStatus === 'DISCHARGED' ? 'completed' : 'in-progress',
          details: {
            treatment: case_.selectedTreatment,
            doorToNeedleMinutes: case_.doorToNeedleMinutes,
            doorToCtScanMinutes: case_.doorToCtScanMinutes,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Discharge/Transfer
      if (case_.currentStatus === 'DISCHARGED') {
        events.push({
          id: `${case_.id}-discharge`,
          timestamp: case_.updatedAt || case_.createdAt,
          title: `Case Discharged`,
          description: `Patient discharged`,
          type: 'discharge',
          status: 'completed',
          details: {
            finalStatus: case_.currentStatus,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesData, kpiData] = await Promise.all([
        StrokeService.getStrokeCases(),
        StrokeService.getKPISummary()
      ]);

      setStrokeCases(casesData);
      setKpiSummary(kpiData);
      
      // Convert stroke cases to timeline events
      const events = convertStrokeCasesToTimelineEvents(casesData);
      setTimelineEvents(events);
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
      await StrokeExportService.exportToExcel();
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
            <StrokeCasesList
              cases={strokeCases}
              onUpdateCase={handleUpdateCase}
              onCreateCase={() => setCreateDialogOpen(true)}
              onDeleteCase={handleDeleteCase}
              onAddCaseNote={handleAddCaseNote}
              isAdmin={isAdmin}
              onViewModeChange={setViewMode}
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

        <TabPanel value={activeTab} index={2}>
          <TimelineView
            events={timelineEvents}
            portalType="stroke"
            title="Stroke Cases Timeline"
            showSearch={true}
            onSearch={(query, filter) => {
              // TODO: Implement timeline search functionality
              console.log('Timeline search:', query, filter);
            }}
            loading={loading}
            error={error || undefined}
          />
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
    </>
  );
};

export default StrokePortalPage;
