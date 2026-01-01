import React from 'react';
import { Grid, Typography, Box, alpha } from '@mui/material';

interface DetailFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  fullWidth?: boolean;
}

export const DetailField: React.FC<DetailFieldProps> = ({ icon, label, value, color, fullWidth = false }) => (
  <Grid item xs={12} md={fullWidth ? 12 : 6}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.95rem',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, color, children }) => (
  <Box
    sx={{
      background: '#ffffff',
      borderRadius: '16px',
      border: `1px solid ${alpha(color, 0.2)}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      mb: 2.5,
    }}
  >
    <Box
      sx={{
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        padding: '14px 18px',
        borderBottom: `1px solid ${alpha(color, 0.15)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ padding: '18px' }}>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Box>
  </Box>
);

