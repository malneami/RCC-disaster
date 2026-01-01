import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface PersonalInfoFormFieldProps extends Omit<TextFieldProps, 'sx'> {
  icon?: React.ReactNode;
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#ffffff',
    transition: 'all 0.3s ease',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(66, 165, 245, 0.5)',
      },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#42a5f5',
        borderWidth: '2px',
      },
      boxShadow: '0 0 0 4px rgba(66, 165, 245, 0.1)',
    },
  },
};

const PersonalInfoFormField: React.FC<PersonalInfoFormFieldProps> = ({
  icon,
  InputProps,
  ...props
}) => {
  return (
    <TextField
      {...props}
      InputProps={{
        ...InputProps,
        startAdornment: icon || InputProps?.startAdornment,
      }}
      sx={inputSx}
    />
  );
};

export default PersonalInfoFormField;

