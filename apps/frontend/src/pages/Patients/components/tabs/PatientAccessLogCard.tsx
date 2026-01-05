import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Computer,
  CalendarToday,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { PatientAccessLog } from '../../../../services/patientService';
import {
  getAccessTypeGradient,
  getAccessTypeColor,
} from '../access-logs/AccessLogConstants';
import { getAccessTypeIcon } from '../access-logs/AccessLogUtils';

interface PatientAccessLogCardProps {
  log: PatientAccessLog;
  index: number;
  totalLogs: number;
}

const PatientAccessLogCard: React.FC<PatientAccessLogCardProps> = ({ log, index, totalLogs }) => {
  const accessTypeColor = getAccessTypeColor(log.accessType);
  const accessTypeGradient = getAccessTypeGradient(log.accessType);
  const accessTypeIcon = getAccessTypeIcon(log.accessType);

  const logDate = new Date(log.timestamp);
  const formattedDate = format(logDate, 'MMM d, yyyy HH:mm');
  const relativeDate = formatDistanceToNow(logDate, { addSuffix: true });

  const userName = log.user
    ? `${log.user.firstName} ${log.user.lastName}`
    : 'Unknown User';

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: '12px',
        borderLeft: `4px solid ${accessTypeColor}`,
        border: `1px solid ${alpha(accessTypeColor, 0.2)}`,
        borderLeftWidth: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '16px 20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          borderColor: alpha(accessTypeColor, 0.35),
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
            background: `linear-gradient(180deg, ${alpha(accessTypeColor, 0.4)} 0%, transparent 100%)`,
          }}
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Access Type Icon Badge */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: accessTypeGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${alpha(accessTypeColor, 0.3)}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {accessTypeIcon}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: accessTypeGradient,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {log.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  {log.user?.lastName?.charAt(0)?.toUpperCase() || ''}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '1rem',
                  }}
                >
                  {userName}
                </Typography>
                <Chip
                  label={log.accessType}
                  size="small"
                  icon={accessTypeIcon as React.ReactElement}
                  sx={{
                    background: accessTypeGradient,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                    boxShadow: `0 2px 8px ${alpha(accessTypeColor, 0.3)}`,
                    '& .MuiChip-icon': {
                      color: '#ffffff',
                      fontSize: '14px',
                    },
                  }}
                />
                {log.user && (
                  <Chip
                    label={log.user.role}
                    size="small"
                    sx={{
                      backgroundColor: alpha(accessTypeColor, 0.1),
                      color: accessTypeColor,
                      fontSize: '0.65rem',
                      height: '20px',
                      border: `1px solid ${alpha(accessTypeColor, 0.3)}`,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: '14px', color: accessTypeColor }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {formattedDate}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 0.5 }}>
                    ({relativeDate})
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Access Details */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Computer sx={{ fontSize: '14px', color: accessTypeColor }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Method: <strong>{log.accessMethod}</strong>
              </Typography>
            </Box>
            {log.ipAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Computer sx={{ fontSize: '14px', color: accessTypeColor }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  IP: <strong>{log.ipAddress}</strong>
                </Typography>
              </Box>
            )}
          </Box>

          {log.reason && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(accessTypeColor, 0.2)}` }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                Reason:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', mt: 0.5 }}>
                {log.reason}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PatientAccessLogCard;