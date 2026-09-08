import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Skeleton,
} from '@mui/material';
import { People } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { disasterService, DisasterCommandRole } from '../../../../services/disasterService';
import { apiClient } from '../../../../services/apiClient';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const ROLE_LABELS: Record<DisasterCommandRole, string> = {
  COMMANDER: 'Commander',
  OPERATIONS_LEAD: 'Operations Lead',
  EMS_COORDINATOR: 'EMS Coordinator',
  HOSPITAL_COORDINATION_LEAD: 'Hospital Coordination Lead',
  SITUATION_ANALYST: 'Situation Analyst',
  RECORDER: 'Recorder',
};

interface RoleAssignment {
  id: string;
  role: DisasterCommandRole;
  userId: string;
  user?: { id: string; firstName?: string; lastName?: string; email?: string };
  assignedBy?: { firstName?: string; lastName?: string };
}

interface CommandRolePanelProps {
  incidentId: string;
  roleAssignments: RoleAssignment[];
  canAssign: boolean;
  requiredRoles?: string[];
  theme: ReturnType<typeof getTheme>;
  onRoleAssigned: () => void;
}

export const CommandRolePanel: React.FC<CommandRolePanelProps> = ({
  incidentId,
  roleAssignments,
  canAssign,
  requiredRoles = [],
  theme,
  onRoleAssigned,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<Array<{ id: string; firstName?: string; lastName?: string; email?: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Record<DisasterCommandRole, string>>({
    COMMANDER: '',
    OPERATIONS_LEAD: '',
    EMS_COORDINATOR: '',
    HOSPITAL_COORDINATION_LEAD: '',
    SITUATION_ANALYST: '',
    RECORDER: '',
  });

  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    setUsersLoading(true);
    apiClient
      .get('/users/for-communication?page=1&limit=200')
        .then((res) => {
        if (!cancelled) setUsers(res.data?.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => { cancelled = true; };
  }, [canAssign]);

  const getAssignmentForRole = (role: DisasterCommandRole) =>
    roleAssignments.find((a) => a.role === role);

  const handleAssign = async (role: DisasterCommandRole, userId: string) => {
    if (!userId) return;
    setAssigning(role);
    try {
      await disasterService.assignCommandRole(incidentId, userId, role);
      onRoleAssigned();
      enqueueSnackbar('Role assigned successfully', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to assign role', { variant: 'error' });
    } finally {
      setAssigning(null);
      setSelectedUser((p) => ({ ...p, [role]: '' }));
    }
  };

  const roles: DisasterCommandRole[] = [
    'COMMANDER',
    'OPERATIONS_LEAD',
    'EMS_COORDINATOR',
    'HOSPITAL_COORDINATION_LEAD',
    'SITUATION_ANALYST',
    'RECORDER',
  ];

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <People sx={{ color: theme.primary, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Command Roles
          </Typography>
        </Box>
        {roles.map((role) => {
          const assignment = getAssignmentForRole(role);
          const displayName = assignment?.user
            ? `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() || assignment.user.email || '—'
            : null;
          return (
            <Box
              key={role}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 1.25,
                borderBottom: `1px solid ${theme.borderColor}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 180 }}>
                <Typography variant="body2" fontWeight={500}>
                  {ROLE_LABELS[role]}
                </Typography>
                {requiredRoles.includes(role) && !assignment && (
                  <Chip
                    label="Required"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: '#DC262620',
                      color: '#DC2626',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              {assignment ? (
                <Chip
                  label={displayName}
                  size="small"
                  sx={{ bgcolor: `${theme.primary}15`, color: theme.primary }}
                />
              ) : canAssign && !usersLoading ? (
                <Box sx={{ display: 'flex', gap: 1, flex: 1, maxWidth: 280 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Assign</InputLabel>
                    <Select
                      value={selectedUser[role] || ''}
                      label="Assign"
                      onChange={(e) => setSelectedUser((p) => ({ ...p, [role]: e.target.value }))}
                      sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.primary } }}
                    >
                      <MenuItem value="">
                        <em>Select user</em>
                      </MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedUser[role] || assigning === role}
                    onClick={() => selectedUser[role] && handleAssign(role, selectedUser[role])}
                    sx={{ bgcolor: theme.primary, '&:hover': { bgcolor: theme.gradientStart } }}
                  >
                    {assigning === role ? 'Assigning…' : 'Assign'}
                  </Button>
                </Box>
              ) : usersLoading ? (
                <Skeleton variant="text" width={120} />
              ) : (
                <Typography variant="caption" color="text.secondary">—</Typography>
              )}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};
