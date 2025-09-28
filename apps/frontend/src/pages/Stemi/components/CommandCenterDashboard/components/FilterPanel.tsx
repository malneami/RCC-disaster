import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { CommandCenterFilters } from '../types';
import { hospitalService } from '../../../../../services/hospitalService';

interface FilterPanelProps {
  filters: CommandCenterFilters;
  onFiltersChange: (filters: CommandCenterFilters) => void;
  language: 'en' | 'ar';
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  language,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsData = await hospitalService.getAllHospitals();
        // Filter for Zone 1 hospitals based on the names you mentioned
        const zone1Hospitals = hospitalsData.filter((hospital: any) => 
          hospital.name.toLowerCase().includes('prince mohammed') ||
          hospital.name.toLowerCase().includes('king fahad') ||
          hospital.name.toLowerCase().includes('jazan specialized') ||
          hospital.name.toLowerCase().includes('dhamad') ||
          hospital.name.toLowerCase().includes('sabya')
        );
        
        // Add "All Hospitals" option at the beginning
        const allHospitals = [
          { id: 'all', name: language === 'ar' ? 'جميع المستشفيات' : 'All Hospitals' },
          ...zone1Hospitals
        ];
        
        setHospitals(allHospitals);
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
        // Fallback to default hospitals
        setHospitals([
          { id: 'all', name: language === 'ar' ? 'جميع المستشفيات' : 'All Hospitals' },
          { id: 'hospital1', name: 'Prince Mohamed Hospital' },
          { id: 'hospital2', name: 'King Fahd Hospital' },
          { id: 'hospital3', name: 'Jazan Specialized Hospital' },
          { id: 'hospital4', name: 'Dahmad Hospital' },
          { id: 'hospital5', name: 'Sabya Hospital' },
        ]);
      }
    };

    fetchHospitals();
  }, [language]);

  const handleFilterChange = (field: keyof CommandCenterFilters, value: string) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: CommandCenterFilters = {
      hospitalId: 'all',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };


  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Box
        sx={{
          p: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مرشحات البيانات' : 'Data Filters'}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleResetFilters();
            }}
            sx={{
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </Button>
          
          <IconButton sx={{ color: '#ffffff' }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label={language === 'ar' ? 'المستشفى' : 'Hospital'}
                value={localFilters.hospitalId}
                onChange={(e) => handleFilterChange('hospitalId', e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#666666',
                    },
                    '&:hover fieldset': {
                      borderColor: '#888888',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64b5f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0b0b0',
                    '&.Mui-focused': {
                      color: '#64b5f6',
                    },
                  },
                }}
              >
                {hospitals.map((hospital) => (
                  <MenuItem 
                    key={hospital.id} 
                    value={hospital.id}
                    sx={{
                      backgroundColor: '#2a2a2a',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#3a3a3a',
                      },
                    }}
                  >
                    {hospital.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                value={localFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#666666',
                    },
                    '&:hover fieldset': {
                      borderColor: '#888888',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64b5f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0b0b0',
                    '&.Mui-focused': {
                      color: '#64b5f6',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label={language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                value={localFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#666666',
                    },
                    '&:hover fieldset': {
                      borderColor: '#888888',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64b5f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0b0b0',
                    '&.Mui-focused': {
                      color: '#64b5f6',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" height="100%">
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  {language === 'ar' 
                    ? `تم تطبيق المرشحات: ${localFilters.hospitalId === 'all' ? 'جميع المستشفيات' : hospitals.find(h => h.id === localFilters.hospitalId)?.name}`
                    : `Filters applied: ${localFilters.hospitalId === 'all' ? 'All Hospitals' : hospitals.find(h => h.id === localFilters.hospitalId)?.name}`
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FilterPanel;
