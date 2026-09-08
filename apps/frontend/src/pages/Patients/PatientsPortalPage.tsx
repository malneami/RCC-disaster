import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Alert, CircularProgress, Fab } from '@mui/material';
import { Add, Assessment, Timeline, Person, LocalHospital, Assignment } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import PortalSkeleton, { PortalStep, KPICard } from '../../components/Common/PortalSkeleton';
import { TabPanel } from '../../components/Common/TabPanel';
import { Patient, PatientWithDetails, patientService } from '../../services/patientService';
import { TimelineEvent } from '../../components/Common/TimelineView';

import PatientSearchTab from './components/tabs/PatientSearchTab';
import PatientDetailsTab from './components/tabs/PatientDetailsTab';
import PatientTimelineTab from './components/tabs/PatientTimelineTab';
import { convertPatientsToTimelineEvents } from './utils/PatientTimelineUtils';

const PatientsPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Patient Search', description: 'Find and select patients', icon: <Person /> },
    { label: 'Patient Details', description: 'View patient information', icon: <Assessment /> },
    { label: 'Timeline View', description: 'Track patient history', icon: <Timeline /> },
  ];

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientService.getPatients(1, 100); // Load more patients for timeline
      // Convert to PatientWithDetails by fetching individual patient details
      const patientsWithDetails = await Promise.all(
        response.data.map(async (patient) => {
          try {
            return await patientService.getPatientById(patient.id);
          } catch (err) {
            console.error(`Failed to load details for patient ${patient.id}:`, err);
            return patient as PatientWithDetails;
          }
        })
      );
      setPatients(patientsWithDetails);

      // Convert patients to timeline events
      const events = convertPatientsToTimelineEvents(patientsWithDetails);
      setTimelineEvents(events);
    } catch (err) {
      setError('Failed to load patients data');
      console.error('Error loading patients data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab(1); // Switch to Patient Details tab
  };

  const handleViewDuplicate = (patient: Patient) => {
    // Open the patient details in a new tab
    window.open(`/patients/${patient.id}`, '_blank');
  };

  const handleCreatePatient = () => {
    navigate('/patients/new');
  };

  const handleViewPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const headerActions = (
    <Fab
      color="primary"
      size="medium"
      onClick={handleCreatePatient}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      }}
    >
      <Add />
    </Fab>
  );

  // Create KPI cards data
  const kpiCards: KPICard[] = [
    {
      title: 'Total Patients',
      value: patients.length,
      icon: <Person />,
      color: '#7b1fa2',
    },
    {
      title: 'Active Records',
      value: patients.filter(p => p.medicalRecords && p.medicalRecords.length > 0).length,
      icon: <Assessment />,
      color: '#1976d2',
    },
    {
      title: 'Open Tickets',
      value: patients.reduce((total, p) => total + (p.tickets?.filter((t: any) => t.status !== 'CLOSED').length || 0), 0),
      icon: <Assignment />,
      color: '#ed6c02',
    },
    {
      title: 'Hospitals',
      value: new Set(patients.map(p => (p as any).hospitalId).filter(Boolean)).size,
      icon: <LocalHospital />,
      color: '#2e7d32',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Patients Portal | MASAR</title>
      </Helmet>

      <PortalSkeleton
        title="Patients Portal"
        subtitle="Comprehensive patient management and medical record coordination"
        portalType="patients"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={loadPatients}
        headerActions={headerActions}
        kpiCards={kpiCards}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="patients portal tabs"
            sx={{ minHeight: 48 }}
          >
            <Tab
              label="Patient Search"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }}
            />
            <Tab
              label="Patient Details"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 1 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }}
            />
            <Tab
              label="Timeline View"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 2 ? 'bold' : 'normal',
                py: 2,
                px: 3
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <PatientSearchTab
            onPatientSelect={handlePatientSelect}
            onViewDuplicate={handleViewDuplicate}
            onViewPatient={handleViewPatient}
            onEditPatient={(patient) => navigate(`/patients/${patient.id}?edit=true`)}
            patients={patients}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PatientDetailsTab
            selectedPatient={selectedPatient}
            onViewPatient={handleViewPatient}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PatientTimelineTab
            timelineEvents={timelineEvents}
            loading={loading}
            error={error}
          />
        </TabPanel>
      </PortalSkeleton>
    </>
  );
};

export default PatientsPortalPage;
