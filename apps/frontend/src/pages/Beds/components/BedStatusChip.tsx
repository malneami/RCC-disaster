import React from 'react';
import { Chip } from '@mui/material';
import { BedStatus } from '../services/bedService';
import { getBedStatusLabel } from '../utils/bedStatusUtils';

interface BedStatusChipProps {
  status: BedStatus;
  size?: 'small' | 'medium';
}

// Vibrant pill badge styling for bed status
const getStatusStyles = (status: BedStatus) => {
  switch (status) {
    case 'OCCUPIED':
      return {
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
      };
    case 'VACANT':
      return {
        backgroundColor: '#D1FAE5',
        color: '#059669',
      };
    case 'CLEANING':
      return {
        backgroundColor: '#FEF3C7',
        color: '#D97706',
      };
    case 'BLOCKED':
      return {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
      };
    case 'RESERVED':
      return {
        backgroundColor: '#E0F2FE',
        color: '#0284C7',
      };
    default:
      return {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
      };
  }
};

export const BedStatusChip: React.FC<BedStatusChipProps> = ({ status, size = 'small' }) => {
  const styles = getStatusStyles(status);

  return (
    <Chip
      label={getBedStatusLabel(status)}
      size={size}
      sx={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontWeight: 600,
        borderRadius: '16px',
        padding: '4px 8px',
        '& .MuiChip-label': {
          padding: '0 8px',
        },
      }}
    />
  );
};
