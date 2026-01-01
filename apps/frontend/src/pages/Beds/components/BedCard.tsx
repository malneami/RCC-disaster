import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import { Bed } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';
import { getBedStatusColor } from '../utils/bedStatusUtils';

interface BedCardProps {
  bed: Bed;
  onClick?: (bed: Bed) => void;
}

export const BedCard: React.FC<BedCardProps> = ({ bed, onClick }) => {
  const statusColor = getBedStatusColor(bed.status);

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        } : {},
        borderLeft: `4px solid ${statusColor}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => onClick?.(bed)}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Bed Number */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
            {bed.bedNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {bed.unit.name}
          </Typography>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <BedStatusChip status={bed.status} />
        </Box>


        {bed.location && (
          <Box sx={{ mb: 1.5 }}>
            <Tooltip title={bed.location}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Location: {bed.location}
              </Typography>
            </Tooltip>
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          {!bed.isOperational && (
            <Typography variant="caption" color="error">
              Not Operational
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

