import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import {
  Warning as ActiveCasesIcon,
  LocalShipping as AmbulancesIcon,
  LocalHospital as ICUBedsIcon,
  Bloodtype as BloodBankIcon,
  ChildCare as NICUIcon,
  Business as HospitalsIcon,
  Schedule as ResponseTimeIcon,
} from '@mui/icons-material';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import { emsService } from '../../../EMS/services/emsService';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const getAvailabilityPercentage = (h: Hospital): number => {
  const total =
    (h.icuBeds || 0) +
    (h.picuBeds || 0) +
    (h.maleBeds || 0) +
    (h.femaleBeds || 0) +
    (h.pediatricBeds || 0) +
    (h.standardBeds || 0) +
    (h.nicuBeds || 0);
  const available =
    (h.icuBedsAvailable || 0) +
    (h.picuBedsAvailable || 0) +
    (h.maleBedsAvailable || 0) +
    (h.femaleBedsAvailable || 0) +
    (h.pediatricBedsAvailable || 0) +
    (h.standardBedsAvailable || 0) +
    (h.nicuBedsAvailable || 0);
  if (total <= 0) return 100;
  return Math.round((available / total) * 100);
};

interface CommandDashboardLivePanelsProps {
  theme: ReturnType<typeof getTheme>;
  activeCasesCount: number;
  ambulancesInField: number;
}

const PanelCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  loading?: boolean;
  theme: ReturnType<typeof getTheme>;
}> = ({ icon, label, value, subValue, loading, theme }) => (
  <Card
    sx={{
      border: `1px solid ${theme.borderColor}`,
      borderRadius: 2,
      flex: 1,
      minWidth: { xs: '100%', sm: 140 },
      maxWidth: { sm: 200 },
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: theme.primary, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton variant="text" width={60} height={32} />
      ) : (
        <>
          <Typography variant="h5" fontWeight={700} sx={{ color: theme.primary }}>
            {value}
          </Typography>
          {subValue && (
            <Typography variant="caption" color="text.secondary">
              {subValue}
            </Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export const CommandDashboardLivePanels: React.FC<CommandDashboardLivePanelsProps> = ({
  theme,
  activeCasesCount,
  ambulancesInField,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emsSummary, setEmsSummary] = useState<{
    averageResponseTime?: number;
    activeAssignments?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [hospitalsData, emsData] = await Promise.all([
          hospitalService.getAllHospitals(),
          emsService.getDashboardData(),
        ]);
        if (!cancelled) {
          setHospitals(hospitalsData);
          setEmsSummary(emsData?.summary ?? null);
        }
      } catch {
        if (!cancelled) {
          setHospitals([]);
          setEmsSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const totalICUBeds = hospitals.reduce((s, h) => s + (h.icuBeds || 0), 0);
  const availableICUBeds = hospitals.reduce((s, h) => s + (h.icuBedsAvailable || 0), 0);
  const totalNICUBeds = hospitals.reduce((s, h) => s + (h.nicuBeds || 0), 0);
  const availableNICUBeds = hospitals.reduce((s, h) => s + (h.nicuBedsAvailable || 0), 0);

  const receivingStatus = hospitals.reduce(
    (acc, h) => {
      const pct = getAvailabilityPercentage(h);
      if (pct <= 15) acc.critical++;
      else if (pct <= 35) acc.warning++;
      else acc.ok++;
      return acc;
    },
    { ok: 0, warning: 0, critical: 0 }
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: 'white',
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ width: '100%', color: theme.primary, mb: 0.5 }}>
        Live Panels
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <PanelCard
          icon={<ActiveCasesIcon fontSize="small" />}
          label="Active Cases"
          value={activeCasesCount}
          loading={false}
          theme={theme}
        />
        <PanelCard
          icon={<AmbulancesIcon fontSize="small" />}
          label="Ambulances in Field"
          value={ambulancesInField}
          loading={false}
          theme={theme}
        />
        <PanelCard
          icon={<ICUBedsIcon fontSize="small" />}
          label="Available ICU Beds"
          value={loading ? '—' : `${availableICUBeds} / ${totalICUBeds}`}
          loading={loading}
          theme={theme}
        />
        <PanelCard
          icon={<BloodBankIcon fontSize="small" />}
          label="Blood Bank Status"
          value="N/A"
          subValue="Data not integrated"
          loading={false}
          theme={theme}
        />
        <PanelCard
          icon={<NICUIcon fontSize="small" />}
          label="NICU Capacity"
          value={loading ? '—' : `${availableNICUBeds} / ${totalNICUBeds}`}
          loading={loading}
          theme={theme}
        />
        <PanelCard
          icon={<HospitalsIcon fontSize="small" />}
          label="Receiving Hospitals"
          value={
            loading
              ? '—'
              : `${receivingStatus.ok} OK / ${receivingStatus.warning} Warn / ${receivingStatus.critical} Crit`
          }
          loading={loading}
          theme={theme}
        />
        <PanelCard
          icon={<ResponseTimeIcon fontSize="small" />}
          label="Avg Response Time"
          value={
            loading || emsSummary?.averageResponseTime == null
              ? '—'
              : `${Math.round(emsSummary.averageResponseTime)} min`
          }
          loading={loading}
          theme={theme}
        />
      </Box>
    </Box>
  );
};
