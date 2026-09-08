import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

interface CommandEMSPanelProps {
  data: {
    dispatched: number;
    onScene: number;
    enRoute: number;
    delayedUnits: number;
  } | null;
  theme: ReturnType<typeof getTheme>;
}

const Row: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body1"
      fontWeight={600}
      sx={highlight ? { color: '#DC2626' } : {}}
    >
      {value}
    </Typography>
  </Box>
);

const EMPTY_EMS = { dispatched: 0, onScene: 0, enRoute: 0, delayedUnits: 0 };

export const CommandEMSPanel: React.FC<CommandEMSPanelProps> = ({ data, theme }) => {
  const d = data ?? EMPTY_EMS;

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalShipping sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            EMS Panel
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Row label="Ambulances dispatched" value={d.dispatched} />
          <Row label="On scene" value={d.onScene} />
          <Row label="En route" value={d.enRoute} />
          <Row label="Delayed units" value={d.delayedUnits} highlight={d.delayedUnits > 0} />
        </Box>
      </CardContent>
    </Card>
  );
};
