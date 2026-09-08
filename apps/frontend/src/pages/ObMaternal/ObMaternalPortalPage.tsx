import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Alert } from '@mui/material';
import { Assessment, Dashboard } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import ObMaternalCasesList from './components/ObMaternalCasesList';
import CreateObMaternalTransferDialog from './components/CreateObMaternalTransferDialog';
import PregnancyKpiDashboard from './components/PregnancyKpiDashboard';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import { obMaternalTransferService } from '../../services/obMaternalTransferService';
import type {
  ObMaternalTransfer,
  ObMaternalTransferStatus,
  ObMaternalKpiSummary,
} from '../../services/obMaternalTransferService';
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
      id={`ob-maternal-tabpanel-${index}`}
      aria-labelledby={`ob-maternal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

const ObMaternalPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transfers, setTransfers] = useState<ObMaternalTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [kpiSummary, setKpiSummary] = useState<ObMaternalKpiSummary | null>(null);
  const [kpiFilters, setKpiFilters] = useState<{
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await obMaternalTransferService.getAll({
        status: statusFilter ? (statusFilter as ObMaternalTransferStatus) : undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      setTransfers(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const response = await apiClient.get('/hospitals');
        setHospitals(response.data);
      } catch (err) {
        console.error('Error loading hospitals:', err);
      } finally {
        setHospitalsLoading(false);
      }
    };
    loadHospitals();
  }, []);

  useEffect(() => {
    const loadKpi = async () => {
      try {
        const data = await obMaternalTransferService.getKPISummary(kpiFilters);
        setKpiSummary(data);
      } catch (err) {
        console.error('Error loading KPI summary:', err);
        setKpiSummary(null);
      }
    };
    loadKpi();
  }, [kpiFilters.hospitalId, kpiFilters.startDate, kpiFilters.endDate]);

  const handleKpiFilterChange = async (key: string, value: string) => {
    const newFilters = { ...kpiFilters, [key]: value };
    setKpiFilters(newFilters);
    try {
      const data = await obMaternalTransferService.getKPISummary(newFilters);
      setKpiSummary(data);
    } catch (err) {
      console.error('Error updating KPI data:', err);
    }
  };

  const handleClearKpiFilters = () => {
    setKpiFilters({});
    obMaternalTransferService.getKPISummary({}).then(setKpiSummary).catch(console.error);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage OB maternal transfers', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor pregnancy performance metrics', icon: <Dashboard /> },
  ];

  const kpiCards = [
    {
      title: 'Total Transfers',
      value: total,
      icon: <Assessment />,
      color: '#9C27B0',
    },
    ...(kpiSummary
      ? [
          {
            title: 'Maternal Red',
            value: kpiSummary.maternalRedCount,
            icon: <Assessment />,
            color: '#dc2626',
          },
          {
            title: 'Maternal Orange',
            value: kpiSummary.maternalOrangeCount,
            icon: <Assessment />,
            color: '#ea580c',
          },
        ]
      : []),
  ];

  return (
    <>
      <Helmet>
        <title>OB Maternal Transfer Portal | MASAR</title>
      </Helmet>

      <PortalSkeleton
        title="OB Maternal Transfer Portal"
        subtitle="Manage obstetric maternal transfers and activation workflow"
        portalType="ob"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={fetchTransfers}
        onCreateCase={() => setCreateDialogOpen(true)}
        kpiCards={kpiCards}
      >
        {error && (
          <Box sx={{ p: 1.5, pb: 0 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 0.5,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="OB maternal portal tabs"
            sx={{ minHeight: 48 }}
          >
            <Tab
              label="Cases"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                py: 2,
                px: 3,
              }}
            />
            <Tab
              label="KPI Dashboard"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 1 ? 'bold' : 'normal',
                py: 2,
                px: 3,
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ObMaternalCasesList
            transfers={transfers}
            total={total}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(r) => {
              setRowsPerPage(r);
              setPage(0);
            }}
            onRefresh={fetchTransfers}
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => {
              setStatusFilter(v);
              setPage(0);
            }}
            onCreateClick={() => setCreateDialogOpen(true)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PregnancyKpiDashboard
            kpiSummary={kpiSummary}
            filters={kpiFilters}
            onFilterChange={handleKpiFilterChange}
            onClearFilters={handleClearKpiFilters}
            hospitals={hospitals}
            loading={hospitalsLoading}
          />
        </TabPanel>
      </PortalSkeleton>

      <CreateObMaternalTransferDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={fetchTransfers}
      />
    </>
  );
};

export default ObMaternalPortalPage;
