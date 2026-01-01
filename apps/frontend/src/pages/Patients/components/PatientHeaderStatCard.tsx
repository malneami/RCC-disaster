import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

interface PatientHeaderStatCardProps {
  gradient: string;
  icon: React.ReactNode;
  value: string | number;
  label: string;
  chip?: React.ReactNode;
  color?: string;
  sx?: SxProps<Theme>;
}

const PatientHeaderStatCard: React.FC<PatientHeaderStatCardProps> = ({
  gradient: _gradient,
  icon,
  value,
  label,
  chip,
  color = '#42a5f5',
  sx,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 3,
        backgroundColor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.2s ease',
        cursor: 'default',
        '&:hover': {
          backgroundColor: alpha(color, 0.12),
          transform: 'translateY(-1px)',
        },
        ...sx,
      }}
    >
      <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      {chip || (
        <Typography sx={{ fontWeight: 700, color: color, fontSize: '1rem' }}>
          {value}
        </Typography>
      )}
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default PatientHeaderStatCard;

