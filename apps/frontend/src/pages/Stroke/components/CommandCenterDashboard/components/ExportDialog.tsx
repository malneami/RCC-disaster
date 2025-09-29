import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Box,
} from '@mui/material';
// Note: Export functionality will be implemented later

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
  language: 'en' | 'ar';
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  language,
}) => {
  const [exportOptions, setExportOptions] = useState<any>({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  });

  const handleExport = () => {
    // Implement export functionality here
    console.log('Exporting with options:', exportOptions);
    onClose();
  };

  const handleOptionChange = (field: string, value: any) => {
    setExportOptions((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setExportOptions((prev: any) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
        {language === 'ar' ? 'تصدير لوحة القيادة' : 'Export Dashboard'}
      </DialogTitle>
      
      <DialogContent sx={{ backgroundColor: '#1e1e1e', color: '#ffffff' }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#b0b0b0' }}>
                {language === 'ar' ? 'نوع الملف' : 'File Format'}
              </InputLabel>
              <Select
                value={exportOptions.format}
                onChange={(e) => handleOptionChange('format', e.target.value)}
                label={language === 'ar' ? 'نوع الملف' : 'File Format'}
                sx={{
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#666666',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#888888',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#64b5f6',
                  },
                }}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="image">Image (PNG)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#b0b0b0' }}>
                {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
              </InputLabel>
              <input
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                style={{
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: '1px solid #666666',
                  borderRadius: '4px',
                  padding: '14px',
                  fontSize: '16px',
                  width: '100%',
                }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#b0b0b0' }}>
                {language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
              </InputLabel>
              <input
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                style={{
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: '1px solid #666666',
                  borderRadius: '4px',
                  padding: '14px',
                  fontSize: '16px',
                  width: '100%',
                }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #444444', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff', mb: 2 }}>
                {language === 'ar' ? 'خيارات التصدير' : 'Export Options'}
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeCharts}
                    onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                    sx={{
                      color: '#64b5f6',
                      '&.Mui-checked': {
                        color: '#64b5f6',
                      },
                    }}
                  />
                }
                label={language === 'ar' ? 'تضمين الرسوم البيانية' : 'Include Charts'}
                sx={{ color: '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeData}
                    onChange={(e) => handleOptionChange('includeData', e.target.checked)}
                    sx={{
                      color: '#64b5f6',
                      '&.Mui-checked': {
                        color: '#64b5f6',
                      },
                    }}
                  />
                }
                label={language === 'ar' ? 'تضمين البيانات' : 'Include Data'}
                sx={{ color: '#ffffff' }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ backgroundColor: '#1e1e1e', borderTop: '1px solid #333333' }}>
        <Button onClick={onClose} sx={{ color: '#ffffff' }}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#64b5f6',
            '&:hover': {
              backgroundColor: '#42a5f5',
            },
          }}
        >
          {language === 'ar' ? 'تصدير' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
