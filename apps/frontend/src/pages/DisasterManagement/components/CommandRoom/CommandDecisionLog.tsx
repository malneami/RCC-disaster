import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { History } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { disasterService, DisasterCommandDecisionAction } from '../../../../services/disasterService';
import { format } from 'date-fns';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const ACTION_LABELS: Record<DisasterCommandDecisionAction, string> = {
  ACTIVATED: 'Command room activated',
  ESCALATED: 'Escalated',
  TEAM_ASSIGNED: 'Team assigned',
  CLOSED: 'Command room closed',
  CUSTOM: 'Custom decision',
};

interface DecisionEntry {
  id: string;
  action: DisasterCommandDecisionAction;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: { firstName?: string; lastName?: string };
}

interface CommandDecisionLogProps {
  incidentId: string;
  decisions: DecisionEntry[];
  canLog: boolean;
  theme: ReturnType<typeof getTheme>;
  onDecisionLogged: () => void;
}

export const CommandDecisionLog: React.FC<CommandDecisionLogProps> = ({
  incidentId,
  decisions,
  canLog,
  theme,
  onDecisionLogged,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [action, setAction] = useState<DisasterCommandDecisionAction>('CUSTOM');
  const [detailsText, setDetailsText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLog = async () => {
    setSubmitting(true);
    try {
      const details = detailsText.trim()
        ? ((): Record<string, unknown> => {
            try {
              return JSON.parse(detailsText) as Record<string, unknown>;
            } catch {
              return { note: detailsText };
            }
          })()
        : undefined;
      await disasterService.logCommandDecision(
        incidentId,
        action,
        action === 'CUSTOM' && details ? details : undefined
      );
      onDecisionLogged();
      setDetailsText('');
      enqueueSnackbar('Decision logged', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to log decision', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDetail = (d?: Record<string, unknown>) => {
    if (!d || Object.keys(d).length === 0) return '';
    return ` — ${JSON.stringify(d)}`;
  };

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <History sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Decision Log
          </Typography>
        </Box>
        {canLog && (
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={action}
                label="Action"
                onChange={(e) => setAction(e.target.value as DisasterCommandDecisionAction)}
                sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.primary } }}
              >
                {(['TEAM_ASSIGNED', 'CUSTOM'] as const).map((a) => (
                  <MenuItem key={a} value={a}>{ACTION_LABELS[a]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {action === 'CUSTOM' && (
              <TextField
                size="small"
                label="Details (JSON or note)"
                placeholder='{"key": "value"} or plain text'
                multiline
                rows={2}
                value={detailsText}
                onChange={(e) => setDetailsText(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.primary } }}
              />
            )}
            <Button
              size="small"
              variant="contained"
              disabled={submitting}
              onClick={handleLog}
              sx={{ alignSelf: 'flex-start', bgcolor: theme.primary, '&:hover': { bgcolor: theme.gradientStart } }}
            >
              {submitting ? 'Logging…' : 'Log Decision'}
            </Button>
          </Box>
        )}
        <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
          {decisions.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No decisions logged yet"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          ) : (
            decisions.map((d) => (
              <ListItem key={d.id} sx={{ py: 0.5, borderLeft: `3px solid ${theme.primary}`, pl: 1.5, mb: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      <strong>{ACTION_LABELS[d.action]}</strong>
                      {formatDetail(d.details)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {d.user
                        ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() || '—'
                        : '—'}{' '}
                      · {format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
};
