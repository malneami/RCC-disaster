import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { TrendingUp, Schedule, Warning, HourglassEmpty } from '@mui/icons-material';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

interface CommandLiveKPIsPanelProps {
  data: {
    activationToDispatchMinutes: number | null;
    dispatchToArrivalMinutes: number | null;
    redCasesPending: number;
    bedAllocationDelayMinutes: number | null;
  } | null;
  theme: ReturnType<typeof getTheme>;
}

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string; iconColor: string }> = ({ icon, label, value, iconColor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
    <Box sx={{ color: iconColor }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

const EMPTY_KPIS = {
  activationToDispatchMinutes: null as number | null,
  dispatchToArrivalMinutes: null as number | null,
  redCasesPending: 0,
  bedAllocationDelayMinutes: null as number | null,
};

export const CommandLiveKPIsPanel: React.FC<CommandLiveKPIsPanelProps> = ({ data, theme }) => {
  const d = data ?? EMPTY_KPIS;
  const formatMinutes = (m: number | null) => (m != null ? `${Math.round(m)} min` : '—');

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Live KPIs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Row
            icon={<Schedule fontSize="small" />}
            label="Activation → Dispatch"
            value={formatMinutes(d.activationToDispatchMinutes)}
            iconColor={theme.primary}
          />
          <Row
            icon={<Schedule fontSize="small" />}
            label="Dispatch → Arrival"
            value={formatMinutes(d.dispatchToArrivalMinutes)}
            iconColor={theme.primary}
          />
          <Row
            icon={<Warning fontSize="small" />}
            label="Red cases pending"
            value={String(d.redCasesPending)}
            iconColor={theme.primary}
          />
          <Row
            icon={<HourglassEmpty fontSize="small" />}
            label="Bed allocation delay"
            value={formatMinutes(d.bedAllocationDelayMinutes)}
            iconColor={theme.primary}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
