import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'medium',
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: '2x',
          titleVariant: 'h6' as const,
          spacing: 2,
        };
      case 'large':
        return {
          iconSize: '4x',
          titleVariant: 'h4' as const,
          spacing: 4,
        };
      default:
        return {
          iconSize: '3x',
          titleVariant: 'h5' as const,
          spacing: 3,
        };
    }
  };

  const { titleVariant, spacing } = getSizeStyles();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: spacing,
        px: 2,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <Box sx={{ mb: 2, opacity: 0.6 }}>
        {icon}
      </Box>
      
      <Typography variant={titleVariant} sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      {description && (
        <Typography variant="body2" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
