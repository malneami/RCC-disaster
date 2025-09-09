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
} from '@mui/material';

import { TraumaCase } from '../../../services/traumaService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (traumaCase) {
      setFormData({
        originHospitalId: traumaCase.originHospitalId || '',
        destinationHospitalId: traumaCase.destinationHospitalId || '',
        arrivalDateTime: traumaCase.arrivalDateTime || '',
        incidentDateTime: traumaCase.incidentDateTime || '',
        modeOfArrival: traumaCase.modeOfArrival || 'AMBULANCE',
        chiefComplaint: traumaCase.chiefComplaint || '',
        mechanismOfInjury: traumaCase.mechanismOfInjury || 'BLUNT',
        glasgowComaScale: traumaCase.glasgowComaScale || '',
        systolicBloodPressure: traumaCase.systolicBloodPressure || '',
        respiratoryRate: traumaCase.respiratoryRate || '',
        headAndNeckInjury: traumaCase.headAndNeckInjury || '',
        faceInjury: traumaCase.faceInjury || '',
        chestInjury: traumaCase.chestInjury || '',
        abdomenInjury: traumaCase.abdomenInjury || '',
        extremitiesInjury: traumaCase.extremitiesInjury || '',
        externalInjury: traumaCase.externalInjury || '',
        primarySurveyFindings: traumaCase.primarySurveyFindings || '',
        edDisposition: traumaCase.edDisposition || 'DISCHARGE',
        additionalNotes: traumaCase.additionalNotes || '',
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
      
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Edit Trauma Case - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Chief Complaint"
                    value={formData.chiefComplaint || ''}
                    onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                    multiline
                    rows={2}
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
  );
};

export default EditTraumaCaseDialog;