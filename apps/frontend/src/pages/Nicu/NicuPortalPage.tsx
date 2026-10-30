import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Alert, Button, Typography, Stack } from '@mui/material';
import { Add, Dashboard, ListAlt } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import NeonatalCasesList from './components/NeonatalCasesList';
import NicuKpiDashboard from './components/NicuKpiDashboard';
import CreateNeonatalTransferDialog from './components/CreateNeonatalTransferDialog';
import {
  neonatalTransferService,
  type NeonatalTransfer,
  type NicuKpiSummary,
} from '../../services/neonatalTransferService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const NicuPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transfers, setTransfers] = useState<NeonatalTransfer[]>([]);
  const [kpi, setKpi] = useState<NicuKpiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, summary] = await Promise.all([
        neonatalTransferService.getAll({ limit: 100 }),
        neonatalTransferService.getKPISummary(),
      ]);
      setTransfers(list.data);
      setKpi(summary);
    } catch (e) {
      setError('Failed to load NICU transfers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Box sx={{ p: 3 }}>
      <Helmet>
        <title>NICU Pathway Portal · MASAR</title>
      </Helmet>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            NICU Pathway Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            بوابة مسار حديثي الولادة — تنسيق النقل وإدارة سعة الحاضنات
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          New Transfer
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab icon={<ListAlt />} iconPosition="start" label="Transfers" />
        <Tab icon={<Dashboard />} iconPosition="start" label="KPI Dashboard" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <NeonatalCasesList transfers={transfers} loading={loading} />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <NicuKpiDashboard summary={kpi} loading={loading} />
      </TabPanel>

      <CreateNeonatalTransferDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadData}
      />
    </Box>
  );
};

export default NicuPortalPage;
