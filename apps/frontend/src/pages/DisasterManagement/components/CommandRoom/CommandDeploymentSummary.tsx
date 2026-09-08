import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { LocalShipping, Place, AddCircle, DirectionsCar, LocalHospital } from '@mui/icons-material';

const DEPLOYMENT_STATUS_LABELS: Record<string, string> = {
  EN_ROUTE: 'En-route',
  AT_SCENE: 'At scene',
  PATIENT_LOADED: 'Loaded',
  EN_ROUTE_TO_HOSPITAL: 'To hospital',
  ARRIVED: 'Arrived',
};

const DEPLOYMENT_ICONS: Record<string, React.ReactNode> = {
  EN_ROUTE: <LocalShipping fontSize="small" />,
  AT_SCENE: <Place fontSize="small" />,
  PATIENT_LOADED: <AddCircle fontSize="small" />,
  EN_ROUTE_TO_HOSPITAL: <DirectionsCar fontSize="small" />,
  ARRIVED: <LocalHospital fontSize="small" />,
};

interface Assignment {
  id: string;
  status: string;
}

interface CommandDeploymentSummaryProps {
  assignments?: Assignment[];
  theme: { primary: string; borderColor: string };
}

export const CommandDeploymentSummary: React.FC<CommandDeploymentSummaryProps> = ({
  assignments = [],
  theme,
}) => {
  const byStatus = assignments.reduce<Record<string, number>>((acc, a) => {
    const s = (a.status || 'EN_ROUTE').toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statuses = [
    'EN_ROUTE',
    'AT_SCENE',
    'PATIENT_LOADED',
    'EN_ROUTE_TO_HOSPITAL',
    'ARRIVED',
  ] as const;

  const total = assignments.length;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'white',
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.primary }}>
        Deployment summary
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {total === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No ambulances assigned
          </Typography>
        ) : (
          statuses.map((s) => {
            const count = byStatus[s] || 0;
            if (count === 0) return null;
            return (
              <Chip
                key={s}
                icon={DEPLOYMENT_ICONS[s] || undefined}
                label={`${DEPLOYMENT_STATUS_LABELS[s] || s}: ${count}`}
                size="small"
                sx={{
                  bgcolor: `${theme.primary}15`,
                  color: theme.primary,
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            );
          })
        )}
      </Box>
    </Box>
  );
};
