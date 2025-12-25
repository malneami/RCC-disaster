import React from 'react';
import { Chip } from '@mui/material';
import { BedStatus } from '../services/bedService';
import { getBedStatusLabel, getBedStatusChipColor } from '../utils/bedStatusUtils';

interface BedStatusChipProps {
  status: BedStatus;
  size?: 'small' | 'medium';
}

export const BedStatusChip: React.FC<BedStatusChipProps> = ({ status, size = 'small' }) => {
  return (
    <Chip
      label={getBedStatusLabel(status)}
      size={size}
      color={getBedStatusChipColor(status)}
    />
  );
};

