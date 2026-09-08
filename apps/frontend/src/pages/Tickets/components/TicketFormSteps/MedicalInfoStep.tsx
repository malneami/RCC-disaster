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
              onChange={(e) => {
                const pathway = e.target.value;
                const updates: Partial<CreateTicketData> = { pathway };
                if (pathway === 'NEUROSURGICAL') {
                  updates.neurosurgicalData = {
                    severity: formData.neurosurgicalData?.severity || 'ORANGE',
                  };
                } else {
                  updates.neurosurgicalData = undefined;
                }
                onDataChange(updates);
              }}
            >
              <MenuItem value="GENERAL">General</MenuItem>
              <MenuItem value="STEMI">STEMI</MenuItem>
              <MenuItem value="STROKE">Stroke</MenuItem>
              <MenuItem value="TRAUMA">Trauma</MenuItem>
              <MenuItem value="MATERNAL">OB / Maternal</MenuItem>
              <MenuItem value="NEUROSURGICAL">Neurosurgical</MenuItem>
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

        {/* OB / Maternal pathway fields */}
        {formData.pathway === 'MATERNAL' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                OB Maternal Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Gestational Age (weeks) *"
                value={formData.obMaternalData?.gestationalAgeWeeks ?? ''}
                onChange={(e) =>
                  handleInputChange('obMaternalData', {
                    ...formData.obMaternalData,
                    gestationalAgeWeeks: parseInt(e.target.value, 10) || 0,
                    activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                  })
                }
                inputProps={{ min: 1, max: 45 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Gravida (G)"
                value={formData.obMaternalData?.gravida ?? ''}
                onChange={(e) =>
                  handleInputChange('obMaternalData', {
                    ...formData.obMaternalData,
                    gravida: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                    activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                  })
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Para (P)"
                value={formData.obMaternalData?.para ?? ''}
                onChange={(e) =>
                  handleInputChange('obMaternalData', {
                    ...formData.obMaternalData,
                    para: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                    activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                  })
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Abortions (A)"
                value={formData.obMaternalData?.abortions ?? ''}
                onChange={(e) =>
                  handleInputChange('obMaternalData', {
                    ...formData.obMaternalData,
                    abortions: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                    activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                  })
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Activation Level *</InputLabel>
                <Select
                  value={formData.obMaternalData?.activationLevel || 'MATERNAL_RED'}
                  label="Activation Level *"
                  onChange={(e) =>
                    handleInputChange('obMaternalData', {
                      ...formData.obMaternalData,
                      activationLevel: e.target.value as 'MATERNAL_RED' | 'MATERNAL_ORANGE',
                      gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                    })
                  }
                >
                  <MenuItem value="MATERNAL_RED">Maternal Red</MenuItem>
                  <MenuItem value="MATERNAL_ORANGE">Maternal Orange</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Expected Delivery Mode</InputLabel>
                <Select
                  value={formData.obMaternalData?.expectedDeliveryMode || 'PENDING'}
                  label="Expected Delivery Mode"
                  onChange={(e) =>
                    handleInputChange('obMaternalData', {
                      ...formData.obMaternalData,
                      expectedDeliveryMode: e.target.value as 'VAGINAL' | 'CESAREAN' | 'PENDING',
                      gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                      activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                    })
                  }
                >
                  <MenuItem value="VAGINAL">Vaginal</MenuItem>
                  <MenuItem value="CESAREAN">Cesarean</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Ambulance Type</InputLabel>
                <Select
                  value={formData.obMaternalData?.ambulanceType || 'ALS'}
                  label="Ambulance Type"
                  onChange={(e) =>
                    handleInputChange('obMaternalData', {
                      ...formData.obMaternalData,
                      ambulanceType: e.target.value as 'BLS' | 'ALS' | 'AIR',
                      gestationalAgeWeeks: formData.obMaternalData?.gestationalAgeWeeks || 0,
                      activationLevel: formData.obMaternalData?.activationLevel || 'MATERNAL_RED',
                    })
                  }
                >
                  <MenuItem value="BLS">BLS</MenuItem>
                  <MenuItem value="ALS">ALS</MenuItem>
                  <MenuItem value="AIR">Air</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        {/* Neurosurgical pathway — clinical severity (independent of Priority) */}
        {formData.pathway === 'NEUROSURGICAL' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Neurosurgical Severity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Clinical neuro color (Red / Orange). Ticket Priority stays as operational urgency.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity *</InputLabel>
                <Select
                  value={formData.neurosurgicalData?.severity || 'ORANGE'}
                  label="Severity *"
                  onChange={(e) =>
                    handleInputChange('neurosurgicalData', {
                      severity: e.target.value as 'RED' | 'ORANGE',
                    })
                  }
                >
                  <MenuItem value="RED">Neurosurgical Red</MenuItem>
                  <MenuItem value="ORANGE">Neurosurgical Orange</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
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
