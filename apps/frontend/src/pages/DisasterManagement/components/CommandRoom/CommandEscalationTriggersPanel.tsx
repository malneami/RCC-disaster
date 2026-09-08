import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Warning, LocalHospital, Timeline } from '@mui/icons-material';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

interface CommandEscalationTriggersPanelProps {
  data: {
    redCasesLast10Min: number;
    activeCriticalCases: number;
    icuCapacityPercent: number;
  } | null;
  currentLevel?: string | null;
  suggestedLevel?: string | null;
  theme: ReturnType<typeof getTheme>;
}

const LEVEL_2_RED_THRESHOLD = 5;
const LEVEL_2_CRITICAL_THRESHOLD = 6;
const LEVEL_3_CRITICAL_THRESHOLD = 15;
const LEVEL_3_ICU_THRESHOLD = 10;

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  status: 'normal' | 'warning' | 'critical';
}> = ({ icon, label, value, status }) => {
  const color =
    status === 'critical' ? '#DC2626' : status === 'warning' ? '#D97706' : 'text.primary';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
      <Box sx={{ color }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
};

export const CommandEscalationTriggersPanel: React.FC<CommandEscalationTriggersPanelProps> = ({
  data,
  currentLevel,
  suggestedLevel,
  theme,
}) => {
  const d = data ?? {
    redCasesLast10Min: 0,
    activeCriticalCases: 0,
    icuCapacityPercent: 100,
  };

  const redStatus =
    d.redCasesLast10Min >= LEVEL_2_RED_THRESHOLD
      ? 'critical'
      : d.redCasesLast10Min >= LEVEL_2_RED_THRESHOLD - 2
        ? 'warning'
        : 'normal';

  const criticalStatus =
    d.activeCriticalCases >= LEVEL_3_CRITICAL_THRESHOLD
      ? 'critical'
      : d.activeCriticalCases >= LEVEL_2_CRITICAL_THRESHOLD
        ? 'warning'
        : 'normal';

  const icuStatus =
    d.icuCapacityPercent < LEVEL_3_ICU_THRESHOLD
      ? 'critical'
      : d.icuCapacityPercent < LEVEL_3_ICU_THRESHOLD + 10
        ? 'warning'
        : 'normal';

  const showConsiderBadge =
    suggestedLevel &&
    currentLevel &&
    suggestedLevel !== currentLevel &&
    (suggestedLevel === 'LEVEL_2' || suggestedLevel === 'LEVEL_3');

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Warning sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Escalation Triggers
          </Typography>
          {showConsiderBadge && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: `${theme.primary}20`,
                color: theme.primary,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              Consider {suggestedLevel === 'LEVEL_2' ? 'Level 2' : 'Level 3'}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Row
            icon={<Timeline fontSize="small" />}
            label="Red cases (last 10 min)"
            value={d.redCasesLast10Min}
            status={redStatus}
          />
          <Row
            icon={<Warning fontSize="small" />}
            label="Active critical cases"
            value={d.activeCriticalCases}
            status={criticalStatus}
          />
          <Row
            icon={<LocalHospital fontSize="small" />}
            label="ICU capacity %"
            value={`${d.icuCapacityPercent.toFixed(1)}%`}
            status={icuStatus}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
