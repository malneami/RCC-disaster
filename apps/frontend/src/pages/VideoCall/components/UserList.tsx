import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Card,
  Button,
  Avatar,
  Chip,
  IconButton,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { User, getUserDisplayName, getUserInitials } from '../utils/videoCallUtils';

// Role configuration with display names, icons, and colors
const ROLE_CONFIG: Record<string, { displayName: string; emoji: string; color: string }> = {
  EMS: { displayName: 'EMS Teams', emoji: '🚑', color: '#E3F2FD' },
  BED_COORDINATOR: { displayName: 'Bed Coordinators', emoji: '🛏️', color: '#F3E5F5' },
  UNIT_NURSE: { displayName: 'Unit Nurses', emoji: '👩‍⚕️', color: '#E8F5E9' },
  ED_NURSE: { displayName: 'ED Nurses', emoji: '🏥', color: '#FFF3E0' },
  DATA_COLLECTOR: { displayName: 'Data Collectors', emoji: '📊', color: '#E0F7FA' },
  HOSPITAL_USER: { displayName: 'Hospital Users', emoji: '🏢', color: '#FAFAFA' },
  CATH_LAB_USER: { displayName: 'Cath Lab Users', emoji: '❤️', color: '#FCE4EC' },
  RCC: { displayName: 'RCC Team', emoji: '⚡', color: '#FFF8E1' },
  ADMIN: { displayName: 'Administrators', emoji: '👑', color: '#ECEFF1' },
};

// Order of role sections
const ROLE_ORDER = [
  'EMS',
  'BED_COORDINATOR',
  'UNIT_NURSE',
  'ED_NURSE',
  'DATA_COLLECTOR',
  'HOSPITAL_USER',
  'CATH_LAB_USER',
  'RCC',
  'ADMIN',
];

interface UserListProps {
  users: User[];
  callUser: (targetUser?: User, email?: string) => void;
  stream: MediaStream | null;
  socket: any;
  actionLabel?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  callUser,
  actionLabel = 'Call',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    ROLE_ORDER.reduce((acc, role) => ({ ...acc, [role]: true }), {})
  );

  // Filter users based on search query and selected roles
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        getUserDisplayName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRoles.length === 0 || selectedRoles.includes(user.role);

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoles]);

  // Group users by role
  const usersByRole = useMemo(() => {
    const groups: Record<string, User[]> = {};
    ROLE_ORDER.forEach((role) => {
      groups[role] = filteredUsers.filter((user) => user.role === role);
    });
    return groups;
  }, [filteredUsers]);

  // Get unique roles from users for filter chips
  const availableRoles = useMemo(() => {
    const roles = new Set(users.map((user) => user.role));
    return ROLE_ORDER.filter((role) => roles.has(role));
  }, [users]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const clearFilters = () => {
    setSelectedRoles([]);
    setSearchQuery('');
  };

  const toggleSection = (role: string) => {
    setExpandedSections((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  return (
    <Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Global Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Filter:
          </Typography>
          {availableRoles.map((role) => {
            const config = ROLE_CONFIG[role] || { displayName: role, emoji: '👤', color: '#F5F5F5' };
            const isSelected = selectedRoles.includes(role);
            return (
              <Chip
                key={role}
                label={`${config.emoji} ${config.displayName}`}
                size="small"
                onClick={() => toggleRole(role)}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: isSelected ? config.color : 'transparent',
                  borderColor: isSelected ? 'transparent' : 'divider',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: config.color },
                }}
              />
            );
          })}
          {(selectedRoles.length > 0 || searchQuery) && (
            <Chip
              label="Clear All"
              size="small"
              onClick={clearFilters}
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </Paper>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
      </Typography>

      {/* User List by Role Sections */}
      {ROLE_ORDER.map((role) => {
        const roleUsers = usersByRole[role] || [];
        if (roleUsers.length === 0) return null;

        const config = ROLE_CONFIG[role] || { displayName: role, emoji: '👤', color: '#F5F5F5' };
        const isExpanded = expandedSections[role];

        return (
          <Paper key={role} sx={{ mb: 1.5, overflow: 'hidden' }}>
            {/* Section Header */}
            <Box
              onClick={() => toggleSection(role)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: config.color,
                cursor: 'pointer',
                '&:hover': { filter: 'brightness(0.97)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontSize="1.25rem">{config.emoji}</Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {config.displayName}
                </Typography>
                <Chip
                  label={roleUsers.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            {/* Users Grid */}
            <Collapse in={isExpanded}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  gap: 1.5,
                  p: 1.5,
                }}
              >
                {roleUsers.map((user) => (
                  <Card
                    key={user.id}
                    variant="outlined"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 2,
                      gap: 1.5,
                      borderRadius: 2,
                      minHeight: 140,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.light',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        fontSize: '1.1rem',
                        bgcolor: 'primary.main',
                      }}
                    >
                      {getUserInitials(user)}
                    </Avatar>
                    <Box sx={{ width: '100%' }}>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        title={getUserDisplayName(user)}
                        sx={{
                          fontSize: '0.9rem',
                          mb: 0.25,
                          wordBreak: 'break-word',
                          lineHeight: 1.3,
                        }}
                      >
                        {getUserDisplayName(user)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          lineHeight: 1.2,
                        }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PhoneIcon sx={{ fontSize: '1rem !important' }} />}
                      onClick={() => callUser(user)}
                      disabled={false} // Always enabled in LiveKit flow
                      sx={{
                        minWidth: 'auto',
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #00C853, #1DE9B6)',
                        boxShadow: '0 2px 8px rgba(0, 200, 83, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00B848, #1AD1A3)',
                          boxShadow: '0 4px 16px rgba(0, 200, 83, 0.5)',
                        },
                        '&.Mui-disabled': {
                          background: 'none',
                          bgcolor: 'action.disabledBackground',
                        },
                      }}
                    >
                      {actionLabel}
                    </Button>
                  </Card>
                ))}
              </Box>
            </Collapse>
          </Paper>
        );
      })}

      {/* Empty state */}
      {filteredUsers.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No users found matching your search criteria.
          </Typography>
          <Button onClick={clearFilters} sx={{ mt: 1 }}>
            Clear Filters
          </Button>
        </Paper>
      )}
    </Box>
  );
};
