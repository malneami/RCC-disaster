import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { MedicalRecord } from '../../../../services/medicalRecordService';
import {
  getRecordTypeColor,
  getRecordTypeIcon,
  getRecordTypeLabel,
} from '../../utils/medicalRecordTypeUtils';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onView: (record: MedicalRecord) => void;
  onEdit: (record: MedicalRecord) => void;
  onDelete: (record: MedicalRecord) => void;
}

const MedicalRecordCard: React.FC<MedicalRecordCardProps> = ({
  record,
  onView,
  onEdit,
  onDelete,
}) => {
  const recordColor = getRecordTypeColor(record.recordType);
  const recordIcon = getRecordTypeIcon(record.recordType);
  const recordLabel = getRecordTypeLabel(record.recordType);

  const recordDate = new Date(record.recordDate);
  const formattedDate = format(recordDate, 'MMM d, yyyy');
  const relativeDate = formatDistanceToNow(recordDate, { addSuffix: true });

  const createdByName = record.createdBy
    ? `${record.createdBy.firstName} ${record.createdBy.lastName}`
    : 'Unknown';

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: '12px',
        borderLeft: `4px solid ${recordColor}`,
        border: `1px solid ${alpha(recordColor, 0.2)}`,
        borderLeftWidth: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '16px 20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          borderColor: alpha(recordColor, 0.35),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Icon Badge */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${recordColor} 0%, ${alpha(recordColor, 0.8)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${alpha(recordColor, 0.3)}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ color: '#ffffff' }}>{recordIcon}</Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  color: 'text.primary',
                  mb: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {record.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  label={recordLabel}
                  size="small"
                  sx={{
                    backgroundColor: alpha(recordColor, 0.1),
                    color: recordColor,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px',
                  }}
                >
                  {formattedDate}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '12px',
                  }}
                >
                  ({relativeDate})
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '13px',
              }}
            >
              Created by {createdByName}
            </Typography>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={() => onView(record)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: alpha(recordColor, 0.1),
                      color: recordColor,
                    },
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Record">
                <IconButton
                  size="small"
                  onClick={() => onEdit(record)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: alpha(recordColor, 0.1),
                      color: recordColor,
                    },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Record">
                <IconButton
                  size="small"
                  onClick={() => onDelete(record)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: alpha('#ef5350', 0.1),
                      color: '#ef5350',
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MedicalRecordCard;

