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
} from '../../../components/Common/FilterComponents';

interface LiveFilterDialogProps {
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

const LiveFilterDialog: React.FC<LiveFilterDialogProps> = ({
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

  React.useEffect(() => {
    if (!open) {
      setLocalValues(values);
    }
  }, [open, values]);

  const handleChange = (key: string, value: any) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
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
        <Box mb={2}>
          <FilterChips
            chips={filterChips}
            onDelete={handleChipDelete}
          />
        </Box>
        
        <FilterForm
          fields={fields}
          values={localValues}
          onChange={handleChange}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {cancelButtonText}
        </Button>
        <Button onClick={handleReset} color="secondary">
          {resetButtonText}
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          {applyButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LiveFilterDialog;
