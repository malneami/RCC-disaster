import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faRedo, faTimes } from '@fortawesome/free-solid-svg-icons';
import { NotificationFilter } from '../../../services/notificationService';
// Define enum values locally to avoid Prisma client dependency issues
const NotificationType = {
  CASE_COMMENT: 'CASE_COMMENT',
  CASE_UPDATE: 'CASE_UPDATE',
  CASE_ASSIGNMENT: 'CASE_ASSIGNMENT',
  CASE_COMPLETION: 'CASE_COMPLETION',
  CASE_ESCALATION: 'CASE_ESCALATION'
} as const;

const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
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
}

// NotificationFilters Component
const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentFilters,
  onApplyFilters,
  onResetFilters,
  onRefresh,
}) => {
  // State for filter form values
  const [filters, setFilters] = useState<NotificationFilter>(currentFilters);

  // Update local filters when currentFilters prop changes
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Handle checkbox change for isRead
  const handleReadStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev: NotificationFilter) => ({
      ...prev,
      isRead: event.target.checked ? true : undefined, // Set to true or undefined
    }));
  };

  // Apply filters handler
  const handleApply = () => {
    onApplyFilters(filters);
  };

  // Reset filters handler
  const handleReset = () => {
    setFilters({}); // Reset local state
    onResetFilters(); // Call parent reset
  };

  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
      <Grid container spacing={2} alignItems="center">
        {/* Priority Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={filters.priority || ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as string })}
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
        </Grid>

        {/* Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as string })}
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
        </Grid>

        {/* Case Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Case Type</InputLabel>
            <Select
              name="caseType"
              value={filters.caseType || ''}
              onChange={(e) => setFilters({ ...filters, caseType: e.target.value as string })}
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
        </Grid>

        {/* Is Read Checkbox */}
        <Grid item xs={12} sm={6} md={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isRead === true}
                onChange={handleReadStatusChange}
                name="isRead"
                color="primary"
              />
            }
            label="Read"
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Tooltip title="Apply Filters">
            <IconButton color="primary" onClick={handleApply}>
              <FontAwesomeIcon icon={faFilter} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Filters">
            <IconButton color="secondary" onClick={handleReset}>
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh List">
            <IconButton onClick={onRefresh}>
              <FontAwesomeIcon icon={faRedo} />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationFilters;