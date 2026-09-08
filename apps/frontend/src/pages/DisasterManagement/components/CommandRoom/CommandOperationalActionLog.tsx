import React from 'react';
import { Box, Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { format } from 'date-fns';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';
import type { OperationalAction } from '../../hooks/useOperationalActions';

interface CommandOperationalActionLogProps {
  actions: OperationalAction[];
  loading?: boolean;
  theme: ReturnType<typeof getTheme>;
}

function formatDetails(details?: string | Record<string, unknown>): string {
  if (!details) return '';
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details) as Record<string, unknown>;
      const parts: string[] = [];
      if (parsed.role && typeof parsed.role === 'string') parts.push(`Role: ${parsed.role}`);
      if (parsed.note && typeof parsed.note === 'string') parts.push(parsed.note);
      if (parts.length) return parts.join(' · ');
      return details;
    } catch {
      return details;
    }
  }
  const parts: string[] = [];
  if (details.role && typeof details.role === 'string') parts.push(`Role: ${details.role}`);
  if (details.note && typeof details.note === 'string') parts.push(details.note);
  return parts.length ? parts.join(' · ') : '';
}

export const CommandOperationalActionLog: React.FC<CommandOperationalActionLogProps> = ({
  actions,
  loading,
  theme,
}) => {
  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Assignment sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Operational Action Log
          </Typography>
        </Box>
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText
                primary="Loading…"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          ) : actions.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No actions recorded yet"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          ) : (
            actions.map((a) => {
              const detailsStr = formatDetails(a.details);
              return (
                <ListItem
                  key={a.id}
                  sx={{ py: 0.5, borderLeft: `3px solid ${theme.primary}`, pl: 1.5, mb: 0.5 }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        <strong>{a.action}</strong>
                        {detailsStr && ` — ${detailsStr}`}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {a.user
                          ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || '—'
                          : '—'}{' '}
                        · {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </CardContent>
    </Card>
  );
};
