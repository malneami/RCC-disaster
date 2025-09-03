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
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Download, Close } from '@mui/icons-material';

export interface ExportOptions {
  format: 'PDF' | 'JSON' | 'CSV';
  includeMedicalRecords: boolean;
  includeAccessLogs: boolean;
  includeTickets: boolean;
}

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  title: string;
  entityName: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  onExport,
  title,
  entityName,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'PDF',
    includeMedicalRecords: true,
    includeAccessLogs: false,
    includeTickets: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      await onExport(options);
      setShowSuccess(true);
      onClose();
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          <Button onClick={handleClose} disabled={loading}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose export format and options for {entityName}
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={options.format}
              label="Export Format"
              onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
              disabled={loading}
            >
              <MenuItem value="PDF">PDF Document</MenuItem>
              <MenuItem value="JSON">JSON Data</MenuItem>
              <MenuItem value="CSV">CSV Spreadsheet</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeMedicalRecords}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeMedicalRecords: e.target.checked 
                  }))}
                  disabled={loading}
                />
              }
              label="Include Medical Records"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeTickets}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeTickets: e.target.checked 
                  }))}
                  disabled={loading}
                />
              }
              label="Include Tickets"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeAccessLogs}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeAccessLogs: e.target.checked 
                  }))}
                  disabled={loading}
                />
              }
              label="Include Access Logs"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Download />}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Success Snackbar */}
    <Snackbar
      open={showSuccess}
      autoHideDuration={4000}
      onClose={() => setShowSuccess(false)}
      message="Export completed successfully!"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  </>
  );
};

export default ExportDialog;
