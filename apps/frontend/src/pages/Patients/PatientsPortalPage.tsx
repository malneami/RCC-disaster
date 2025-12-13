import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Alert, CircularProgress, Fab, Card, CardContent, Grid } from '@mui/material';
import { Add, Assessment, Timeline, Person, LocalHospital, Assignment } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import PortalSkeleton, { PortalStep, KPICard } from '../../components/Common/PortalSkeleton';
import PortalPatientSearch from '../../components/Common/PortalPatientSearch';
import TimelineView, { TimelineEvent } from '../../components/Common/TimelineView';
import { Patient, PatientWithDetails, patientService } from '../../services/patientService';
// import { useAuth } from '../../contexts/AuthContext'; // For future admin functionality

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patients-tabpanel-${index}`}
      aria-labelledby={`patients-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientsPortalPage: React.FC = () => {
  // const { user } = useAuth(); // For future admin functionality
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

  const convertPatientsToTimelineEvents = (patients: PatientWithDetails[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    patients.forEach(patient => {
      // Patient creation
      if (patient.createdAt) {
        events.push({
          id: `${patient.id}-created`,
          timestamp: patient.createdAt,
          title: `Patient Created - ${patient.firstName} ${patient.lastName}`,
          description: `New patient record created`,
          type: 'other',
          status: 'completed',
          user: {
            name: patient.createdBy?.firstName ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : 'System',
            role: 'Data Collector',
          },
          details: {
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientNationalId: patient.nationalId,
            patientMRN: patient.mrn,
            patientGender: patient.gender,
            patientDOB: patient.dateOfBirth,
          },
        });
      }

      // Patient updates
      if (patient.updatedAt && patient.updatedAt !== patient.createdAt) {
        events.push({
          id: `${patient.id}-updated`,
          timestamp: patient.updatedAt,
          title: `Patient Updated - ${patient.firstName} ${patient.lastName}`,
          description: `Patient information updated`,
          type: 'other',
          status: 'completed',
          details: {
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientNationalId: patient.nationalId,
            patientMRN: patient.mrn,
          },
        });
      }

      // Medical records
      if (patient.medicalRecords && patient.medicalRecords.length > 0) {
        patient.medicalRecords.forEach((record, index) => {
          events.push({
            id: `${patient.id}-record-${index}`,
            timestamp: record.createdAt || patient.createdAt,
            title: `Medical Record - ${record.title || 'Untitled'}`,
            description: `Medical record created for ${patient.firstName} ${patient.lastName}`,
            type: 'other',
            status: 'completed',
            details: {
              patientName: `${patient.firstName} ${patient.lastName}`,
              patientNationalId: patient.nationalId,
              recordTitle: record.title,
              recordType: record.recordType,
            },
          });
        });
      }

      // Tickets
      if (patient.tickets && patient.tickets.length > 0) {
        patient.tickets.forEach((ticket, index) => {
          events.push({
            id: `${patient.id}-ticket-${index}`,
            timestamp: ticket.createdAt || patient.createdAt,
            title: `Ticket Created - ${ticket.chiefComplaint || 'Untitled'}`,
            description: `Ticket created for ${patient.firstName} ${patient.lastName}`,
            type: 'other',
            status: ticket.status === 'COMPLETED' ? 'completed' : 'in-progress',
            details: {
              patientName: `${patient.firstName} ${patient.lastName}`,
              patientNationalId: patient.nationalId,
              ticketTitle: ticket.chiefComplaint,
              ticketStatus: ticket.status,
              ticketPriority: ticket.priority,
            },
          });
        });
      }
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

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

  // Check if user is admin (for future use)
  // const isAdmin = user?.role === 'ADMIN' || user?.role === 'RCC';

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
        <title>Patients Portal - RCC Healthcare Platform</title>
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
          <PortalPatientSearch
            placeholder="Search by patient name, MRN, or National ID..."
            onPatientSelect={handlePatientSelect}
            portalType="patients"
            showDuplicates={true}
            onViewDuplicate={handleViewDuplicate}
          />
          
          {/* Recent Patients */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Patients
            </Typography>
            <Grid container spacing={2}>
              {patients.slice(0, 6).map((patient) => (
                <Grid item xs={12} sm={6} md={4} key={patient.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Person sx={{ color: '#7b1fa2' }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {patient.firstName} {patient.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            MRN: {patient.mrn}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(patient.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {selectedPatient ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 3 }}>
                Patient Details: {selectedPatient.firstName} {selectedPatient.lastName}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Basic Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>MRN:</strong> {selectedPatient.mrn}
                        </Typography>
                        <Typography variant="body2">
                          <strong>National ID:</strong> {selectedPatient.nationalId}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Gender:</strong> {selectedPatient.gender}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date of Birth:</strong> {selectedPatient.dateOfBirth ? (() => {
                            try {
                              const dob = new Date(selectedPatient.dateOfBirth);
                              const today = new Date();
                              const minDate = new Date('1900-01-01');
                              // Validate date of birth
                              if (dob > today) {
                                return `${dob.toLocaleDateString()} (Invalid: Future date)`;
                              }
                              if (dob < minDate) {
                                return `${dob.toLocaleDateString()} (Invalid: Before 1900)`;
                              }
                              return dob.toLocaleDateString();
                            } catch (error) {
                              return 'Invalid date';
                            }
                          })() : 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Medical Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Medical Records:</strong> {(selectedPatient as PatientWithDetails).medicalRecords?.length || 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Active Tickets:</strong> {(selectedPatient as PatientWithDetails).tickets?.filter((t: any) => t.status !== 'CLOSED').length || 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Blood Type:</strong> {selectedPatient.bloodType || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Allergies:</strong> {selectedPatient.allergies || 'None'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Fab
                  variant="extended"
                  color="primary"
                  onClick={() => handleViewPatient(selectedPatient)}
                  sx={{ backgroundColor: '#7b1fa2' }}
                >
                  <Person sx={{ mr: 1 }} />
                  View Full Details
                </Fab>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Select a Patient
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Use the Patient Search tab to find and select a patient to view their details.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TimelineView
            events={timelineEvents}
            portalType="stroke"
            title="Patients Timeline"
            showSearch={true}
            onSearch={(query, filter) => {
              // TODO: Implement timeline search functionality
              console.log('Timeline search:', query, filter);
            }}
            loading={loading}
            error={error || undefined}
          />
        </TabPanel>
      </PortalSkeleton>
    </>
  );
};

export default PatientsPortalPage;
