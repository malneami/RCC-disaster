import React from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Chip, Grid } from '@mui/material';

export interface CardField {
  key: string;
  label: string;
  value: any;
  type: 'text' | 'percentage' | 'chip' | 'status' | 'services';
  color?: string;
  size?: 'small' | 'medium';
}

export interface CardAction {
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export interface EntityCardProps {
  title: string;
  subtitle?: string;
  fields: CardField[];
  actions: CardAction[];
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  elevation?: number;
  sx?: any;
  minHeight?: number | string;
}

const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  fields,
  actions,
  gridSize = { xs: 12, sm: 6, md: 4 },
  elevation = 1,
  sx = {},
  minHeight = 280,
}) => {
  const renderField = (field: CardField) => {
    switch (field.type) {
      case 'text':
        return (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {field.value || 'N/A'}
          </Typography>
        );
      
      case 'percentage':
        return (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2">
              {field.label}: {field.value}%
            </Typography>
            <Chip 
              label={`${field.value}%`}
              color={field.color as any}
              size={field.size || 'small'}
            />
          </Box>
        );
      
      case 'chip':
        return (
          <Chip 
            label={field.value} 
            color={field.color as any}
            size={field.size || 'small'}
            sx={{ mb: 1, mr: 1 }}
          />
        );
      
      case 'status':
        return (
          <Chip 
            label={field.value} 
            color={field.color as any}
            size={field.size || 'small'}
          />
        );
      
      case 'services':
        return (
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {Array.isArray(field.value) ? field.value.map((service: string, index: number) => (
              <Chip 
                key={index}
                label={service} 
                size="small" 
                color="primary" 
              />
            )) : null}
          </Box>
        );
      
      default:
        return (
          <Typography variant="body2" color="text.secondary">
            {field.value}
          </Typography>
        );
    }
  };

  return (
    <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg}>
      <Card 
        elevation={elevation} 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight,
          ...sx,
        }}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Section */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mr: 1,
              }}
            >
              {title}
            </Typography>
            {fields.find(f => f.type === 'status') && (
              <Box sx={{ flexShrink: 0 }}>
                {fields.filter(f => f.type === 'status').map((field, index) => (
                  <Box key={index} component="span" sx={{ ml: index > 0 ? 1 : 0 }}>
                    {renderField(field)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          
          {/* Subtitle Section */}
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              mb={2}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Fields Section - Flex grow to fill available space */}
          <Box sx={{ flexGrow: 1 }}>
            {fields.filter(f => f.type !== 'status').map((field) => (
              <Box key={field.key}>
                {renderField(field)}
              </Box>
            ))}
          </Box>
        </CardContent>
        
        {/* Actions Section - Fixed at bottom */}
        {actions.length > 0 && (
          <CardActions sx={{ mt: 'auto', pt: 0 }}>
            {actions.map((action, index) => (
              <Button 
                key={index}
                size={action.size || 'small'}
                variant={action.variant || 'text'}
                color={action.color || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </CardActions>
        )}
      </Card>
    </Grid>
  );
};

export default EntityCard;
