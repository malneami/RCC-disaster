import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  LocalHospital,
  Info,
  Phone,
  LocationOn,
  Hotel,
  MedicalServices,
  Settings,
  Save,
  Cancel,
} from '@mui/icons-material';
import { CreateHospitalDto } from '../../../services/hospitalService';
import { SectionHeader } from './SectionHeader';
import { HospitalBasicInfoForm } from './forms/HospitalBasicInfoForm';
import { HospitalContactForm } from './forms/HospitalContactForm';
import { HospitalLocationForm } from './forms/HospitalLocationForm';
import { HospitalBedCapacityForm } from './forms/HospitalBedCapacityForm';
import { HospitalServicesForm } from './forms/HospitalServicesForm';
import { HospitalAdditionalSettings } from './forms/HospitalAdditionalSettings';
import { useCreateHospitalForm } from '../hooks/useCreateHospitalForm';

interface CreateHospitalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHospitalDto) => void;
}

const CreateHospitalDialog: React.FC<CreateHospitalDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const {
    formData,
    errors,
    isSubmitting,
    traumaLevelRef,
    handleChange,
    handleSubmit,
    handleTraumaLevelOpen,
  } = useCreateHospitalForm(open, onSubmit, onClose);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <LocalHospital fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Create New Hospital
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new hospital to the RCC Healthcare network
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 0,
          pb: 2,
          overflowY: 'auto',
        }}
      >
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Please correct the highlighted fields before submitting.
          </Alert>
        )}

        <SectionHeader icon={<Info fontSize="small" />} title="General Information" />
        <HospitalBasicInfoForm
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        <SectionHeader icon={<Phone fontSize="small" />} title="Contact Details" />
        <HospitalContactForm
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        <SectionHeader icon={<LocationOn fontSize="small" />} title="Location" />
        <HospitalLocationForm
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        <SectionHeader icon={<Hotel fontSize="small" />} title="Bed Capacity" />
        <HospitalBedCapacityForm
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        <SectionHeader icon={<MedicalServices fontSize="small" />} title="Medical Services" />
        <HospitalServicesForm
          formData={formData}
          onChange={handleChange}
        />

        <SectionHeader icon={<Settings fontSize="small" />} title="Additional Settings" />
        <HospitalAdditionalSettings
          formData={formData}
          onChange={handleChange}
          onOpenTraumaLevel={handleTraumaLevelOpen}
          traumaLevelRef={traumaLevelRef}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          startIcon={<Cancel />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <Box sx={{ display: 'flex' }}><Box className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" /></Box> : <Save />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          {isSubmitting ? 'Creating...' : 'Create Hospital'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateHospitalDialog;
