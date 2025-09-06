import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faChartLine, faClock, faUserMd, faHospital } from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';

import StrokeCasesList from './components/StrokeCasesList';
import StrokeKPIDashboard from './components/StrokeKPIDashboardMain';
import StrokeTimelineView from './components/StrokeTimelineView';
import CreateStrokeCaseDialog from './components/CreateStrokeCaseDialog';
import { StrokeService, StrokeCase, StrokeKPISummary } from '../../services/strokeService';
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
  const [strokeCases, setStrokeCases] = useState<StrokeCase[]>([]);
  const [kpiSummary, setKpiSummary] = useState<StrokeKPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (err) {
      setError('Failed to load stroke portal data');
      console.error('Error loading stroke portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Stroke Portal - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon 
            icon={faBrain} 
            style={{ marginRight: '16px', color: '#ed6c02', fontSize: '32px' }} 
          />
          <Box>
            <Typography variant="h4" component="h1">
              Stroke Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive stroke care coordination and time-sensitive protocols
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faUserMd} 
                    style={{ marginRight: '12px', color: '#1976d2', fontSize: '24px' }} 
                  />
                  <Box>
                    <Typography variant="h6">
                      {strokeCases.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Cases
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faClock} 
                    style={{ marginRight: '12px', color: '#ed6c02', fontSize: '24px' }} 
                  />
                  <Box>
                    <Typography variant="h6">
                      {kpiSummary?.averageTimings.doorToImaging ? 
                        Math.round(kpiSummary.averageTimings.doorToImaging) : 'N/A'} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Door to Imaging
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faChartLine} 
                    style={{ marginRight: '12px', color: '#2e7d32', fontSize: '24px' }} 
                  />
                  <Box>
                    <Typography variant="h6">
                      {kpiSummary?.kpiPerformance.kpi1.percentage ? 
                        Math.round(kpiSummary.kpiPerformance.kpi1.percentage) : 'N/A'}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      KPI 1 Performance
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faHospital} 
                    style={{ marginRight: '12px', color: '#d32f2f', fontSize: '24px' }} 
                  />
                  <Box>
                    <Typography variant="h6">
                      {kpiSummary?.outcomes.successRate ? 
                        Math.round(kpiSummary.outcomes.successRate) : 'N/A'}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="stroke portal tabs">
              <Tab label="Cases" />
              <Tab label="KPI Dashboard" />
              <Tab label="Timeline View" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <StrokeCasesList
              cases={strokeCases}
              onUpdateCase={handleUpdateCase}
              onCreateCase={() => setCreateDialogOpen(true)}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <StrokeKPIDashboard kpiSummary={kpiSummary} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <StrokeTimelineView cases={strokeCases} />
          </TabPanel>
        </Card>

        {/* Create Case Dialog */}
        <CreateStrokeCaseDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateCase}
        />
      </Box>
    </>
  );
};

export default StrokePortalPage;
