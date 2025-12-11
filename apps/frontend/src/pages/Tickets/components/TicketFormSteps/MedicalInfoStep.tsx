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
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { CreateTicketData } from '../../../../services/ticketService';

interface MedicalInfoStepProps {
  formData: Partial<CreateTicketData>;
  onDataChange: (data: Partial<CreateTicketData>) => void;
}

const MedicalInfoStep: React.FC<MedicalInfoStepProps> = ({
  formData,
  onDataChange,
}) => {
  const handleInputChange = (field: string, value: any) => {
    onDataChange({ [field]: value });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    onDataChange({ [field]: checked });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Medical Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide the medical details for this transfer request
      </Typography>

      <Grid container spacing={3}>
        {/* Priority */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Priority Level *</InputLabel>
            <Select
              value={formData.priority || 'MEDIUM'}
              label="Priority Level *"
              onChange={(e) => handleInputChange('priority', e.target.value)}
            >
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="EMERGENCY">Emergency</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Pathway */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Pathway *</InputLabel>
            <Select
              value={formData.pathway || 'GENERAL'}
              label="Pathway *"
              onChange={(e) => handleInputChange('pathway', e.target.value)}
            >
              <MenuItem value="GENERAL">General</MenuItem>
              <MenuItem value="STEMI">STEMI</MenuItem>
              <MenuItem value="STROKE">Stroke</MenuItem>
              <MenuItem value="TRAUMA">Trauma</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Conditional Time Inputs */}
        {formData.pathway === 'STEMI' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Triage Time"
              type="datetime-local"
              value={formData.triageTime || ''}
              onChange={(e) => handleInputChange('triageTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
        )}

        {formData.pathway === 'STROKE' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Symptom Onset Time"
              type="datetime-local"
              value={formData.symptomOnsetTime || ''}
              onChange={(e) => handleInputChange('symptomOnsetTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
        )}

        {/* Note */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Note"
            multiline
            rows={3}
            value={formData.treatmentPlan || ''}
            onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
            placeholder="Add any additional notes or comments..."
            helperText="Additional notes or comments about the transfer"
          />
        </Grid>

        {/* Special Requirements */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Special Requirements
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isEmergency || false}
                  onChange={(e) => handleCheckboxChange('isEmergency', e.target.checked)}
                />
              }
              label="Emergency Case"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiresBlood || false}
                  onChange={(e) => handleCheckboxChange('requiresBlood', e.target.checked)}
                />
              }
              label="Requires Blood"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiresSpecialist || false}
                  onChange={(e) => handleCheckboxChange('requiresSpecialist', e.target.checked)}
                />
              }
              label="Requires Specialist"
            />
          </FormGroup>
        </Grid>

        {/* Required Resources */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Required Resources
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.icu || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    icu: e.target.checked
                  })}
                />
              }
              label="ICU Bed"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.ventilator || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    ventilator: e.target.checked
                  })}
                />
              }
              label="Ventilator"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.cardiology || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    cardiology: e.target.checked
                  })}
                />
              }
              label="Cardiology"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.neurology || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    neurology: e.target.checked
                  })}
                />
              }
              label="Neurology"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.trauma || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    trauma: e.target.checked
                  })}
                />
              }
              label="Trauma"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.nicu || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    nicu: e.target.checked
                  })}
                />
              }
              label="NICU"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiredResources?.picu || false}
                  onChange={(e) => handleInputChange('requiredResources', {
                    ...formData.requiredResources,
                    picu: e.target.checked
                  })}
                />
              }
              label="PICU"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicalInfoStep;
