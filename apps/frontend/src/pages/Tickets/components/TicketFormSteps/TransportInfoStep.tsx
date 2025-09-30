import React from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
} from '@mui/material';
import { CreateTicketData } from '../../../../services/ticketService';

interface TransportInfoStepProps {
  formData: Partial<CreateTicketData>;
  onDataChange: (data: Partial<CreateTicketData>) => void;
}

const TransportInfoStep: React.FC<TransportInfoStepProps> = ({
  formData,
  onDataChange,
}) => {
  // Helper function to convert ISO-8601 string to datetime-local format
  const isoToDatetimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (field: string, value: any) => {
    // Convert datetime-local input to ISO-8601 format for emsContactTime
    if (field === 'emsContactTime' && value) {
      // Convert "YYYY-MM-DDTHH:MM" to "YYYY-MM-DDTHH:MM:SS.sssZ"
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        value = date.toISOString();
      }
    }
    onDataChange({ [field]: value });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Transport Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide transport details and additional notes
      </Typography>

      <Grid container spacing={3}>
        {/* Transport Mode */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Transport Mode</InputLabel>
            <Select
              value={formData.transportMode || ''}
              label="Transport Mode"
              onChange={(e) => handleInputChange('transportMode', e.target.value)}
            >
              <MenuItem value="">
                <em>Select transport mode (optional)</em>
              </MenuItem>
              <MenuItem value="AMBULANCE_RED_CRESCENT">Ambulance (Red Crescent)</MenuItem>
              <MenuItem value="PRIVATE_CAR">Private Car</MenuItem>
              <MenuItem value="TRANSFERRED_FROM_ANOTHER_HOSPITAL">Transferred from another hospital</MenuItem>
            </Select>
            <FormHelperText>
              Mode of transportation for the transfer
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* EMS Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="EMS Unit"
            value={formData.emsUnit || ''}
            onChange={(e) => handleInputChange('emsUnit', e.target.value)}
            placeholder="Enter EMS unit identifier..."
            helperText="EMS unit or team identifier (optional)"
          />
        </Grid>

        {/* EMS Contact Time */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="EMS Contact Time"
            type="datetime-local"
            value={isoToDatetimeLocal(formData.emsContactTime || '')}
            onChange={(e) => handleInputChange('emsContactTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Time when EMS will contact the patient"
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={4}
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter any additional notes or special instructions..."
            helperText="Additional information, special instructions, or notes about the transfer"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransportInfoStep;
