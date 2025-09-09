import React from 'react';
import { HospitalFilters } from '../../../services/hospitalService';
import GenericFilterDialog from '../../../components/Common/GenericFilterDialog';
import { hospitalFilterFields, hospitalFiltersToValues, valuesToHospitalFilters } from '../config/hospitalFilters';

interface FilterDialogProps {
  open: boolean;
  filters: HospitalFilters;
  onClose: () => void;
  onApply: (filters: HospitalFilters) => void;
  onReset: () => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const handleApply = (values: Record<string, any>) => {
    const hospitalFilters = valuesToHospitalFilters(values);
    onApply(hospitalFilters);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <GenericFilterDialog
      open={open}
      title="Filter Hospitals"
      fields={hospitalFilterFields}
      values={hospitalFiltersToValues(filters)}
      onClose={onClose}
      onApply={handleApply}
      onReset={handleReset}
      applyButtonText="Apply Filters"
      resetButtonText="Reset All"
      cancelButtonText="Cancel"
    />
  );
};

export default FilterDialog;
