import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress, Tabs, Tab } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import {
  neurosurgicalService,
  NeurosurgicalCase,
  NeurosurgicalKPISummary,
  UpdateNeurosurgicalCaseData,
} from '../../services/neurosurgicalService';
import { hospitalService } from '../../services/hospitalService';
import NeurosurgicalCasesList from './components/NeurosurgicalCasesList';
import NeurosurgicalKPIDashboard from './components/NeurosurgicalKPIDashboard';
import NeurosurgicalCaseDialog from './components/NeurosurgicalCaseDialog';
import NeurosurgicalOutcomeForm from './components/NeurosurgicalOutcomeForm';

function TabPanel({
  children,
  value,
  index,
}: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const NeurosurgicalPortalPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [cases, setCases] = useState<NeurosurgicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiSummary, setKpiSummary] = useState<NeurosurgicalKPISummary | null>(null);
  const [selected, setSelected] = useState<NeurosurgicalCase | null>(null);
  const [outcomeCase, setOutcomeCase] = useState<NeurosurgicalCase | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateNeurosurgicalCaseData>({});
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [kpiFilters, setKpiFilters] = useState<{
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'Neurosurgical pathway cases' },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics' },
  ];

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await neurosurgicalService.list({ limit: 100 });
      setCases(result.items || []);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to load cases', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const loadKpiSummary = useCallback(async () => {
    setKpiLoading(true);
    try {
      const summary = await neurosurgicalService.getKpiSummary(kpiFilters);
      setKpiSummary(summary);
    } catch (err: any) {
      console.error('Failed to load KPI summary', err);
      enqueueSnackbar(err?.response?.data?.message || 'Failed to load KPIs', {
        variant: 'error',
      });
    } finally {
      setKpiLoading(false);
    }
  }, [kpiFilters, enqueueSnackbar]);

  const loadHospitals = useCallback(async () => {
    try {
      const list = await hospitalService.getAllHospitals();
      const items = Array.isArray(list)
        ? list
        : ((list as { data?: Array<{ id: string; name: string }> })?.data ?? []);
      setHospitals(items.map((h) => ({ id: h.id, name: h.name })));
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadCases();
    loadHospitals();
  }, [loadCases, loadHospitals]);

  useEffect(() => {
    loadKpiSummary();
  }, [loadKpiSummary]);

  const refreshAll = async () => {
    await Promise.all([loadCases(), loadKpiSummary()]);
  };

  const openCase = async (id: string) => {
    try {
      const detail = await neurosurgicalService.getById(id);
      setSelected(detail);
      setForm({
        triggerReason: detail.triggerReason,
        triggerReasonOther: detail.triggerReasonOther || undefined,
        gcs: detail.gcs ?? undefined,
        gcsTrend: detail.gcsTrend || undefined,
        pupils: detail.pupils || undefined,
        newFocalDeficit: detail.newFocalDeficit,
        seizure: detail.seizure,
        intubated: detail.intubated,
        hemodynamicInstability: detail.hemodynamicInstability,
        anticoagulantUse: detail.anticoagulantUse,
        mechanismOfInjury: detail.mechanismOfInjury || undefined,
        severity: detail.severity,
        severityOverrideReason: detail.severityOverrideReason || undefined,
        doorTime: detail.doorTime || undefined,
        doorOutTime: detail.doorOutTime || undefined,
        rccActivationTime: detail.rccActivationTime || undefined,
        ctLocation: detail.ctLocation || undefined,
        ctScanStartTime: detail.ctScanStartTime || undefined,
        ctReportFinalTime: detail.ctReportFinalTime || undefined,
        neurosurgeonNotifiedAt: detail.neurosurgeonNotifiedAt || undefined,
        neurosurgeonConnectedAt: detail.neurosurgeonConnectedAt || undefined,
        definitiveCareReachedAt: detail.definitiveCareReachedAt || undefined,
        notes: detail.notes || undefined,
      });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to load case', {
        variant: 'error',
      });
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Strip outcome/disposition fields — filled only via Outcome form
      const {
        definitiveDisposition: _d,
        definitiveTreatment: _t,
        neurologicalOutcome: _o,
        deteriorationDuringTransfer: _a,
        cardiacArrestDuringTransfer: _b,
        unplannedIntubation: _c,
        delayedIntervention: _e,
        wrongDestination: _f,
        repeatTransferRequired: _g,
        ...caseData
      } = form;
      const updated = await neurosurgicalService.update(selected.id, caseData);
      setSelected(updated);
      enqueueSnackbar('Case updated', { variant: 'success' });
      await refreshAll();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Update failed', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setKpiFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setKpiFilters({});
  };

  return (
    <>
      <Helmet>
        <title>Neurosurgical Pathway Portal | MASAR</title>
      </Helmet>
      <PortalSkeleton
        title="Neurosurgical Pathway Portal"
        subtitle="Protect the brain — ticket to definitive neurosurgical care"
        portalType="trauma"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={refreshAll}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
            <Tab label="Cases" />
            <Tab label="KPI Dashboard" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <NeurosurgicalCasesList
              cases={cases}
              onOpen={openCase}
              onOpenOutcome={setOutcomeCase}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {kpiLoading && !kpiSummary ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <NeurosurgicalKPIDashboard
              kpiSummary={kpiSummary}
              filters={kpiFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              hospitals={hospitals}
              loading={kpiLoading}
              portalType="trauma"
            />
          )}
        </TabPanel>
      </PortalSkeleton>

      <NeurosurgicalCaseDialog
        selected={selected}
        form={form}
        setForm={setForm}
        saving={saving}
        onDismiss={() => setSelected(null)}
        onSave={handleSave}
      />

      <NeurosurgicalOutcomeForm
        open={!!outcomeCase}
        neuroCase={outcomeCase}
        onClose={() => setOutcomeCase(null)}
        onSuccess={async (updated) => {
          setOutcomeCase(null);
          if (selected?.id === updated.id) setSelected(updated);
          await refreshAll();
        }}
      />
    </>
  );
};

export default NeurosurgicalPortalPage;
