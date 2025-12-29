import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  Alert,
  Paper,
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

interface CreateHospitalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHospitalDto) => void;
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
  <Box sx={{ mt: 3, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
    </Box>
    <Divider />
  </Box>
);

const CreateHospitalDialog: React.FC<CreateHospitalDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateHospitalDto>({
    name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    icuBeds: 0,
    icuBedsAvailable: 0,
    picuBeds: 0,
    picuBedsAvailable: 0,
    maleBeds: 0,
    maleBedsAvailable: 0,
    femaleBeds: 0,
    femaleBedsAvailable: 0,
    pediatricBeds: 0,
    pediatricBedsAvailable: 0,
    standardBeds: 0,
    standardBedsAvailable: 0,
    hasStemiService: false,
    hasStrokeService: false,
    hasTraumaService: false,
    cluster: 'Jazan',
    status: 'AVAILABLE',
    contactPhone: '',
    contactEmail: '',
    emergencyDeptStatus: 'available',
    nicuBeds: 0,
    nicuBedsAvailable: 0,
    hasStrokeUnit: false,
    traumaLevel: 'NONE',
    hasCardiologyCenter: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const traumaLevelRef = useRef<HTMLDivElement>(null);

  const handleTraumaLevelOpen = () => {
    setTimeout(() => {
      traumaLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setFormData({
        name: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        icuBeds: 0,
        icuBedsAvailable: 0,
        picuBeds: 0,
        picuBedsAvailable: 0,
        maleBeds: 0,
        maleBedsAvailable: 0,
        femaleBeds: 0,
        femaleBedsAvailable: 0,
        pediatricBeds: 0,
        pediatricBedsAvailable: 0,
        standardBeds: 0,
        standardBedsAvailable: 0,
        hasStemiService: false,
        hasStrokeService: false,
        hasTraumaService: false,
        cluster: 'Jazan',
        status: 'AVAILABLE',
        contactPhone: '',
        contactEmail: '',
        emergencyDeptStatus: 'available',
        nicuBeds: 0,
        nicuBedsAvailable: 0,
        hasStrokeUnit: false,
        traumaLevel: 'NONE',
        hasCardiologyCenter: false,
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (field: keyof CreateHospitalDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Hospital name is required';
    }
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    // Email validation
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    // Latitude validation
    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    // Longitude validation
    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Bed validations
    const bedFields = [
      'icuBeds', 'icuBedsAvailable', 'picuBeds', 'picuBedsAvailable',
      'maleBeds', 'maleBedsAvailable', 'femaleBeds', 'femaleBedsAvailable',
      'pediatricBeds', 'pediatricBedsAvailable', 'standardBeds', 'standardBedsAvailable',
      'nicuBeds', 'nicuBedsAvailable',
    ] as const;

    bedFields.forEach((field) => {
      if (formData[field] !== undefined && formData[field] < 0) {
        newErrors[field] = 'Cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&.Mui-error': {
        '& fieldset': {
          borderColor: 'error.main',
          borderWidth: 2,
        },
      },
    },
  };

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

        {/* General Information Section */}
        <SectionHeader icon={<Info fontSize="small" />} title="General Information" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Hospital Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              required
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={textFieldSx}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'AVAILABLE'}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="AVAILABLE">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Available
                  </Box>
                </MenuItem>
                <MenuItem value="ACTIVE">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                    Active
                  </Box>
                </MenuItem>
                <MenuItem value="LIMITED">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    Limited
                  </Box>
                </MenuItem>
                <MenuItem value="CRITICAL">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    Critical
                  </Box>
                </MenuItem>
                <MenuItem value="OFFLINE">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.500' }} />
                    Offline
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={textFieldSx}>
              <InputLabel>Cluster</InputLabel>
              <Select
                value={formData.cluster || 'Jazan'}
                onChange={(e) => handleChange('cluster', e.target.value)}
                label="Cluster"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="Jazan">Jazan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Contact Details Section */}
        <SectionHeader icon={<Phone fontSize="small" />} title="Contact Details" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contactPhone || ''}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+966 50 123 4567"
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              error={!!errors.contactEmail}
              helperText={errors.contactEmail}
              sx={textFieldSx}
            />
          </Grid>
        </Grid>

        {/* Location Section */}
        <SectionHeader icon={<LocationOn fontSize="small" />} title="Location" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={formData.latitude ?? ''}
              onChange={(e) => handleChange('latitude', e.target.value === '' ? undefined : Number(e.target.value))}
              error={!!errors.latitude}
              helperText={errors.latitude || 'Range: -90 to 90'}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              value={formData.longitude ?? ''}
              onChange={(e) => handleChange('longitude', e.target.value === '' ? undefined : Number(e.target.value))}
              error={!!errors.longitude}
              helperText={errors.longitude || 'Range: -180 to 180'}
              sx={textFieldSx}
            />
          </Grid>
        </Grid>

        {/* Bed Capacity Section */}
        <SectionHeader icon={<Hotel fontSize="small" />} title="Bed Capacity" />

        {/* ICU Beds */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
            ICU Beds
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Total"
                type="number"
                value={formData.icuBeds ?? 0}
                onChange={(e) => handleChange('icuBeds', Number(e.target.value))}
                error={!!errors.icuBeds}
                helperText={errors.icuBeds}
                size="small"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Available"
                type="number"
                value={formData.icuBedsAvailable ?? 0}
                onChange={(e) => handleChange('icuBedsAvailable', Number(e.target.value))}
                error={!!errors.icuBedsAvailable}
                helperText={errors.icuBedsAvailable}
                size="small"
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* PICU and NICU Beds */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                PICU Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.picuBeds ?? 0}
                    onChange={(e) => handleChange('picuBeds', Number(e.target.value))}
                    error={!!errors.picuBeds}
                    helperText={errors.picuBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.picuBedsAvailable ?? 0}
                    onChange={(e) => handleChange('picuBedsAvailable', Number(e.target.value))}
                    error={!!errors.picuBedsAvailable}
                    helperText={errors.picuBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                NICU Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.nicuBeds ?? 0}
                    onChange={(e) => handleChange('nicuBeds', Number(e.target.value))}
                    error={!!errors.nicuBeds}
                    helperText={errors.nicuBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.nicuBedsAvailable ?? 0}
                    onChange={(e) => handleChange('nicuBedsAvailable', Number(e.target.value))}
                    error={!!errors.nicuBedsAvailable}
                    helperText={errors.nicuBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Male and Female Beds */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                Male Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.maleBeds ?? 0}
                    onChange={(e) => handleChange('maleBeds', Number(e.target.value))}
                    error={!!errors.maleBeds}
                    helperText={errors.maleBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.maleBedsAvailable ?? 0}
                    onChange={(e) => handleChange('maleBedsAvailable', Number(e.target.value))}
                    error={!!errors.maleBedsAvailable}
                    helperText={errors.maleBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                Female Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.femaleBeds ?? 0}
                    onChange={(e) => handleChange('femaleBeds', Number(e.target.value))}
                    error={!!errors.femaleBeds}
                    helperText={errors.femaleBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.femaleBedsAvailable ?? 0}
                    onChange={(e) => handleChange('femaleBedsAvailable', Number(e.target.value))}
                    error={!!errors.femaleBedsAvailable}
                    helperText={errors.femaleBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Pediatric and Standard Beds */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                Pediatric Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.pediatricBeds ?? 0}
                    onChange={(e) => handleChange('pediatricBeds', Number(e.target.value))}
                    error={!!errors.pediatricBeds}
                    helperText={errors.pediatricBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.pediatricBedsAvailable ?? 0}
                    onChange={(e) => handleChange('pediatricBedsAvailable', Number(e.target.value))}
                    error={!!errors.pediatricBedsAvailable}
                    helperText={errors.pediatricBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                Standard Beds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={formData.standardBeds ?? 0}
                    onChange={(e) => handleChange('standardBeds', Number(e.target.value))}
                    error={!!errors.standardBeds}
                    helperText={errors.standardBeds}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Available"
                    type="number"
                    value={formData.standardBedsAvailable ?? 0}
                    onChange={(e) => handleChange('standardBedsAvailable', Number(e.target.value))}
                    error={!!errors.standardBedsAvailable}
                    helperText={errors.standardBedsAvailable}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Services Section */}
        <SectionHeader icon={<MedicalServices fontSize="small" />} title="Medical Services" />
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.hasStemiService}
                    onChange={(e) => handleChange('hasStemiService', e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ❤️ STEMI Service
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.hasStrokeService}
                    onChange={(e) => handleChange('hasStrokeService', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    🧠 Stroke Service
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.hasTraumaService}
                    onChange={(e) => handleChange('hasTraumaService', e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    🚑 Trauma Service
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.hasStrokeUnit}
                    onChange={(e) => handleChange('hasStrokeUnit', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Stroke Unit
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.hasCardiologyCenter}
                    onChange={(e) => handleChange('hasCardiologyCenter', e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Cardiology Center
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Additional Settings Section */}
        <SectionHeader icon={<Settings fontSize="small" />} title="Additional Settings" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={textFieldSx} ref={traumaLevelRef}>
              <InputLabel>Trauma Level</InputLabel>
              <Select
                value={formData.traumaLevel || 'NONE'}
                onChange={(e) => handleChange('traumaLevel', e.target.value)}
                label="Trauma Level"
                onOpen={handleTraumaLevelOpen}
                sx={{ borderRadius: 2 }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 120,
                      mt: 0.5,
                    },
                  },
                }}
              >
                <MenuItem value="NONE">None</MenuItem>
                <MenuItem value="LEVEL_1">Level 1 (Highest)</MenuItem>
                <MenuItem value="LEVEL_2">Level 2</MenuItem>
                <MenuItem value="LEVEL_3">Level 3</MenuItem>
                <MenuItem value="LEVEL_4">Level 4</MenuItem>
                <MenuItem value="LEVEL_5">Level 5</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={textFieldSx}>
              <InputLabel>Emergency Department Status</InputLabel>
              <Select
                value={formData.emergencyDeptStatus || 'available'}
                onChange={(e) => handleChange('emergencyDeptStatus', e.target.value)}
                label="Emergency Department Status"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="available">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Available
                  </Box>
                </MenuItem>
                <MenuItem value="limited">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    Limited
                  </Box>
                </MenuItem>
                <MenuItem value="closed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    Closed
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          startIcon={<Cancel />}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Save />}
          sx={{
            borderRadius: 2,
            minWidth: 160,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create Hospital'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateHospitalDialog;
