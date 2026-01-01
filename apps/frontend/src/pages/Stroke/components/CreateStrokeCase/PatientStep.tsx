import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Divider,
} from '@mui/material';

import { CreateStrokeCaseData } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import PortalPatientEdit from '../../../../components/Common/PortalPatientEdit';
import HospitalSelect from '../../../../components/Common/HospitalSelect';
import { Patient } from '../../../../services/patientService';
import { calculateAge, calculateDoBFromAge, formatDateToLocalInput } from '../../../../utils/ageCalculator';

interface PatientInformationStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
  validationErrors?: Record<string, string>;
  onOriginHospitalSelect?: (hospital: Hospital | null) => void;
  destinationRequired?: boolean;
  timelineWarnings?: Record<string, string[]>;
}

const PatientStep: React.FC<PatientInformationStepProps> = ({
  formData,
  updateFormData,
  validationErrors = {},
  onOriginHospitalSelect,
  destinationRequired = false,
  timelineWarnings = {},
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);

  // State for age parts
  const [ageParts, setAgeParts] = useState({
    years: '',
    months: '',
    days: ''
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const hospitalsData = await hospitalService.getAllHospitals();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        setHospitalError('Failed to load hospitals');
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Update age parts when formData.patientInfo.dateOfBirth or age changes
  useEffect(() => {
    if (formData.patientInfo?.dateOfBirth) {
      const ageDetails = calculateAge(formData.patientInfo.dateOfBirth);
      setAgeParts({
        years: ageDetails.years.toString(),
        months: ageDetails.months.toString(),
        days: ageDetails.days.toString()
      });
    } else if (formData.patientInfo?.age !== undefined) {
      setAgeParts(prev => ({
        ...prev,
        years: formData.patientInfo?.age?.toString() || '',
      }));
    }
  }, [formData.patientInfo?.dateOfBirth, formData.patientInfo?.age]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;

    // Create new patient info with date
    const newPatientInfo = {
      ...formData.patientInfo,
      dateOfBirth: date
    };

    // Update age if date exists
    if (date) {
      const ageDetails = calculateAge(date);
      newPatientInfo.age = ageDetails.years;
    } else {
      newPatientInfo.age = undefined;
    }

    updateFormData('patientInfo', newPatientInfo);
  };

  const handleAgePartChange = (part: 'years' | 'months' | 'days', value: string) => {
    if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
      return;
    }

    const newAgeParts = { ...ageParts, [part]: value };
    setAgeParts(newAgeParts);

    const years = parseInt(newAgeParts.years) || 0;
    const months = parseInt(newAgeParts.months) || 0;
    const days = parseInt(newAgeParts.days) || 0;

    let newPatientInfo = { ...formData.patientInfo };

    if (years > 0 || months > 0 || days > 0 || value === '0') {
      const dob = calculateDoBFromAge(years, months, days);
      const dobString = formatDateToLocalInput(dob);

      newPatientInfo = {
        ...newPatientInfo,
        dateOfBirth: dobString,
        age: years,
      };
    } else if (newAgeParts.years === '' && newAgeParts.months === '' && newAgeParts.days === '') {
      newPatientInfo = {
        ...newPatientInfo,
        dateOfBirth: undefined,
        age: undefined,
      };
    }

    updateFormData('patientInfo', newPatientInfo);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);

    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined;

    let age = patient.age;
    if (age === undefined && dob) {
      age = calculateAge(dob).years;
    }

    updateFormData('patientId', patient.id);
    updateFormData('patientInfo', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      dateOfBirth: dob,
      age: age || undefined,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
    });
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    setSelectedPatient(updatedPatient);

    const dob = updatedPatient.dateOfBirth ? new Date(updatedPatient.dateOfBirth).toISOString().split('T')[0] : undefined;

    let age = updatedPatient.age;
    if (age === undefined && dob) {
      age = calculateAge(dob).years;
    }

    updateFormData('patientInfo', {
      firstName: updatedPatient.firstName,
      lastName: updatedPatient.lastName,
      nationalId: updatedPatient.nationalId,
      mrn: updatedPatient.mrn,
      dateOfBirth: dob,
      age: age || undefined,
      gender: updatedPatient.gender,
      phoneNumber: updatedPatient.phoneNumber || '',
      email: updatedPatient.email || '',
    });
  };


  if (hospitalError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {hospitalError}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Patient Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter patient details below. The system will automatically check for existing patients using the National ID.
        </Typography>
      </Grid>

      {/* Selected Patient Display */}
      {selectedPatient && (
        <Grid item xs={12}>
          <Box sx={{
            p: 2,
            border: '2px solid',
            borderColor: 'success.main',
            borderRadius: 2,
            bgcolor: 'success.light',
            color: 'success.contrastText'
          }}>
            <Typography variant="h6" gutterBottom>
              ✅ Existing Patient Selected: {selectedPatient.firstName} {selectedPatient.lastName}
            </Typography>
            <Typography variant="body2">
              Patient information has been auto-filled. You can modify the details below if needed.
            </Typography>
          </Box>
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Patient Name"
          value={formData.patientInfo?.firstName || ''}
          onChange={(e) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            firstName: e.target.value
          })}
          required
          error={!!validationErrors['patientInfo.firstName']}
          helperText={validationErrors['patientInfo.firstName']}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Patient Last Name"
          value={formData.patientInfo?.lastName || ''}
          onChange={(e) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            lastName: e.target.value
          })}
          required
          error={!!validationErrors['patientInfo.lastName']}
          helperText={validationErrors['patientInfo.lastName']}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <NationalIdInput
          value={formData.patientInfo?.nationalId || ''}
          onChange={(value) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            nationalId: value
          })}
          onPatientSelect={handlePatientSelect}
          label="National ID"
          required
          error={!!validationErrors['patientInfo.nationalId']}
          helperText={validationErrors['patientInfo.nationalId']}
          portalType="stroke"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Medical Record Number (MRN)"
          value={formData.patientInfo?.mrn || ''}
          onChange={(e) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            mrn: e.target.value
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={formData.patientInfo?.dateOfBirth || ''}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().split('T')[0] }}
          error={!!validationErrors['patientInfo.dateOfBirth']}
          helperText={validationErrors['patientInfo.dateOfBirth'] || 'Age calculated automatically'}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Days"
              value={ageParts.days}
              onChange={(e) => handleAgePartChange('days', e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Months"
              value={ageParts.months}
              onChange={(e) => handleAgePartChange('months', e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Years"
              value={ageParts.years}
              onChange={(e) => handleAgePartChange('years', e.target.value)}
              type="number"
              inputProps={{ min: 0, max: 150 }}
              error={!!validationErrors['patientInfo.age']}
            />
          </Grid>
          <Grid item xs={12}>
            {validationErrors['patientInfo.age'] && (
              <Typography variant="caption" color="error">
                {validationErrors['patientInfo.age']}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!validationErrors['patientInfo.gender']}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.patientInfo?.gender || ''}
            onChange={(e) => updateFormData('patientInfo', {
              ...formData.patientInfo,
              gender: e.target.value
            })}
            label="Gender"
          >
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
          </Select>
          {validationErrors['patientInfo.gender'] && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {validationErrors['patientInfo.gender']}
            </Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.patientInfo?.phoneNumber || ''}
          onChange={(e) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            phoneNumber: e.target.value
          })}
          error={!!validationErrors['patientInfo.phoneNumber']}
          helperText={validationErrors['patientInfo.phoneNumber']}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          value={formData.patientInfo?.email || ''}
          onChange={(e) => updateFormData('patientInfo', {
            ...formData.patientInfo,
            email: e.target.value
          })}
          error={!!validationErrors['patientInfo.email']}
          helperText={validationErrors['patientInfo.email']}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Hospital Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Hospital Information
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <HospitalSelect
          label="Origin Hospital"
          value={formData.originHospitalId}
          onChange={(hospitalId) => {
            updateFormData('originHospitalId', hospitalId);
            const hospital = hospitals.find(h => h.id === hospitalId);
            onOriginHospitalSelect?.(hospital || null);
          }}
          required
          error={!!validationErrors['originHospitalId']}
          helperText={validationErrors['originHospitalId']}
          showServiceBadges
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={destinationRequired} error={!!validationErrors['destinationHospitalId']}>
          <InputLabel>{destinationRequired ? 'Destination Hospital (Required)' : 'Destination Hospital (Optional)'}</InputLabel>
          <Select
            value={formData.destinationHospitalId || ''}
            onChange={(e) => updateFormData('destinationHospitalId', e.target.value)}
            disabled={loadingHospitals}
            label={destinationRequired ? 'Destination Hospital (Required)' : 'Destination Hospital (Optional)'}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            }}
          >
            {!destinationRequired && (
              <MenuItem value="">
                <em>No destination hospital</em>
              </MenuItem>
            )}
            {loadingHospitals ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading hospitals...
              </MenuItem>
            ) : (
              hospitals
                .filter((hospital) => hospital.hasStrokeService || hospital.hasStrokeUnit || hospital.hasThrombolysis || hospital.hasThrombectomy)
                .map((hospital) => (
                  <MenuItem key={hospital.id} value={hospital.id}>
                    <Box>
                      <Typography variant="body1">{hospital.name}</Typography>
                      {hospital.address && (
                        <Typography variant="caption" color="text.secondary">
                          {hospital.address}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {hospital.hasStrokeUnit && (
                          <Typography variant="caption" color="success.main">
                            Stroke Unit
                          </Typography>
                        )}
                        {hospital.hasThrombolysis && (
                          <Typography variant="caption" color="info.main">
                            Thrombolysis
                          </Typography>
                        )}
                        {hospital.hasThrombectomy && (
                          <Typography variant="caption" color="warning.main">
                            Thrombectomy
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))
            )}
          </Select>
          {validationErrors['destinationHospitalId'] && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {validationErrors['destinationHospitalId']}
            </Typography>
          )}
          {!validationErrors['destinationHospitalId'] && destinationRequired && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
              Only hospitals with Stroke, Stroke Unit, Thrombolysis, or Thrombectomy services are shown
            </Typography>
          )}
        </FormControl>
      </Grid>
      {destinationRequired && (
        <Grid item xs={12}>
          <Alert severity="warning">
            Please select a destination hospital because the selected origin hospital does not provide Stroke service.
          </Alert>
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!validationErrors['modeOfArrival']}>
          <InputLabel>Mode of Arrival</InputLabel>
          <Select
            value={formData.modeOfArrival || ''}
            onChange={(e) => updateFormData('modeOfArrival', e.target.value)}
            label="Mode of Arrival"
          >
            <MenuItem value="AMBULANCE_RED_CRESCENT">Ambulance (Red Crescent)</MenuItem>
            <MenuItem value="PRIVATE_CAR">Private Car</MenuItem>
            <MenuItem value="TRANSFERRED_FROM_ANOTHER_HOSPITAL">Transferred from another hospital</MenuItem>
          </Select>
          {validationErrors['modeOfArrival'] && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {validationErrors['modeOfArrival']}
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* Conditional Transfer Fields */}
      {formData.modeOfArrival === 'TRANSFERRED_FROM_ANOTHER_HOSPITAL' && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transfer Request Date & Time"
              type="datetime-local"
              value={formData.transferRequestDateTime || ''}
              onChange={(e) => updateFormData('transferRequestDateTime', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              error={!!timelineWarnings['transferRequestDateTime']}
            />
            {timelineWarnings['transferRequestDateTime']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {warning}
                </Typography>
              </Alert>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transfer Arrival Date & Time"
              type="datetime-local"
              value={formData.transferArrivalDateTime || ''}
              onChange={(e) => updateFormData('transferArrivalDateTime', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              error={!!timelineWarnings['transferArrivalDateTime']}
            />
            {timelineWarnings['transferArrivalDateTime']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {warning}
                </Typography>
              </Alert>
            ))}
          </Grid>
        </>
      )}

      {/* Patient Edit Dialog */}
      <PortalPatientEdit
        open={editPatientDialogOpen}
        onClose={() => setEditPatientDialogOpen(false)}
        patient={selectedPatient}
        portalType="stroke"
        onPatientUpdated={handlePatientUpdate}
      />
    </Grid>
  );
};

export default PatientStep;
