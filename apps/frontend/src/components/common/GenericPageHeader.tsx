import React from 'react';
import { Box, Typography, IconButton, Badge, Tooltip, Fab } from '@mui/material';

export interface HeaderAction {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  badgeContent?: number | string;
  badgeColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  isFab?: boolean;
  fabColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  fabSize?: 'small' | 'medium' | 'large';
}

export interface GenericPageHeaderProps {
  title: string;
  subtitle?: string;
  actions: HeaderAction[];
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  sx?: any;
}

const GenericPageHeader: React.FC<GenericPageHeaderProps> = ({
  title,
  subtitle,
  actions,
  titleVariant = 'h4',
  sx = {},
}) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={sx}>
      <Box>
        <Typography variant={titleVariant} component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      
      <Box display="flex" alignItems="center" gap={1}>
        {actions.map((action, index) => {
          if (action.isFab) {
            return (
              <Tooltip key={index} title={action.tooltip}>
                <Fab 
                  color={action.fabColor || 'primary'} 
                  size={action.fabSize || 'small'} 
                  onClick={action.onClick}
                >
                  {action.icon}
                </Fab>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={index} title={action.tooltip}>
              <IconButton 
                onClick={action.onClick}
                color={action.color || 'primary'}
              >
                {action.badgeContent ? (
                  <Badge badgeContent={action.badgeContent} color={action.badgeColor || 'primary'}>
                    {action.icon}
                  </Badge>
                ) : (
                  action.icon
                )}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default GenericPageHeader;
