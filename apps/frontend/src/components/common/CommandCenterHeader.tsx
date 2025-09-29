import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useFullscreen } from '../../contexts/FullscreenContext';
import html2canvas from 'html2canvas';

interface CommandCenterHeaderProps {
  title: string;
  dashboardContentId: string;
  onDownloadPNG: () => void;
  onRefresh: () => void;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
    onHospitalChange: (hospitalId: string) => void;
    onDateRangeChange: (startDate: string, endDate: string) => void;
  };
  hospitals?: Array<{ id: string; name: string }>;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  title,
  dashboardContentId,
  onDownloadPNG: _onDownloadPNG,
  onRefresh,
  filters,
  hospitals = [],
}) => {
  const { isFullscreen } = useFullscreen();

  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      const element = document.getElementById(dashboardContentId);
      if (element) {
        const canvas = await html2canvas(element, {
          background: '#1a1a1a',
          useCORS: true,
          allowTaint: true,
        });
        
        const link = document.createElement('a');
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-dashboard.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error('Error downloading PNG:', error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        {/* Title */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          {title}
        </Typography>

        {/* Controls */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Filters */}
          {filters && (
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {/* Hospital Filter */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: '#ffffff' }}>Hospital</InputLabel>
                <Select
                  value={filters.hospitalId || ''}
                  onChange={(e) => filters.onHospitalChange(e.target.value)}
                  label="Hospital"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#ffffff',
                    },
                  }}
                >
                  <MenuItem value="">All Hospitals</MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Range Filters */}
              <TextField
                size="small"
                type="date"
                label="Start Date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  const startDate = e.target.value;
                  const endDate = filters.endDate || '';
                  filters.onDateRangeChange(startDate, endDate);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196f3',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  },
                }}
              />

              <TextField
                size="small"
                type="date"
                label="End Date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  const startDate = filters.startDate || '';
                  const endDate = e.target.value;
                  filters.onDateRangeChange(startDate, endDate);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196f3',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  },
                }}
              />

              {/* Clear Filters Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => filters.onDateRangeChange('', '')}
                sx={{
                  color: '#ffffff',
                  borderColor: '#555',
                  '&:hover': {
                    borderColor: '#777',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Clear
              </Button>
            </Stack>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={onRefresh}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download PNG">
              <IconButton
                onClick={handleDownloadPNG}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <IconButton
                onClick={handleFullscreenToggle}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};
