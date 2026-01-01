import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MedicalServices,
  LocalHospital,
  Person,
  Security,
} from '@mui/icons-material';
import { patientService, PatientWithDetails, Patient } from '../../services/patientService';
import GenericTabs from '../../components/Common/GenericTabs';
import MultiStepPatientForm from './components/forms/MultiStepPatientForm';
import ExportDialog from '../../components/Common/ExportDialog';
import PatientHeader from './components/PatientHeader';
import PatientOverviewTab from './components/tabs/PatientOverviewTab';
import PatientMedicalRecordsTab from './components/tabs/PatientMedicalRecordsTab';
import PatientTicketsTab from './components/tabs/PatientTicketsTab';
import PatientAccessLogsTab from './components/tabs/PatientAccessLogsTab';
import { usePatientExport } from './hooks/usePatientExport';
import { ExportOptions } from '../../components/Common/ExportDialog';

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { exportPatient: exportPatientData } = usePatientExport();

  useEffect(() => {
    if (id) {
      loadPatientDetails(id);
    }
  }, [id]);

  const loadPatientDetails = async (patientId: string) => {
    try {
      setLoading(true);
      const data = await patientService.getPatientById(patientId);
      console.log('Patient data loaded:', data);
      console.log('Medical records:', data.medicalRecords);
      console.log('Tickets:', data.tickets);
      setPatient(data);
    } catch (err) {
      setError('Failed to load patient details');
      console.error('Error loading patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/patients');
  };

  const handleEdit = () => {
    setShowPatientForm(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (patient) {
      setShowExportDialog(true);
    }
  };

  const handleExportDialogClose = () => {
    setShowExportDialog(false);
  };

  const handleExportData = async (options: ExportOptions) => {
    if (patient) {
      await exportPatientData(patient, options);
    }
  };

  const handleViewTicket = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handlePatientFormClose = () => {
    setShowPatientForm(false);
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    // Refresh the patient data after update
    if (updatedPatient.id === patient?.id) {
      setPatient(updatedPatient as PatientWithDetails);
    }
    setShowPatientForm(false);
  };

  const handleMedicalRecordCreated = (_medicalRecord: any) => {
    // Refresh the patient data to include the new medical record
    if (patient) {
      loadPatientDetails(patient.id);
    }
  };

  const handleMedicalRecordUpdated = (_medicalRecord: any) => {
    // Refresh the patient data to include the updated medical record
    if (patient) {
      loadPatientDetails(patient.id);
    }
  };

  const handleMedicalRecordDeleted = (_medicalRecordId: string) => {
    // Refresh the patient data to remove the deleted medical record
    if (patient) {
      loadPatientDetails(patient.id);
    }
  };

  const handleViewDuplicate = (duplicatePatient: Patient) => {
    // Open the duplicate patient details in a new tab
    window.open(`/patients/${duplicatePatient.id}`, '_blank');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !patient) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Patient not found'}</Alert>
      </Container>
    );
  }

  // Define tabs configuration
  const tabsConfig = [
    {
      label: 'Overview',
      content: <PatientOverviewTab patient={patient} />,
      icon: <Person />,
    },
    {
      label: 'Medical Records',
      content: <PatientMedicalRecordsTab 
        medicalRecords={patient.medicalRecords || []} 
        patientId={patient.id}
        onMedicalRecordCreated={handleMedicalRecordCreated}
        onMedicalRecordUpdated={handleMedicalRecordUpdated}
        onMedicalRecordDeleted={handleMedicalRecordDeleted}
      />,
      icon: <MedicalServices />,
    },
    {
      label: 'Tickets',
      content: <PatientTicketsTab tickets={patient.tickets || []} onViewTicket={handleViewTicket} />,
      icon: <LocalHospital />,
    },
    {
      label: 'Access Logs',
      content: <PatientAccessLogsTab accessLogs={patient.accessLogs || []} />,
      icon: <Security />,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <PatientHeader
        patient={patient}
        onBack={handleBack}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onExport={handleExport}
        colorIndex={searchParams.get('colorIndex') ? parseInt(searchParams.get('colorIndex') || '0', 10) : undefined}
      />

      {/* Tabs */}
      <GenericTabs
        tabs={tabsConfig}
        value={tabValue}
        onChange={handleTabChange}
      />

      {/* Patient Form Dialog */}
      <MultiStepPatientForm
        open={showPatientForm}
        patient={patient}
        onClose={handlePatientFormClose}
        onPatientCreated={() => {}} // Not used when editing
        onPatientUpdated={handlePatientUpdated}
        onViewDuplicate={handleViewDuplicate}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        title="Export Patient Data"
        entityName="patient"
        onClose={handleExportDialogClose}
        onExport={handleExportData}
      />
    </Container>
  );
};

export default PatientDetailsPage;
