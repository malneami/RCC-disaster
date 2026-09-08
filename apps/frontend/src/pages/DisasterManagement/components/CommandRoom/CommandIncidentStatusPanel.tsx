import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { getIncidentTypeLabel } from '../../../../services/disasterService';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const ESCALATION_LABELS: Record<string, string> = {
  LEVEL_1: 'Level 1 – Localized',
  LEVEL_2: 'Level 2 – Multi-Hospital',
  LEVEL_3: 'Level 3 – Regional Disaster',
};

function formatTimeSince(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.floor(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface CommandIncidentStatusPanelProps {
  data: {
    incidentType: string;
    escalationLevel: string | null;
    activatedAt: string | null;
    timeSinceActivationMinutes: number;
    estimatedCasualties: { green: number; yellow: number; red: number; black: number; total: number };
    affectedPathways: string[];
  } | null;
  theme: ReturnType<typeof getTheme>;
}

export const CommandIncidentStatusPanel: React.FC<CommandIncidentStatusPanelProps> = ({ data, theme }) => {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    if (!data?.activatedAt || data?.timeSinceActivationMinutes == null) {
      setTimeDisplay('—');
      return;
    }
    let minutes = data.timeSinceActivationMinutes;
    const update = () => {
      setTimeDisplay(formatTimeSince(minutes));
      minutes += 1 / 60;
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [data?.activatedAt, data?.timeSinceActivationMinutes]);

  const { incidentType, escalationLevel, estimatedCasualties, affectedPathways } = data ?? {};

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Warning sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Incident Status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Type:
            </Typography>
            <Chip
              label={incidentType ? getIncidentTypeLabel(incidentType) : '—'}
              size="small"
              sx={{ bgcolor: `${theme.primary}15`, color: theme.primary }}
            />
            {escalationLevel && (
              <Chip
                label={ESCALATION_LABELS[escalationLevel] || escalationLevel}
                size="small"
                sx={{ bgcolor: `${theme.primary}20`, color: theme.primary, fontWeight: 600 }}
              />
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Time since activation
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {timeDisplay}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Estimated casualties
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(estimatedCasualties?.green ?? 0) > 0 && (
                <Chip label={`G: ${estimatedCasualties?.green ?? 0}`} size="small" sx={{ bgcolor: '#05966920', color: '#059669' }} />
              )}
              {(estimatedCasualties?.yellow ?? 0) > 0 && (
                <Chip label={`Y: ${estimatedCasualties?.yellow ?? 0}`} size="small" sx={{ bgcolor: '#D9770620', color: '#D97706' }} />
              )}
              {(estimatedCasualties?.red ?? 0) > 0 && (
                <Chip label={`R: ${estimatedCasualties?.red ?? 0}`} size="small" sx={{ bgcolor: '#DC262620', color: '#DC2626' }} />
              )}
              {(estimatedCasualties?.black ?? 0) > 0 && (
                <Chip label={`B: ${estimatedCasualties?.black ?? 0}`} size="small" sx={{ bgcolor: '#37415120', color: '#374151' }} />
              )}
              {(!estimatedCasualties || (estimatedCasualties.total ?? 0) === 0) && (
                <Typography variant="body2" color="text.secondary">No estimates</Typography>
              )}
            </Box>
          </Box>
          {affectedPathways && affectedPathways.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Affected pathways
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {affectedPathways.map((p) => (
                  <Chip key={p} label={p} size="small" variant="outlined" sx={{ borderColor: theme.borderColor }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
