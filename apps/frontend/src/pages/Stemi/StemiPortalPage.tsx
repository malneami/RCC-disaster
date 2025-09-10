import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Fab, Button } from '@mui/material';
import { Add, Assessment, Timeline, Dashboard, Warning, Schedule } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import StemiCasesList from './components/StemiCasesList';
import StemiKPIDashboard from './components/StemiKPIDashboard';
import CreateStemiCaseDialog from './components/CreateStemiCaseDialog';
import EditStemiCaseDialog from './components/EditStemiCaseDialog';
import ViewStemiCaseDialog from './components/ViewStemiCaseDialog';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import { StemiService, StemiCase, StemiKpiResponse, StemiFilterParams } from './services/stemiService';
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
  const [stemiCases, setStemiCases] = useState<StemiCase[]>([]);
  const [kpiSummary, setKpiSummary] = useState<StemiKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StemiCase | null>(null);
  const [filters, setFilters] = useState<StemiFilterParams>({});

  // const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesResponse, kpiResponse] = await Promise.all([
        StemiService.getStemiCases(filters),
        StemiService.getKpiSummary(),
      ]);

      setStemiCases(casesResponse.cases);
      setKpiSummary(kpiResponse);
    } catch (err: any) {
      console.error('Error loading STEMI data:', err);
      setError(err.response?.data?.message || 'Failed to load STEMI data');
    } finally {
      setLoading(false);
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };


  if (loading) {
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
      Create STEMI Case
    </Button>
  );

  // KPI Cards for the portal skeleton
  const kpiCards = [
    {
      title: 'Total Cases',
      value: kpiSummary?.totalCases || 0,
      color: '#388e3c',
      icon: <Assessment />,
    },
    {
      title: 'Cases This Month',
      value: kpiSummary?.casesThisMonth || 0,
      color: '#1976d2',
      icon: <Schedule />,
    },
    {
      title: 'Cases This Week',
      value: kpiSummary?.casesThisWeek || 0,
      color: '#ed6c02',
      icon: <Timeline />,
    },
    {
      title: 'Avg Door-to-Balloon',
      value: kpiSummary?.averageDoorToBalloonTime ? `${Math.round(kpiSummary.averageDoorToBalloonTime)} min` : 'N/A',
      color: '#2e7d32',
      icon: <Schedule />,
    },
    {
      title: 'Mortality Rate',
      value: kpiSummary?.kpi9?.percentage !== undefined ? `${kpiSummary.kpi9.percentage.toFixed(1)}%` : 'N/A',
      color: '#d32f2f',
      icon: <Warning />,
    },
  ];

  // Portal steps
  const portalSteps: PortalStep[] = [
    {
      label: 'Cases',
      description: 'Manage STEMI cases',
      icon: <Assessment />,
    },
    {
      label: 'KPI Dashboard',
      description: 'Monitor performance metrics',
      icon: <Dashboard />,
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
        onRefresh={loadData}
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
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <StemiCasesList
            cases={stemiCases}
            loading={loading}
            onEditCase={handleEditCase}
            onViewCase={handleViewCase}
            onDeleteCase={handleDeleteCase}
            onRefresh={loadData}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StemiKPIDashboard kpiSummary={kpiSummary} />
        </TabPanel>
      </PortalSkeleton>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create stemi case"
        onClick={() => setCreateDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>

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
    </>
  );
};

export default StemiPortalPage;
