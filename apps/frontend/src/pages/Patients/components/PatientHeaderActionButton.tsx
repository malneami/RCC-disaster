import React from 'react';
import { Button, ButtonProps } from '@mui/material';

interface PatientHeaderActionButtonProps extends Omit<ButtonProps, 'sx'> {
  gradient: string;
  hoverGradient: string;
  shadowColor: string;
  sx?: ButtonProps['sx'];
}

const PatientHeaderActionButton: React.FC<PatientHeaderActionButtonProps> = ({
  gradient,
  hoverGradient,
  shadowColor,
  children,
  sx,
  ...props
}) => {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        borderRadius: '12px',
        background: gradient,
        color: '#ffffff',
        fontWeight: 600,
        textTransform: 'none',
        px: 2.5,
        boxShadow: `0 4px 12px ${shadowColor}`,
        '&:hover': {
          background: hoverGradient,
          boxShadow: `0 6px 16px ${shadowColor.replace('0.35', '0.45')}`,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease',
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

export default PatientHeaderActionButton;

