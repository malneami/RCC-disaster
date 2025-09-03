import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import { Close, Edit, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { MedicalRecord } from '../../../../services/medicalRecordService';
import { MEDICAL_RECORD_TYPES } from '../../config/medicalRecordFormSteps';

interface MedicalRecordDetailsDialogProps {
  open: boolean;
  medicalRecord: MedicalRecord | null;
  onClose: () => void;
  onEdit?: (medicalRecord: MedicalRecord) => void;
  onDelete?: (medicalRecord: MedicalRecord) => void;
}

const MedicalRecordDetailsDialog: React.FC<MedicalRecordDetailsDialogProps> = ({
  open,
  medicalRecord,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!medicalRecord) return null;

  const recordTypeLabel = MEDICAL_RECORD_TYPES.find(
    type => type.value === medicalRecord.recordType
  )?.label || medicalRecord.recordType;

  const formatField = (value: string | null | undefined) => {
    if (!value || value.trim() === '') return 'Not specified';
    return value;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Medical Record Details</Typography>
          <Button onClick={onClose} disabled={false}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Header Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                {medicalRecord.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={recordTypeLabel} color="primary" />
                <Chip 
                  label={format(new Date(medicalRecord.recordDate), 'PPP')} 
                  variant="outlined" 
                />
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.description)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created By
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {medicalRecord.createdBy 
                ? `${medicalRecord.createdBy.firstName} ${medicalRecord.createdBy.lastName}`
                : 'Unknown'
              }
            </Typography>
          </Grid>

          {/* Clinical Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Clinical Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Diagnosis
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.diagnosis)}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Treatment
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.treatment)}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Medications
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.medications)}
            </Typography>
          </Grid>

          {/* Test Results & Attachments */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Test Results & Attachments
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Test Results
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.testResults)}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Attachments
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatField(medicalRecord.attachments)}
            </Typography>
          </Grid>

          {/* System Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              System Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created At
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {format(new Date(medicalRecord.createdAt), 'PPpp')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {format(new Date(medicalRecord.updatedAt), 'PPpp')}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => onEdit(medicalRecord)}
          >
            Edit Record
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(medicalRecord)}
          >
            Delete Record
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MedicalRecordDetailsDialog;
