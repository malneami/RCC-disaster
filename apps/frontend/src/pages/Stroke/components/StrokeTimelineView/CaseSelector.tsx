import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';

import { StrokeCase } from '../../../../services/strokeService';

interface CaseSelectorProps {
  cases: StrokeCase[];
  selectedCaseId: string;
  onCaseSelect: (caseId: string) => void;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCaseId,
  onCaseSelect,
}) => {
  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No stroke cases available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a stroke case to view its timeline
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Stroke Case Timeline
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Select Case</InputLabel>
        <Select
          value={selectedCaseId}
          label="Select Case"
          onChange={(e) => onCaseSelect(e.target.value)}
        >
          <MenuItem value="">
            <em>Select a case to view timeline</em>
          </MenuItem>
          {cases.map((case_) => (
            <MenuItem key={case_.id} value={case_.id}>
              {case_.patient?.firstName} {case_.patient?.lastName} - {case_.strokeType} 
              ({case_.id.slice(-8).toUpperCase()})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CaseSelector;
