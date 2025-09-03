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
              <MenuItem value="LOW">Low Priority</MenuItem>
              <MenuItem value="MEDIUM">Medium Priority</MenuItem>
              <MenuItem value="HIGH">High Priority</MenuItem>
              <MenuItem value="CRITICAL">Critical Priority</MenuItem>
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
              <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
              <MenuItem value="OBSTETRICS">Obstetrics</MenuItem>
              <MenuItem value="NEUROLOGY">Neurology</MenuItem>
              <MenuItem value="CARDIOLOGY">Cardiology</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Chief Complaint */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Chief Complaint *"
            multiline
            rows={3}
            value={formData.chiefComplaint || ''}
            onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
            placeholder="Describe the primary reason for transfer..."
            helperText="Provide a clear description of the patient's main complaint"
          />
        </Grid>

        {/* Symptoms */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Symptoms *"
            multiline
            rows={3}
            value={formData.symptoms?.symptoms?.join(', ') || ''}
            onChange={(e) => handleInputChange('symptoms', { symptoms: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            placeholder="List symptoms separated by commas..."
            helperText="Enter symptoms separated by commas (e.g., chest pain, shortness of breath, fever)"
          />
        </Grid>

        {/* Treatment Plan */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Treatment Plan"
            multiline
            rows={3}
            value={formData.treatmentPlan || ''}
            onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
            placeholder="Describe current treatment plan..."
            helperText="Current treatment being provided to the patient"
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
