import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
  options?: { value: any; label: string }[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  validation?: (value: any) => string | null;
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onClose: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  sx?: any;
}

const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  fields,
  initialData = {},
  onSubmit,
  onClose,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  loading = false,
  maxWidth = 'md',
  fullWidth = true,
  sx = {},
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.key];
      
      // Required validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.key] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation && value !== undefined && value !== null) {
        const validationError = field.validation(value);
        if (validationError) {
          newErrors[field.key] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key];
    const error = errors[field.key];
    const gridSize = field.gridSize || { xs: 12, sm: 6 };

    const commonProps = {
      fullWidth: true,
      error: !!error,
      helperText: error,
      value: value || '',
      onChange: (e: any) => handleChange(field.key, e.target.value),
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg} key={field.key}>
            <TextField
              {...commonProps}
              label={field.label}
              type={field.type}
              multiline={field.multiline}
              rows={field.rows}
            />
          </Grid>
        );

      case 'number':
        return (
          <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg} key={field.key}>
            <TextField
              {...commonProps}
              label={field.label}
              type="number"
              onChange={(e) => handleChange(field.key, e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </Grid>
        );

      case 'textarea':
        return (
          <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg} key={field.key}>
            <TextField
              {...commonProps}
              label={field.label}
              multiline
              rows={field.rows || 4}
            />
          </Grid>
        );

      case 'select':
        return (
          <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg} key={field.key}>
            <FormControl fullWidth error={!!error}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={value || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                label={field.label}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </Grid>
        );

      case 'boolean':
        return (
          <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md} lg={gridSize.lg} key={field.key}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!value}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                />
              }
              label={field.label}
            />
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {error}
              </Typography>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
      sx={sx}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {fields.map(renderField)}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {cancelButtonText}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isSubmitting || loading}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;
