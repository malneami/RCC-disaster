import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Unit } from '../services/bedService';

interface UnitFilterProps {
  units: Unit[];
  selectedUnitId: string | null;
  onUnitChange: (unitId: string | null) => void;
  loading?: boolean;
}

export const UnitFilter: React.FC<UnitFilterProps> = ({
  units,
  selectedUnitId,
  onUnitChange,
  loading = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onUnitChange(value === 'all' ? null : value);
  };

  return (
    <FormControl sx={{ minWidth: 200 }} size="small">
      <InputLabel id="unit-filter-label">Filter by Unit</InputLabel>
      <Select
        labelId="unit-filter-label"
        id="unit-filter"
        value={selectedUnitId || 'all'}
        label="Filter by Unit"
        onChange={handleChange}
        disabled={loading}
      >
        <MenuItem value="all">All Units</MenuItem>
        {units.map((unit) => (
          <MenuItem key={unit.id} value={unit.id}>
            {unit.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

