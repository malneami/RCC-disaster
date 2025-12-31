import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface StatisticFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onReset: () => void;
}

const StatisticFilters: React.FC<StatisticFiltersProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(110, 198, 255, 0.25)',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#1a237e',
            mb: 2,
            fontSize: '1.5rem',
          }}
        >
          Patient Statistics Dashboard
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => onStartDateChange(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: '#ffffff',
                        '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6ec6ff',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6ec6ff',
                          borderWidth: '2px',
                        },
                      },
                    },
                  },
                },
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => onEndDateChange(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: '#ffffff',
                        '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6ec6ff',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6ec6ff',
                          borderWidth: '2px',
                        },
                      },
                    },
                  },
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={onReset}
            startIcon={<RefreshIcon />}
            sx={{
              background: 'linear-gradient(135deg, #6ec6ff 0%, #a5d8ff 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '8px 24px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(110, 198, 255, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4db8ff 0%, #6ec6ff 100%)',
                boxShadow: '0 6px 16px rgba(110, 198, 255, 0.45)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Reset Filters
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default StatisticFilters;

