import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  Skeleton,
} from '@mui/material';
import { useQuery } from 'react-query';
import { CreateTicketData } from '../../../../services/ticketService';
import { patientService } from '../../../../services/patientService';
import { hospitalService } from '../../../../services/hospitalService';

interface ReviewStepProps {
  formData: Partial<CreateTicketData>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  // Fetch Patient Details
  const { data: patient, isLoading: isLoadingPatient } = useQuery(
    ['patient', formData.patientId],
    () => patientService.getPatientById(formData.patientId!),
    {
      enabled: !!formData.patientId,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch Origin Hospital Details
  const { data: originHospital, isLoading: isLoadingOrigin } = useQuery(
    ['hospital', formData.originHospitalId],
    () => hospitalService.getHospitalById(formData.originHospitalId!),
    {
      enabled: !!formData.originHospitalId,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch Destination Hospital Details
  const { data: destinationHospital, isLoading: isLoadingDestination } = useQuery(
    ['hospital', formData.destinationHospitalId],
    () => hospitalService.getHospitalById(formData.destinationHospitalId!),
    {
      enabled: !!formData.destinationHospitalId,
      staleTime: 5 * 60 * 1000,
    }
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'error';
      case 'EMERGENCY': return 'error';
      default: return 'default';
    }
  };


  const formatRequiredResources = (resources: any) => {
    if (!resources) return 'None specified';
    const activeResources = Object.entries(resources)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key.toUpperCase());
    return activeResources.length > 0 ? activeResources.join(', ') : 'None specified';
  };

  const formatSpecialRequirements = () => {
    const requirements = [];
    if (formData.isEmergency) requirements.push('Emergency Case');
    if (formData.requiresBlood) requirements.push('Requires Blood');
    if (formData.requiresSpecialist) requirements.push('Requires Specialist');
    return requirements.length > 0 ? requirements.join(', ') : 'None';
  };

  const renderVitals = () => {
    if (!formData.vitals) return 'No vitals recorded';

    // Check if vitals is an object or string (based on Ticket interface vs CreateTicketData)
    if (typeof formData.vitals === 'string') return formData.vitals;

    const vitalsList = [];
    const v = formData.vitals as any;
    if (v.bloodPressure) vitalsList.push(`BP: ${v.bloodPressure}`);
    if (v.heartRate) vitalsList.push(`HR: ${v.heartRate}`);
    if (v.temperature) vitalsList.push(`Temp: ${v.temperature}`);
    if (v.oxygenSaturation) vitalsList.push(`O2: ${v.oxygenSaturation}%`);
    if (v.respiratoryRate) vitalsList.push(`RR: ${v.respiratoryRate}`);

    return vitalsList.length > 0 ? vitalsList.join(', ') : 'No vitals recorded';
  };

  const renderDiagnostics = () => {
    if (!formData.diagnostics) return 'No diagnostics recorded';

    if (typeof formData.diagnostics === 'string') return formData.diagnostics;

    const diagnosticsList = [];
    const d = formData.diagnostics as any;
    if (d.ecg) diagnosticsList.push(`ECG: ${d.ecg}`);
    if (d.labResults) diagnosticsList.push(`Labs: ${d.labResults}`);
    if (d.ctScan) diagnosticsList.push(`CT: ${d.ctScan}`);
    if (d.otherTests) diagnosticsList.push(`Other: ${d.otherTests}`);

    return diagnosticsList.length > 0 ? diagnosticsList.join(' | ') : 'No diagnostics recorded';
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Transfer Request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all information before creating the transfer ticket
      </Typography>

      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Patient Name
                  </Typography>
                  {isLoadingPatient ? (
                    <Skeleton width="60%" />
                  ) : (
                    <Typography variant="body1">
                      {patient ? `${patient.firstName} ${patient.lastName}` : formData.patientId}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    MRN
                  </Typography>
                  {isLoadingPatient ? (
                    <Skeleton width="40%" />
                  ) : (
                    <Typography variant="body1">
                      {patient?.mrn || 'N/A'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Hospital Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hospital Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Origin Hospital
                  </Typography>
                  {isLoadingOrigin ? (
                    <Skeleton width="80%" />
                  ) : (
                    <Typography variant="body1">
                      {originHospital ? originHospital.name : formData.originHospitalId}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Destination Hospital
                  </Typography>
                  {isLoadingDestination ? (
                    <Skeleton width="80%" />
                  ) : (
                    <Typography variant="body1">
                      {formData.destinationHospitalId
                        ? (destinationHospital ? destinationHospital.name : formData.destinationHospitalId)
                        : 'Not specified'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={formData.priority}
                    color={getPriorityColor(formData.priority || 'MEDIUM') as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pathway
                  </Typography>
                  <Typography variant="body1">
                    {formData.pathway}
                  </Typography>
                </Grid>

                {formData.pathway === 'NEUROSURGICAL' && formData.neurosurgicalData?.severity && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Neurosurgical Severity
                    </Typography>
                    <Chip
                      label={
                        formData.neurosurgicalData.severity === 'RED'
                          ? 'Neurosurgical Red'
                          : 'Neurosurgical Orange'
                      }
                      color={formData.neurosurgicalData.severity === 'RED' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Grid>
                )}

                {/* Triage & Symptom Onset */}
                {formData.triageTime && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Triage Time
                    </Typography>
                    <Typography variant="body1">
                      {new Date(formData.triageTime).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {formData.symptomOnsetTime && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Symptom Onset Time
                    </Typography>
                    <Typography variant="body1">
                      {new Date(formData.symptomOnsetTime).toLocaleString()}
                    </Typography>
                  </Grid>
                )}

                {/* OB Maternal Details */}
                {formData.pathway === 'MATERNAL' && formData.obMaternalData && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        OB Maternal Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Gestational Age
                      </Typography>
                      <Typography variant="body1">
                        {formData.obMaternalData.gestationalAgeWeeks} weeks
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        G & P & A
                      </Typography>
                      <Typography variant="body1">
                        {[formData.obMaternalData.gravida ?? '-', formData.obMaternalData.para ?? '-', formData.obMaternalData.abortions ?? '-'].join(' / ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Activation Level
                      </Typography>
                      <Chip
                        label={formData.obMaternalData.activationLevel?.replace('MATERNAL_', '')}
                        color={formData.obMaternalData.activationLevel === 'MATERNAL_RED' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    {(formData.obMaternalData.expectedDeliveryMode || formData.obMaternalData.ambulanceType) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Delivery / Ambulance
                        </Typography>
                        <Typography variant="body1">
                          {[formData.obMaternalData.expectedDeliveryMode, formData.obMaternalData.ambulanceType].filter(Boolean).join(' • ')}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}

                {/* Vitals */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vitals
                  </Typography>
                  <Typography variant="body1">
                    {renderVitals()}
                  </Typography>
                </Grid>

                {/* Diagnostics */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Diagnostics
                  </Typography>
                  <Typography variant="body1">
                    {renderDiagnostics()}
                  </Typography>
                </Grid>

                {formData.treatmentPlan && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Treatment Plan / Note
                    </Typography>
                    <Typography variant="body1">
                      {formData.treatmentPlan}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Special Requirements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Special Requirements
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Special Requirements
                  </Typography>
                  <Typography variant="body1">
                    {formatSpecialRequirements()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Required Resources
                  </Typography>
                  <Typography variant="body1">
                    {formatRequiredResources(formData.requiredResources)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Transport Information */}
        {(formData.transportMode || formData.emsUnit || formData.emsContactTime || formData.notes) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transport Information
                </Typography>
                <Grid container spacing={2}>
                  {formData.transportMode && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Transport Mode
                      </Typography>
                      <Typography variant="body1">
                        {formData.transportMode}
                      </Typography>
                    </Grid>
                  )}
                  {formData.emsUnit && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        EMS Unit
                      </Typography>
                      <Typography variant="body1">
                        {formData.emsUnit}
                      </Typography>
                    </Grid>
                  )}
                  {formData.emsContactTime && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        EMS Contact Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(formData.emsContactTime).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {formData.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Additional Notes
                      </Typography>
                      <Typography variant="body1">
                        {formData.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Bed Assignment */}
        {formData.bedAssignment && formData.bedAssignment.bedId && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bed Assignment
                </Typography>
                <Grid container spacing={2}>
                  {formData.bedAssignment.bedNumber && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bed Number
                      </Typography>
                      <Typography variant="body1">
                        {formData.bedAssignment.bedNumber}
                      </Typography>
                    </Grid>
                  )}
                  {formData.bedAssignment.assignedBed && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Unit
                        </Typography>
                        <Typography variant="body1">
                          {formData.bedAssignment.assignedBed.unitName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Hospital
                        </Typography>
                        <Typography variant="body1">
                          {formData.bedAssignment.assignedBed.hospitalName}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {formData.bedAssignment.arrivalDate && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Arrival Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(formData.bedAssignment.arrivalDate).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Validation Summary */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Ready to create transfer ticket</strong>
          <br />
          All required information has been provided. Click <strong>Create Ticket</strong> to submit the transfer request.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ReviewStep;
