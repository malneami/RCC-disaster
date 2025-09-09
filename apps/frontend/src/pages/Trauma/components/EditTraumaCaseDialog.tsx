import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { TraumaCase, TraumaService } from '../../../services/traumaService';
import { useAuth } from '../../../contexts/AuthContext';
import HospitalSelect from '../../../components/Common/HospitalSelect';

interface EditTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  traumaCase: TraumaCase | null;
}

const EditTraumaCaseDialog: React.FC<EditTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  traumaCase,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (traumaCase) {
      setFormData({
        // Hospital Information
        originHospitalId: traumaCase.originHospitalId || '',
        destinationHospitalId: traumaCase.destinationHospitalId || '',
        
        // Incident Details
        arrivalDateTime: traumaCase.arrivalDateTime || '',
        incidentDateTime: traumaCase.incidentDateTime || '',
        modeOfArrival: traumaCase.modeOfArrival || 'AMBULANCE',
        transferRequestDateTime: traumaCase.transferRequestDateTime || '',
        transferArrivalDateTime: traumaCase.transferArrivalDateTime || '',
        transferDurationMinutes: traumaCase.transferDurationMinutes || '',
        chiefComplaint: traumaCase.chiefComplaint || '',
        mechanismOfInjury: traumaCase.mechanismOfInjury || 'BLUNT',
        
        // Vitals Assessment
        glasgowComaScale: traumaCase.glasgowComaScale || '',
        systolicBloodPressure: traumaCase.systolicBloodPressure || '',
        respiratoryRate: traumaCase.respiratoryRate || '',
        additionalVitalSigns: traumaCase.additionalVitalSigns || '',
        
        // Injury Assessment
        headAndNeckInjury: traumaCase.headAndNeckInjury || '',
        faceInjury: traumaCase.faceInjury || '',
        chestInjury: traumaCase.chestInjury || '',
        abdomenInjury: traumaCase.abdomenInjury || '',
        extremitiesInjury: traumaCase.extremitiesInjury || '',
        externalInjury: traumaCase.externalInjury || '',
        primarySurveyFindings: traumaCase.primarySurveyFindings || '',
        
        // Disposition
        edDisposition: traumaCase.edDisposition || 'DISCHARGE',
        additionalNotes: traumaCase.additionalNotes || '',
        
        // Patient Information (for admin editing)
        patientInfo: {
          firstName: traumaCase.patient?.firstName || '',
          lastName: traumaCase.patient?.lastName || '',
          nationalId: traumaCase.patient?.nationalId || '',
          mrn: traumaCase.patient?.mrn || '',
          dateOfBirth: traumaCase.patient?.dateOfBirth || '',
          gender: traumaCase.patient?.gender || '',
          phoneNumber: traumaCase.patient?.phoneNumber || '',
          email: traumaCase.patient?.email || '',
          address: traumaCase.patient?.address || '',
          emergencyContact: traumaCase.patient?.emergencyContact || '',
          emergencyPhone: traumaCase.patient?.emergencyPhone || '',
          medicalHistory: traumaCase.patient?.medicalHistory || '',
          allergies: traumaCase.patient?.allergies || '',
          medications: traumaCase.patient?.medications || '',
        },
      });
    }
  }, [traumaCase]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traumaCase) return;

    try {
      setLoading(true);
      setError(null);
      
      // For admins, include patient info; for regular users, exclude it
      const { patientInfo, ...updateData } = formData;
      
      const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Add patient info for admins only
      if (isAdmin && patientInfo) {
        cleanedData.patientInfo = patientInfo;
      }
      
      await onSubmit(traumaCase.id, cleanedData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update trauma case');
    } finally {
      setLoading(false);
    }
  };

  if (!traumaCase) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">
              Edit Trauma Case - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}
            </Typography>
            {isAdmin && (
              <Chip label="Admin Edit" color="primary" size="small" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Patient Information Section (Admin Only) */}
              {isAdmin && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Patient Information (Admin Only)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.patientInfo?.firstName || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, firstName: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.patientInfo?.lastName || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, lastName: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="National ID"
                        value={formData.patientInfo?.nationalId || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, nationalId: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="MRN"
                        value={formData.patientInfo?.mrn || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, mrn: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.patientInfo?.phoneNumber || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, phoneNumber: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={formData.patientInfo?.email || ''}
                        onChange={(e) => handleInputChange('patientInfo', { ...formData.patientInfo, email: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Hospital Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Hospital Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <HospitalSelect
                      label="Origin Hospital *"
                      value={formData.originHospitalId || ''}
                      onChange={(value) => handleInputChange('originHospitalId', value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <HospitalSelect
                      label="Destination Hospital"
                      value={formData.destinationHospitalId || ''}
                      onChange={(value) => handleInputChange('destinationHospitalId', value)}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Incident Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Incident Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Arrival Date/Time *"
                      value={formData.arrivalDateTime ? new Date(formData.arrivalDateTime) : null}
                      onChange={(value) => handleInputChange('arrivalDateTime', value?.toISOString())}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Incident Date/Time"
                      value={formData.incidentDateTime ? new Date(formData.incidentDateTime) : null}
                      onChange={(value) => handleInputChange('incidentDateTime', value?.toISOString())}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Mode of Arrival</InputLabel>
                      <Select
                        value={formData.modeOfArrival || ''}
                        onChange={(e) => handleInputChange('modeOfArrival', e.target.value)}
                        label="Mode of Arrival"
                      >
                        <MenuItem value="AMBULANCE">Ambulance</MenuItem>
                        <MenuItem value="PRIVATE_VEHICLE">Private Vehicle</MenuItem>
                        <MenuItem value="AIR_TRANSPORT">Air Transport</MenuItem>
                        <MenuItem value="WALK_IN">Walk-in</MenuItem>
                        <MenuItem value="POLICE">Police</MenuItem>
                        <MenuItem value="TRANSFERRED_FROM_HOSPITAL">Transferred from Hospital</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Mechanism of Injury</InputLabel>
                      <Select
                        value={formData.mechanismOfInjury || ''}
                        onChange={(e) => handleInputChange('mechanismOfInjury', e.target.value)}
                        label="Mechanism of Injury"
                      >
                        <MenuItem value="PENETRATING">Penetrating</MenuItem>
                        <MenuItem value="BLUNT">Blunt</MenuItem>
                        <MenuItem value="BURN">Burn</MenuItem>
                        <MenuItem value="FALL">Fall</MenuItem>
                        <MenuItem value="MOTOR_VEHICLE_ACCIDENT">Motor Vehicle Accident</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Chief Complaint"
                      value={formData.chiefComplaint || ''}
                      onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Vitals Assessment */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Vitals Assessment
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Glasgow Coma Scale</InputLabel>
                      <Select
                        value={formData.glasgowComaScale || ''}
                        onChange={(e) => handleInputChange('glasgowComaScale', e.target.value)}
                        label="Glasgow Coma Scale"
                      >
                        <MenuItem value={3}>3 - Critical</MenuItem>
                        <MenuItem value={4}>4 - Critical</MenuItem>
                        <MenuItem value={5}>5 - Critical</MenuItem>
                        <MenuItem value={6}>6 - Critical</MenuItem>
                        <MenuItem value={7}>7 - Critical</MenuItem>
                        <MenuItem value={8}>8 - Critical</MenuItem>
                        <MenuItem value={9}>9 - Severe</MenuItem>
                        <MenuItem value={10}>10 - Severe</MenuItem>
                        <MenuItem value={11}>11 - Severe</MenuItem>
                        <MenuItem value={12}>12 - Severe</MenuItem>
                        <MenuItem value={13}>13 - Mild</MenuItem>
                        <MenuItem value={14}>14 - Mild</MenuItem>
                        <MenuItem value={15}>15 - Mild</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Systolic Blood Pressure (mmHg)"
                      type="number"
                      value={formData.systolicBloodPressure || ''}
                      onChange={(e) => handleInputChange('systolicBloodPressure', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Respiratory Rate (/min)"
                      type="number"
                      value={formData.respiratoryRate || ''}
                      onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Vital Signs"
                      value={formData.additionalVitalSigns || ''}
                      onChange={(e) => handleInputChange('additionalVitalSigns', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Injury Assessment */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Injury Assessment
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Head & Neck Injury"
                      value={formData.headAndNeckInjury || ''}
                      onChange={(e) => handleInputChange('headAndNeckInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Face Injury"
                      value={formData.faceInjury || ''}
                      onChange={(e) => handleInputChange('faceInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Chest Injury"
                      value={formData.chestInjury || ''}
                      onChange={(e) => handleInputChange('chestInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Abdomen Injury"
                      value={formData.abdomenInjury || ''}
                      onChange={(e) => handleInputChange('abdomenInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Extremities Injury"
                      value={formData.extremitiesInjury || ''}
                      onChange={(e) => handleInputChange('extremitiesInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="External Injury"
                      value={formData.externalInjury || ''}
                      onChange={(e) => handleInputChange('externalInjury', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Primary Survey Findings"
                      value={formData.primarySurveyFindings || ''}
                      onChange={(e) => handleInputChange('primarySurveyFindings', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Disposition */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Disposition
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>ED Disposition</InputLabel>
                      <Select
                        value={formData.edDisposition || ''}
                        onChange={(e) => handleInputChange('edDisposition', e.target.value)}
                        label="ED Disposition"
                      >
                        <MenuItem value="ICU_ADMISSION">ICU Admission</MenuItem>
                        <MenuItem value="SURGICAL_WARD_ADMISSION">Surgical Ward Admission</MenuItem>
                        <MenuItem value="MEDICAL_WARD_ADMISSION">Medical Ward Admission</MenuItem>
                        <MenuItem value="DISCHARGE">Discharge</MenuItem>
                        <MenuItem value="OPERATING_THEATRE">Operating Theatre</MenuItem>
                        <MenuItem value="TRANSFER_TO_HIGHER_CENTER">Transfer to Higher Center</MenuItem>
                        <MenuItem value="DEATH">Death</MenuItem>
                        <MenuItem value="DISCHARGE_AGAINST_MEDICAL_ADVICE">Discharge Against Medical Advice</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      value={formData.additionalNotes || ''}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditTraumaCaseDialog;