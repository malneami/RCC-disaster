import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Alert,
} from '@mui/material';

import { StrokeCase } from '../../../services/strokeService';
import { useAuth } from '../../../contexts/AuthContext';
import BasicInformationSection from './EditStrokeCase/BasicInformationSection';
import ClinicalAssessmentsSection from './EditStrokeCase/ClinicalAssessmentsSection';
import TreatmentInformationSection from './EditStrokeCase/TreatmentInformationSection';
import PerformanceTimingsSection from './EditStrokeCase/PerformanceTimingsSection';
import AdditionalInformationSection from './EditStrokeCase/AdditionalInformationSection';
import PatientInformationSection from './EditStrokeCase/PatientInformationSection';

interface EditStrokeCaseDialogProps {
  open: boolean;
  onClose: () => void;
  strokeCase: StrokeCase | null;
  onUpdate: (id: string, data: any) => Promise<void>;
}

const EditStrokeCaseDialog: React.FC<EditStrokeCaseDialogProps> = ({
  open,
  onClose,
  strokeCase,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (strokeCase) {
      setFormData({
        strokeType: strokeCase.strokeType,
        strokeSubtype: strokeCase.strokeSubtype || '',
        strokeSeverity: strokeCase.strokeSeverity || '',
        nihssBaseline: strokeCase.nihssBaseline || '',
        nihss24hr: strokeCase.nihss24hr || '',
        nihssDischarge: strokeCase.nihssDischarge || '',
        mrsBaseline: strokeCase.mrsBaseline || '',
        mrs90day: strokeCase.mrs90day || '',
        barthelBaseline: strokeCase.barthelBaseline || '',
        barthelDischarge: strokeCase.barthelDischarge || '',
        aspectsScore: strokeCase.aspectsScore || '',
        gcsBaseline: strokeCase.gcsBaseline || '',
        presentingSymptoms: strokeCase.presentingSymptoms || '',
        symptomOnset: strokeCase.symptomOnset || '',
        symptomToHospitalMinutes: strokeCase.symptomToHospitalMinutes || '',
        lastKnownWell: strokeCase.lastKnownWell || '',
        wakeUpStroke: strokeCase.wakeUpStroke || false,
        currentStatus: strokeCase.currentStatus,
        selectedTreatment: strokeCase.selectedTreatment || '',
        eligibleForThrombolysis: strokeCase.eligibleForThrombolysis || false,
        thrombolysisContraindications: strokeCase.thrombolysisContraindications || '',
        eligibleForThrombectomy: strokeCase.eligibleForThrombectomy || false,
        thrombectomyContraindications: strokeCase.thrombectomyContraindications || '',
        pathwayStarted: strokeCase.pathwayStarted || '',
        pathwayCompleted: strokeCase.pathwayCompleted || '',
        strokeUnitAdmissionTime: strokeCase.strokeUnitAdmissionTime || '',
        doorToImagingMinutes: strokeCase.doorToImagingMinutes || '',
        doorToNeedleMinutes: strokeCase.doorToNeedleMinutes || '',
        doorToGroinMinutes: strokeCase.doorToGroinMinutes || '',
        symptomNeedleMinutes: strokeCase.symptomNeedleMinutes || '',
        symptomGroinMinutes: strokeCase.symptomGroinMinutes || '',
        imagingToNeedleMinutes: strokeCase.imagingToNeedleMinutes || '',
        imagingToGroinMinutes: strokeCase.imagingToGroinMinutes || '',
        dysphagiaScreeningMinutes: strokeCase.dysphagiaScreeningMinutes || '',
        earlyMobilizationHours: strokeCase.earlyMobilizationHours || '',
        ctResults: strokeCase.ctResults || '',
        mriResults: strokeCase.mriResults || '',
        complications: strokeCase.complications || '',
        dischargeDate: strokeCase.dischargeDate || '',
        lengthOfStayDays: strokeCase.lengthOfStayDays || '',
        followUpCallDate: strokeCase.followUpCallDate || '',
        followUpCallCompleted: strokeCase.followUpCallCompleted || false,
        successful: strokeCase.successful || false,
        thirtyDayReadmission: strokeCase.thirtyDayReadmission || false,
        ninetyDayMortality: strokeCase.ninetyDayMortality || false,
        secondaryPrevention: strokeCase.secondaryPrevention || '',
        dischargeDestination: strokeCase.dischargeDestination || '',
        patientInfo: {
          firstName: strokeCase.patient?.firstName || '',
          lastName: strokeCase.patient?.lastName || '',
          nationalId: strokeCase.patient?.nationalId || '',
          mrn: strokeCase.patient?.mrn || '',
          age: strokeCase.patient?.age || undefined,
          gender: strokeCase.patient?.gender || '',
          phoneNumber: strokeCase.patient?.phoneNumber || '',
          email: strokeCase.patient?.email || '',
        },
      });
    }
  }, [strokeCase]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strokeCase) return;

    try {
      setLoading(true);
      setError(null);
      
      // Filter out patientInfo and other fields that shouldn't be in the update request
      const { patientInfo, ...updateData } = formData;
      
      // Also filter out any empty string values and convert them to undefined
      const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      console.log('Sending update data:', cleanedData);
      await onUpdate(strokeCase.id, cleanedData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update stroke case');
      console.error('Error updating stroke case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!strokeCase) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Stroke Case - {strokeCase.patient?.firstName} {strokeCase.patient?.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <PatientInformationSection
              formData={formData}
              handleInputChange={handleInputChange}
              isAdmin={user?.role === 'ADMIN'}
            />
            
            <BasicInformationSection
              formData={formData}
              handleInputChange={handleInputChange}
            />
            
            <ClinicalAssessmentsSection
              formData={formData}
              handleInputChange={handleInputChange}
            />
            
            <TreatmentInformationSection
              formData={formData}
              handleInputChange={handleInputChange}
            />
            
            <PerformanceTimingsSection
              formData={formData}
              handleInputChange={handleInputChange}
            />
            
            <AdditionalInformationSection
              formData={formData}
              handleInputChange={handleInputChange}
            />
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
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

export default EditStrokeCaseDialog;