import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { LocalHospital, Bloodtype, Build, ChildCare } from '@mui/icons-material';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

interface CommandHospitalCapacityPanelProps {
  data: {
    icuAvailable: number;
    icuTotal: number;
    nicuAvailable: number;
    nicuTotal: number;
    orReadiness: string;
    bloodBankStatus: string;
  } | null;
  theme: ReturnType<typeof getTheme>;
}

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
    <Box sx={{ color: 'inherit' }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

const EMPTY_HOSPITAL = {
  icuAvailable: 0,
  icuTotal: 0,
  nicuAvailable: 0,
  nicuTotal: 0,
  orReadiness: 'N/A',
  bloodBankStatus: 'N/A',
};

export const CommandHospitalCapacityPanel: React.FC<CommandHospitalCapacityPanelProps> = ({ data, theme }) => {
  const d = data ?? EMPTY_HOSPITAL;

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalHospital sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Hospital Capacity
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Row
            icon={<LocalHospital fontSize="small" />}
            label="ICU beds available"
            value={`${d.icuAvailable} / ${d.icuTotal}`}
          />
          <Row
            icon={<ChildCare fontSize="small" />}
            label="NICU capacity"
            value={`${d.nicuAvailable} / ${d.nicuTotal}`}
          />
          <Row
            icon={<Build fontSize="small" />}
            label="OR readiness"
            value={d.orReadiness || 'N/A'}
          />
          <Row
            icon={<Bloodtype fontSize="small" />}
            label="Blood bank status"
            value={d.bloodBankStatus || 'N/A'}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
