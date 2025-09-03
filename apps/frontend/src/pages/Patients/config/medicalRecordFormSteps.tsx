import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { CreateMedicalRecordData, MedicalRecordType } from '../../../services/medicalRecordService';

export const MEDICAL_RECORD_TYPES: { value: MedicalRecordType; label: string }[] = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'SURGERY', label: 'Surgery' },
  { value: 'MEDICATION', label: 'Medication' },
  { value: 'VACCINATION', label: 'Vaccination' },
  { value: 'ALLERGY', label: 'Allergy' },
  { value: 'CHRONIC_CONDITION', label: 'Chronic Condition' },
  { value: 'EMERGENCY_VISIT', label: 'Emergency Visit' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'DISCHARGE', label: 'Discharge' },
  { value: 'OTHER', label: 'Other' },
];

export const createMedicalRecordStepsConfig = (
  formData: CreateMedicalRecordData,
  handleDataChange: (data: Partial<CreateMedicalRecordData>) => void,
  isEditing: boolean = false
) => [
  {
    label: 'Basic Information',
    content: (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleDataChange({ title: e.target.value })}
              required
              disabled={isEditing}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Record Type</InputLabel>
              <Select
                value={formData.recordType}
                label="Record Type"
                onChange={(e) => handleDataChange({ recordType: e.target.value as MedicalRecordType })}
                disabled={isEditing}
              >
                {MEDICAL_RECORD_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Record Date"
              type="date"
              value={formData.recordDate}
              onChange={(e) => handleDataChange({ recordDate: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleDataChange({ description: e.target.value })}
              multiline
              rows={3}
              placeholder="Brief description of the medical record..."
            />
          </Grid>
        </Grid>
      </Box>
    ),
  },
  {
    label: 'Clinical Details',
    content: (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Clinical Details
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleDataChange({ diagnosis: e.target.value })}
              multiline
              rows={3}
              placeholder="Enter diagnosis details..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Treatment"
              value={formData.treatment}
              onChange={(e) => handleDataChange({ treatment: e.target.value })}
              multiline
              rows={3}
              placeholder="Enter treatment details..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medications"
              value={formData.medications}
              onChange={(e) => handleDataChange({ medications: e.target.value })}
              multiline
              rows={2}
              placeholder="List medications prescribed..."
            />
          </Grid>
        </Grid>
      </Box>
    ),
  },
  {
    label: 'Test Results & Attachments',
    content: (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Test Results & Attachments
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Test Results"
              value={formData.testResults}
              onChange={(e) => handleDataChange({ testResults: e.target.value })}
              multiline
              rows={4}
              placeholder="Enter test results or findings..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Attachments"
              value={formData.attachments}
              onChange={(e) => handleDataChange({ attachments: e.target.value })}
              multiline
              rows={2}
              placeholder="List file attachments or references..."
              helperText="Enter file names or references to attached documents"
            />
          </Grid>
        </Grid>
      </Box>
    ),
  },
];
