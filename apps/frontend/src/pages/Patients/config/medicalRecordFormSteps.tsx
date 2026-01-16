import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  Info,
  MedicalServices,
  Science,
  Title,
  Category,
  CalendarToday,
  Description,
  Healing,
  LocalPharmacy,
  Assessment,
} from '@mui/icons-material';
import { CreateMedicalRecordData, MedicalRecordType } from '../../../services/medicalRecordService';
import AttachmentUpload from '../../../components/MedicalRecords/AttachmentUpload';
import MedicalRecordAttachmentViewer from '../../../components/MedicalRecords/MedicalRecordAttachmentViewer';

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

const StepHeader: React.FC<{ icon: React.ReactNode; title: string; color: string }> = ({ icon, title, color }) => (
  <Box
    sx={{
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
      borderRadius: '12px',
      border: `1px solid ${alpha(color, 0.2)}`,
      padding: '14px 18px',
      marginBottom: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}
  >
    <Box
      sx={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
      {title}
    </Typography>
  </Box>
);


export const createMedicalRecordStepsConfig = (
  formData: CreateMedicalRecordData,
  handleDataChange: (data: Partial<CreateMedicalRecordData>) => void,
  isEditing: boolean = false,
  medicalRecordId?: string,
  existingAttachments: any[] = [],
  uploadedAttachments: any[] = [],
  onAttachmentUploaded?: (attachment: any) => void,
  onAttachmentDeleted?: (id: string) => void
) => {
  const step1Color = '#42a5f5';
  const step2Color = '#9c27b0';
  const step3Color = '#26a69a';

  const allExistingAttachments = [...existingAttachments, ...uploadedAttachments];

  return [
    {
      label: 'Basic Information',
      content: (
        <Box sx={{ p: 1 }}>
          <StepHeader
            icon={<Info sx={{ color: '#ffffff', fontSize: '20px' }} />}
            title="Basic Information"
            color={step1Color}
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleDataChange({ title: e.target.value })}
                required
                disabled={isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step1Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <Title sx={{ color: step1Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
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
                  startAdornment={
                    <InputAdornment position="start" sx={{ ml: 1 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step1Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Category sx={{ color: step1Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: '8px',
                  }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step1Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <CalendarToday sx={{ color: step1Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleDataChange({ description: e.target.value })}
                multiline
                rows={3}
                placeholder="Brief description of the medical record..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step1Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <Description sx={{ color: step1Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Clinical Details',
      content: (
        <Box sx={{ p: 1 }}>
          <StepHeader
            icon={<MedicalServices sx={{ color: '#ffffff', fontSize: '20px' }} />}
            title="Clinical Details"
            color={step2Color}
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                value={formData.diagnosis || ''}
                onChange={(e) => handleDataChange({ diagnosis: e.target.value })}
                multiline
                rows={3}
                placeholder="Enter diagnosis details..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step2Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <Healing sx={{ color: step2Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment"
                value={formData.treatment || ''}
                onChange={(e) => handleDataChange({ treatment: e.target.value })}
                multiline
                rows={3}
                placeholder="Enter treatment details..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step2Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <MedicalServices sx={{ color: step2Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medications"
                value={formData.medications || ''}
                onChange={(e) => handleDataChange({ medications: e.target.value })}
                multiline
                rows={2}
                placeholder="List medications prescribed..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step2Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <LocalPharmacy sx={{ color: step2Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Test Results & Attachments',
      content: (
        <Box sx={{ p: 1 }}>
          <StepHeader
            icon={<Science sx={{ color: '#ffffff', fontSize: '20px' }} />}
            title="Test Results & Attachments"
            color={step3Color}
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Results"
                value={formData.testResults || ''}
                onChange={(e) => handleDataChange({ testResults: e.target.value })}
                multiline
                rows={4}
                placeholder="Enter test results or findings..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
                      <Box
                        sx={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alpha(step3Color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <Assessment sx={{ color: step3Color, fontSize: '18px' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 3, fontWeight: 600 }}>
                Upload Attachments
              </Typography>
              <AttachmentUpload
                medicalRecordId={isEditing ? medicalRecordId : undefined}
                onFileSelect={(file) => {
                  const currentAttachments = formData.attachments || [];
                  handleDataChange({ attachments: [...currentAttachments, file] });
                }}
                onFileRemove={(index) => {
                  const currentAttachments = formData.attachments || [];
                  const newAttachments = currentAttachments.filter((_, i) => i !== index);
                  handleDataChange({ attachments: newAttachments });
                }}
                onUploadSuccess={onAttachmentUploaded}
                selectedFiles={formData.attachments || []}
              />

              {/* Show existing attachments when editing */}
              {allExistingAttachments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 600 }}>
                    Saved Attachments ({allExistingAttachments.length})
                  </Typography>
                  <MedicalRecordAttachmentViewer
                    attachments={allExistingAttachments}
                    showDelete={true}
                    onDelete={onAttachmentDeleted}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      ),
    },
  ];
};
