import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import {
  FilterField,
  FilterForm,
  FilterChips,
  generateFilterChips,
  getActiveFiltersCount,
  resetFilters,
} from '../../components/Common/FilterComponents';

interface GenericFilterDialogProps {
  open: boolean;
  title?: string;
  fields: FilterField[];
  values: Record<string, any>;
  onClose: () => void;
  onApply: (values: Record<string, any>) => void;
  onReset?: () => void;
  applyButtonText?: string;
  resetButtonText?: string;
  cancelButtonText?: string;
}

const GenericFilterDialog: React.FC<GenericFilterDialogProps> = ({
  open,
  title = 'Filter',
  fields,
  values,
  onClose,
  onApply,
  onReset,
  applyButtonText = 'Apply Filters',
  resetButtonText = 'Reset All',
  cancelButtonText = 'Cancel',
}) => {
  const [localValues, setLocalValues] = React.useState<Record<string, any>>(values);

  React.useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleChange = (key: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleReset = () => {
    const resetValues = resetFilters(fields);
    setLocalValues(resetValues);
    if (onReset) {
      onReset();
    }
    onClose();
  };

  const handleChipDelete = (chip: any) => {
    handleChange(chip.key, chip.resetValue);
  };

  const activeFiltersCount = getActiveFiltersCount(fields, localValues);
  const filterChips = generateFilterChips(fields, localValues);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} active`} 
              color="primary" 
              size="small" 
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <FilterForm
            fields={fields}
            values={localValues}
            onChange={handleChange}
          />
          
          <FilterChips
            chips={filterChips}
            onDelete={handleChipDelete}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="secondary">
          {resetButtonText}
        </Button>
        <Button onClick={onClose}>
          {cancelButtonText}
        </Button>
        <Button onClick={handleApply} variant="contained">
          {applyButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenericFilterDialog;
