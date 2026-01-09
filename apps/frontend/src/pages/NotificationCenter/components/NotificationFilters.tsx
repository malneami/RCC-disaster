import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Popover,
  Typography,
  Stack,
  Divider,
  Button,
  Box,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { NotificationFilter } from '../../../services/notificationService';
// Define enum values locally to avoid Prisma client dependency issues
const NotificationType = {
  CASE_COMMENT: 'CASE_COMMENT',
  CASE_UPDATE: 'CASE_UPDATE',
  CASE_ASSIGNMENT: 'CASE_ASSIGNMENT',
  CASE_COMPLETION: 'CASE_COMPLETION',
  CASE_ESCALATION: 'CASE_ESCALATION',
  EMS_LATE_CASE: 'EMS_LATE_CASE',
  CRITICAL_CASE_INCOMING: 'CRITICAL_CASE_INCOMING',
  INCOMPLETE_PATIENT_DATA: 'INCOMPLETE_PATIENT_DATA',
  KPI_THRESHOLD_BREACH: 'KPI_THRESHOLD_BREACH',
  CRITICAL_TIME_LIMIT_APPROACHING: 'CRITICAL_TIME_LIMIT_APPROACHING',
} as const;

const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

const CaseType = {
  STEMI: 'STEMI',
  STROKE: 'STROKE',
  TRAUMA: 'TRAUMA'
} as const;

// NotificationFiltersProps interface
interface NotificationFiltersProps {
  currentFilters: NotificationFilter;
  onApplyFilters: (filters: NotificationFilter) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  anchorEl?: HTMLButtonElement | null;
  open: boolean;
  onClose: () => void;
}

// NotificationFilters Component
const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentFilters,
  onApplyFilters,
  onResetFilters,
  anchorEl,
  open,
  onClose,
}) => {
  // State for filter form values
  const [filters, setFilters] = useState<NotificationFilter>(currentFilters);

  // Update local filters when currentFilters prop changes
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    filters.priority || 
    filters.type || 
    filters.caseType || 
    filters.category ||
    filters.isRead
  );

  // Handle read status filter change - treat as string like caseType
  const handleReadStatusChange = (event: any) => {
    const value = event.target.value;
    setFilters((prev: NotificationFilter) => ({
      ...prev,
      isRead: value === '' ? undefined : value as string,
    }));
  };

  // Apply filters handler
  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  // Reset filters handler
  const handleReset = () => {
    setFilters({}); // Reset local state
    onResetFilters(); // Call parent reset
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          p: 3,
          minWidth: 400,
          maxWidth: 500,
          mt: 1,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Filter Notifications
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Box>

        <Divider />

        {/* Priority Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={filters.priority || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({ ...filters, priority: value === '' ? undefined : value as string });
            }}
            label="Priority"
          >
            <MenuItem value="">All Priorities</MenuItem>
            {Object.values(NotificationPriority).map((priority) => (
              <MenuItem key={priority} value={priority}>
                {priority}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Type Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            name="type"
            value={filters.type || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({ ...filters, type: value === '' ? undefined : value as string });
            }}
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.values(NotificationType).map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Case Type Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Case Type</InputLabel>
          <Select
            name="caseType"
            value={filters.caseType || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({ ...filters, caseType: value === '' ? undefined : value as string });
            }}
            label="Case Type"
          >
            <MenuItem value="">All Case Types</MenuItem>
            {Object.values(CaseType).map((caseType) => (
              <MenuItem key={caseType} value={caseType}>
                {caseType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Read Status Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Read Status</InputLabel>
          <Select
            name="isRead"
            value={filters.isRead || ''}
            onChange={handleReadStatusChange}
            label="Read Status"
          >
            <MenuItem value="">All Notifications</MenuItem>
            <MenuItem value="false">Unread Only</MenuItem>
            <MenuItem value="true">Read Only</MenuItem>
          </Select>
        </FormControl>

        <Divider />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleReset}
              startIcon={<FontAwesomeIcon icon={faTimes} />}
            >
              Reset
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            startIcon={<FontAwesomeIcon icon={faFilter} />}
          >
            Apply Filters
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
};

export default NotificationFilters;