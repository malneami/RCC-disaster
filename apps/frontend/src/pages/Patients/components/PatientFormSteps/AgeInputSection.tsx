import React from 'react';
import { Grid, TextField, Typography, Box } from '@mui/material';

interface AgeInputSectionProps {
  ageParts: { years: string; months: string; days: string };
  onAgePartChange: (part: 'years' | 'months' | 'days', value: string) => void;
  onFieldBlur?: (field: string) => void;
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

const AgeInputSection: React.FC<AgeInputSectionProps> = ({
  ageParts,
  onAgePartChange,
  onFieldBlur,
}) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.05) 0%, rgba(100, 181, 246, 0.05) 100%)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(66, 165, 245, 0.2)',
      }}
    >
      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600, mb: 1, display: 'block' }}>
        Or Enter Age
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Days"
            value={ageParts.days}
            onChange={(e) => onAgePartChange('days', e.target.value)}
            onBlur={() => onFieldBlur?.('ageDays')}
            type="number"
            inputProps={{ min: 0 }}
            size="small"
            sx={inputSx}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Months"
            value={ageParts.months}
            onChange={(e) => onAgePartChange('months', e.target.value)}
            onBlur={() => onFieldBlur?.('ageMonths')}
            type="number"
            inputProps={{ min: 0 }}
            size="small"
            sx={inputSx}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Years"
            value={ageParts.years}
            onChange={(e) => onAgePartChange('years', e.target.value)}
            onBlur={() => onFieldBlur?.('age')}
            type="number"
            inputProps={{ min: 0 }}
            size="small"
            sx={inputSx}
          />
        </Grid>
      </Grid>
      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', mt: 1, display: 'block' }}>
        Enter age to calculate Date of Birth automatically
      </Typography>
    </Box>
  );
};

export default AgeInputSection;

