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
  Box,
  Typography,
  TextField,
  Alert,
} from '@mui/material';
import { CommandCenterData, ExportOptions } from '../types';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  data,
  language,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleFormatChange = (format: 'pdf' | 'image') => {
    setExportOptions(prev => ({ ...prev, format }));
  };

  const handleIncludeChartsChange = (includeCharts: boolean) => {
    setExportOptions(prev => ({ ...prev, includeCharts }));
  };

  const handleIncludeDataChange = (includeData: boolean) => {
    setExportOptions(prev => ({ ...prev, includeData }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setExportOptions(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value },
    }));
  };

  const handleExport = async () => {
    if (!data) return;

    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would implement actual export logic
      // For PDF: Use html2canvas + jsPDF or similar
      // For Image: Use html2canvas
      
      console.log('Exporting with options:', exportOptions);
      
      // Show success message
      alert(language === 'ar' ? 'تم تصدير البيانات بنجاح!' : 'Data exported successfully!');
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {language === 'ar' ? 'تصدير لوحة القيادة' : 'Export Dashboard'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>
              {language === 'ar' ? 'تنسيق التصدير' : 'Export Format'}
            </InputLabel>
            <Select
              value={exportOptions.format}
              onChange={(e) => handleFormatChange(e.target.value as 'pdf' | 'image')}
              label={language === 'ar' ? 'تنسيق التصدير' : 'Export Format'}
            >
              <MenuItem value="pdf">PDF Document</MenuItem>
              <MenuItem value="image">High-Resolution Image</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {language === 'ar' ? 'محتوى التصدير' : 'Export Content'}
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeCharts}
                  onChange={(e) => handleIncludeChartsChange(e.target.checked)}
                />
              }
              label={language === 'ar' ? 'تضمين الرسوم البيانية' : 'Include Charts'}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeData}
                  onChange={(e) => handleIncludeDataChange(e.target.checked)}
                />
              }
              label={language === 'ar' ? 'تضمين البيانات التفصيلية' : 'Include Detailed Data'}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {language === 'ar' ? 'نطاق التاريخ' : 'Date Range'}
            </Typography>
            
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                type="date"
                label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                value={exportOptions.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                fullWidth
                type="date"
                label={language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                value={exportOptions.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            {language === 'ar' 
              ? 'سيتم تصدير البيانات بناءً على المرشحات المطبقة حالياً. تأكد من أن جميع الرسوم البيانية مرئية قبل التصدير.'
              : 'Data will be exported based on currently applied filters. Ensure all charts are visible before exporting.'
            }
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={isExporting}
        >
          {isExporting 
            ? (language === 'ar' ? 'جاري التصدير...' : 'Exporting...')
            : (language === 'ar' ? 'تصدير' : 'Export')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
