import React from 'react';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip, alpha, TextField, MenuItem, Grid, Button } from '@mui/material';
import { Visibility, Computer, CalendarToday } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, formatDistanceToNow } from 'date-fns';
import { MedicalRecordAccessLog } from './MedicalRecordAccessLogsTab';
import { getAccessTypeGradient, getAccessTypeColor } from '../access-logs/AccessLogConstants';
import { getAccessTypeIcon } from '../access-logs/AccessLogUtils';

interface AccessLogCardProps {
  log: MedicalRecordAccessLog;
  index: number;
  totalLogs: number;
  onViewDetails: (log: MedicalRecordAccessLog) => void;
}

export const AccessLogCard: React.FC<AccessLogCardProps> = ({ log, index, totalLogs, onViewDetails }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${alpha(getAccessTypeColor(log.accessType), 0.3)}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(getAccessTypeColor(log.accessType), 0.25)}`,
        },
      }}
    >
      {index < totalLogs - 1 && (
        <Box
          sx={{
            position: 'absolute',
            left: '40px',
            top: '60px',
            bottom: '-16px',
            width: '2px',
            background: `linear-gradient(180deg, ${alpha(getAccessTypeColor(log.accessType), 0.4)} 0%, transparent 100%)`,
          }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: getAccessTypeGradient(log.accessType),
            fontSize: '1.2rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {log.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          {log.user?.lastName?.charAt(0)?.toUpperCase() || ''}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', fontSize: '1rem' }}>
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User'}
                </Typography>
                <Chip
                  label={log.accessType}
                  size="small"
                  icon={getAccessTypeIcon(log.accessType)}
                  sx={{
                    background: getAccessTypeGradient(log.accessType),
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                    boxShadow: `0 2px 8px ${alpha(getAccessTypeColor(log.accessType), 0.5)}`,
                  }}
                />
                {log.user && (
                  <Chip
                    label={log.user.role}
                    size="small"
                    sx={{
                      background: alpha('#42a5f5', 0.12),
                      color: '#42a5f5',
                      fontSize: '0.65rem',
                      height: '20px',
                      border: `1px solid ${alpha('#42a5f5', 0.3)}`,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: '14px', color: '#42a5f5' }} />
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem', ml: 0.5 }}>
                    ({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Tooltip title="View Details" arrow>
              <IconButton
                size="small"
                onClick={() => onViewDetails(log)}
                sx={{
                  color: '#42a5f5',
                  background: alpha('#42a5f5', 0.12),
                  '&:hover': {
                    background: alpha('#42a5f5', 0.25),
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                {log.accessMethod}
              </Typography>
            </Box>
            {log.ipAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                  {log.ipAddress}
                </Typography>
              </Box>
            )}
          </Box>

          {log.reason && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha('#42a5f5', 0.2)}` }}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                Reason:
              </Typography>
              <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem', mt: 0.5 }}>
                {log.reason}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface AccessLogEmptyStateProps {}

export const AccessLogEmptyState: React.FC<AccessLogEmptyStateProps> = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        borderRadius: '16px',
        padding: '60px 20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${alpha('#42a5f5', 0.3)}`,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 6px 20px rgba(66, 165, 245, 0.4)',
        }}
      >
        <Visibility sx={{ fontSize: 48, color: '#ffffff' }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#424242', mb: 1.5 }}>
        No Access Logs Found
      </Typography>
      <Typography sx={{ color: '#42a5f5', fontSize: '0.9375rem', maxWidth: '400px', margin: '0 auto', fontWeight: 500 }}>
        There are no access logs matching your filters.
      </Typography>
    </Box>
  );
};

interface AccessLogFiltersProps {
  userIdFilter: string;
  setUserIdFilter: (value: string) => void;
  accessTypeFilter: string;
  setAccessTypeFilter: (value: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  handleResetFilters: () => void;
  accessTypes: string[];
}

export const AccessLogFilters: React.FC<AccessLogFiltersProps> = ({
  userIdFilter,
  setUserIdFilter,
  accessTypeFilter,
  setAccessTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleResetFilters,
  accessTypes,
}) => {
  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha('#42a5f5', 0.25)}` }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="User ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5' } },
                '&.Mui-focused': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5', borderWidth: '2px' } },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Access Type"
            value={accessTypeFilter}
            onChange={(e) => setAccessTypeFilter(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5' } },
                '&.Mui-focused': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5', borderWidth: '2px' } },
              },
            }}
          >
            <MenuItem value="">All</MenuItem>
            {accessTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5' } },
                    '&.Mui-focused': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5', borderWidth: '2px' } },
                  },
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5' } },
                    '&.Mui-focused': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5', borderWidth: '2px' } },
                  },
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleResetFilters}
            sx={{
              background: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '8px 24px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
              },
            }}
          >
            Reset Filters
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

