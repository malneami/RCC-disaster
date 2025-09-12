import React from 'react';
import {
  Alert,
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
  Chip,
  Autocomplete,
} from '@mui/material';
import { Ticket, UpdateTicketData } from '../../../services/ticketService';
import MultiStepDialog from '../../../components/Common/MultiStepDialog';
import { useTicketEditForm } from '../hooks/useTicketEditForm';

interface TicketEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateTicketData) => void;
  ticket: Ticket | null;
}

const TicketEditModal: React.FC<TicketEditModalProps> = ({
  open,
  onClose,
  onSubmit,
  ticket,
}) => {
  const { formData, loading, error, handleDataChange, handleComplete } = useTicketEditForm({
    ticket,
    open,
    onSubmit,
  });

  // Helper function to create steps configuration
  const createStepsConfig = (
    formData: Partial<UpdateTicketData>,
    onDataChange: (data: Partial<UpdateTicketData>) => void
  ) => [
    {
      label: 'Basic Information',
      content: (
        <BasicInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Medical Information',
      content: (
        <MedicalInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Transport Details',
      content: (
        <TransportInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Review',
      content: (
        <ReviewStep
          formData={formData}
          ticket={ticket}
        />
      ),
    },
  ];

  const steps = createStepsConfig(formData, handleDataChange);

  return (
    <>
      <MultiStepDialog
        open={open}
        title={`Edit Ticket ${ticket?.ticketNumber || ''}`}
        steps={steps}
        onClose={onClose}
        onComplete={handleComplete}
        loading={loading}
        maxWidth="lg"
        fullWidth
      />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

// Basic Information Step Component
const BasicInfoStep: React.FC<{
  formData: Partial<UpdateTicketData>;
  onDataChange: (data: Partial<UpdateTicketData>) => void;
}> = ({ formData, onDataChange }) => {
  const handleInputChange = (field: string, value: any) => {
    onDataChange({ [field]: value });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update the basic ticket information
      </Typography>

      <Grid container spacing={3}>
        {/* Priority */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority Level</InputLabel>
            <Select
              value={formData.priority || 'MEDIUM'}
              label="Priority Level"
              onChange={(e) => handleInputChange('priority', e.target.value)}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="EMERGENCY">Emergency</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Pathway */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Pathway</InputLabel>
            <Select
              value={formData.pathway || 'GENERAL'}
              label="Pathway"
              onChange={(e) => handleInputChange('pathway', e.target.value)}
            >
              <MenuItem value="STEMI">STEMI</MenuItem>
              <MenuItem value="STROKE">Stroke</MenuItem>
              <MenuItem value="TRAUMA">Trauma</MenuItem>
              <MenuItem value="GENERAL">General</MenuItem>
              <MenuItem value="CARDIAC">Cardiac</MenuItem>
              <MenuItem value="NEUROLOGY">Neurology</MenuItem>
              <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
              <MenuItem value="OBSTETRICS">Obstetrics</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Chief Complaint */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Chief Complaint"
            multiline
            rows={3}
            value={formData.chiefComplaint || ''}
            onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
            placeholder="Describe the primary reason for transfer..."
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
            placeholder="Describe the treatment plan..."
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes or comments..."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Medical Information Step Component
const MedicalInfoStep: React.FC<{
  formData: Partial<UpdateTicketData>;
  onDataChange: (data: Partial<UpdateTicketData>) => void;
}> = ({ formData, onDataChange }) => {

  const handleCheckboxChange = (field: string, checked: boolean) => {
    onDataChange({ [field]: checked });
  };

  const handleVitalsChange = (field: string, value: number | undefined) => {
    const currentVitals = formData.vitals || {};
    onDataChange({
      vitals: {
        ...currentVitals,
        [field]: value
      }
    });
  };

  const handleSymptomsChange = (symptoms: string[]) => {
    onDataChange({
      symptoms: { symptoms }
    });
  };

  const currentSymptoms = (formData.symptoms as any)?.symptoms || [];
  const currentVitals = formData.vitals || {};

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Medical Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update medical details and requirements
      </Typography>

      <Grid container spacing={3}>
        {/* Symptoms */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Symptoms
          </Typography>
          <Autocomplete
            multiple
            options={[
              'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Nausea', 'Vomiting',
              'Headache', 'Fever', 'Cough', 'Abdominal Pain', 'Back Pain',
              'Weakness', 'Confusion', 'Seizure', 'Loss of Consciousness',
              'Bleeding', 'Swelling', 'Rash', 'Fatigue'
            ]}
            value={currentSymptoms}
            onChange={(_, newValue) => handleSymptomsChange(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select symptoms"
              />
            )}
          />
        </Grid>

        {/* Vital Signs */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Vital Signs
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Blood Pressure (mmHg)"
            type="number"
            value={currentVitals.bloodPressure || ''}
            onChange={(e) => handleVitalsChange('bloodPressure', e.target.value ? Number(e.target.value) : undefined)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Heart Rate (bpm)"
            type="number"
            value={currentVitals.heartRate || ''}
            onChange={(e) => handleVitalsChange('heartRate', e.target.value ? Number(e.target.value) : undefined)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Temperature (°C)"
            type="number"
            value={currentVitals.temperature || ''}
            onChange={(e) => handleVitalsChange('temperature', e.target.value ? Number(e.target.value) : undefined)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Oxygen Saturation (%)"
            type="number"
            value={currentVitals.oxygenSaturation || ''}
            onChange={(e) => handleVitalsChange('oxygenSaturation', e.target.value ? Number(e.target.value) : undefined)}
          />
        </Grid>

        {/* Requirements */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Requirements
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isEmergency || false}
                onChange={(e) => handleCheckboxChange('isEmergency', e.target.checked)}
              />
            }
            label="Emergency Case"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.requiresBlood || false}
                onChange={(e) => handleCheckboxChange('requiresBlood', e.target.checked)}
              />
            }
            label="Requires Blood"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.requiresSpecialist || false}
                onChange={(e) => handleCheckboxChange('requiresSpecialist', e.target.checked)}
              />
            }
            label="Requires Specialist"
          />
        </Grid>

        {/* Required Resources */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Required Resources
          </Typography>
          <FormGroup>
            <Grid container spacing={1}>
              {Object.entries({
                icu: 'ICU',
                ventilator: 'Ventilator',
                cardiology: 'Cardiology',
                neurology: 'Neurology',
                trauma: 'Trauma',
                nicu: 'NICU',
                picu: 'PICU',
              }).map(([key, label]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={(formData.requiredResources as any)?.[key] || false}
                        onChange={(e) => {
                          const currentResources = formData.requiredResources || {};
                          onDataChange({
                            requiredResources: {
                              ...currentResources,
                              [key]: e.target.checked
                            }
                          });
                        }}
                      />
                    }
                    label={label}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );
};

// Transport Information Step Component
const TransportInfoStep: React.FC<{
  formData: Partial<UpdateTicketData>;
  onDataChange: (data: Partial<UpdateTicketData>) => void;
}> = ({ formData, onDataChange }) => {
  const handleInputChange = (field: string, value: any) => {
    onDataChange({ [field]: value });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Transport Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update transport details and timeline
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
              <MenuItem value="">Select Transport Mode</MenuItem>
              <MenuItem value="AMBULANCE">Ambulance</MenuItem>
              <MenuItem value="HELICOPTER">Helicopter</MenuItem>
              <MenuItem value="GROUND_TRANSPORT">Ground Transport</MenuItem>
              <MenuItem value="AIR_AMBULANCE">Air Ambulance</MenuItem>
              <MenuItem value="PRIVATE_VEHICLE">Private Vehicle</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* EMS Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="EMS Unit"
            value={formData.emsUnit || ''}
            onChange={(e) => handleInputChange('emsUnit', e.target.value)}
            placeholder="Enter EMS unit identifier"
          />
        </Grid>

        {/* EMS Contact Time */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="EMS Contact Time"
            type="datetime-local"
            value={formData.emsContactTime ? new Date(formData.emsContactTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleInputChange('emsContactTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Actual Arrival */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Actual Arrival"
            type="datetime-local"
            value={formData.actualArrival ? new Date(formData.actualArrival).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleInputChange('actualArrival', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Review Step Component
const ReviewStep: React.FC<{
  formData: Partial<UpdateTicketData>;
  ticket: Ticket | null;
}> = ({ formData, ticket }) => {
  if (!ticket) return null;

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Changes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the changes you've made to ticket {ticket.ticketNumber}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Patient Information
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {ticket.patient.firstName} {ticket.patient.lastName}
          </Typography>
          <Typography variant="body2">
            <strong>MRN:</strong> {ticket.patient.mrn || 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Hospital Information
          </Typography>
          <Typography variant="body2">
            <strong>Origin:</strong> {ticket.originHospital.name}
          </Typography>
          {ticket.destinationHospital && (
            <Typography variant="body2">
              <strong>Destination:</strong> {ticket.destinationHospital.name}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Updated Information
          </Typography>
          <Typography variant="body2">
            <strong>Priority:</strong> {formData.priority || ticket.priority}
          </Typography>
          <Typography variant="body2">
            <strong>Pathway:</strong> {formData.pathway || ticket.pathway}
          </Typography>
          <Typography variant="body2">
            <strong>Chief Complaint:</strong> {formData.chiefComplaint || ticket.chiefComplaint}
          </Typography>
          {formData.transportMode && (
            <Typography variant="body2">
              <strong>Transport Mode:</strong> {formData.transportMode}
            </Typography>
          )}
          {formData.emsUnit && (
            <Typography variant="body2">
              <strong>EMS Unit:</strong> {formData.emsUnit}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TicketEditModal;
