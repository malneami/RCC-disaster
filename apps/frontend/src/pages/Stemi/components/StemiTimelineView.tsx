import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  LocalHospital,
  MedicalServices,
  Build,
  CheckCircle,
  Warning,
  Assignment,
  EventAvailable,
  LocalShipping,
  Healing,
  MonitorHeart,
  DepartureBoard,
  CallMade,
  CheckCircleOutline,
} from '@mui/icons-material';
import { StemiCase } from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';

interface StemiTimelineViewProps {
  stemiCase: StemiCase;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recorded: boolean;
  target?: string;
}

interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  events: TimelineEvent[];
  completed: boolean;
}

const StemiTimelineView: React.FC<StemiTimelineViewProps> = ({ stemiCase }) => {

  const createTimelinePhases = (): TimelinePhase[] => {
    const phases: TimelinePhase[] = [];

    // Emergency Department Phase
    const emergencyEvents: TimelineEvent[] = [
      {
        id: 'date-of-admission',
        timestamp: stemiCase.pathwayStarted || '',
        status: 'Date of Admission',
        description: 'Patient admission to emergency department',
        icon: <EventAvailable />,
        color: '#2196f3',
        recorded: !!stemiCase.pathwayStarted,
      },
      {
        id: 'triage-time',
        timestamp: stemiCase.triageTime || '',
        status: 'Triage Time',
        description: 'Patient triaged and assessed',
        icon: <MedicalServices />,
        color: '#9c27b0',
        recorded: !!stemiCase.triageTime,
      },
      {
        id: 'first-ecg-time',
        timestamp: stemiCase.firstEcgTime || '',
        status: 'First ECG Time',
        description: 'First ECG performed and interpreted',
        icon: <MonitorHeart />,
        color: '#4caf50',
        recorded: !!stemiCase.firstEcgTime,
        target: '10 min',
      },
      {
        id: 'ems-activation-time',
        timestamp: stemiCase.rccActivated ? (stemiCase.updatedAt || '') : '',
        status: 'EMS Activation Time',
        description: 'Emergency Medical Services activated',
        icon: <LocalShipping />,
        color: '#e91e63',
        recorded: !!stemiCase.rccActivated,
      },
    ];

    phases.push({
      id: 'emergency-department',
      title: 'Emergency Department Phase',
      description: 'Initial assessment and diagnosis',
      color: '#f44336',
      icon: <LocalHospital />,
      events: emergencyEvents,
      completed: emergencyEvents.some(e => e.recorded),
    });

    // Transfer Phase
    const transferEvents: TimelineEvent[] = [
      {
        id: 'patient-transfer',
        timestamp: stemiCase.doorOutTime || '',
        status: 'Patient Transfer',
        description: 'Patient transferred to PCI-capable facility',
        icon: <LocalShipping />,
        color: '#9c27b0',
        recorded: !!stemiCase.doorOutTime,
        target: '30 min',
      },
      {
        id: 'departed-time',
        timestamp: stemiCase.doorOutTime || '',
        status: 'Departed Time',
        description: 'Patient departed from origin hospital',
        icon: <DepartureBoard />,
        color: '#9c27b0',
        recorded: !!stemiCase.doorOutTime,
      },
      {
        id: 'arrival-time-receiving',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Arrival Time to Receiving Hospital',
        description: 'Patient arrived at receiving hospital',
        icon: <LocalHospital />,
        color: '#9c27b0',
        recorded: !!stemiCase.cathLabArrivalTime,
      },
      {
        id: 'acceptance-confirmation',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Acceptance Confirmation',
        description: 'Receiving hospital confirmed acceptance',
        icon: <CallMade />,
        color: '#9c27b0',
        recorded: !!stemiCase.cathLabArrivalTime,
        target: '10 min',
      },
    ];

    phases.push({
      id: 'transfer-phase',
      title: 'Transfer Phase',
      description: 'Transfer to PCI-capable facility',
      color: '#9c27b0',
      icon: <LocalShipping />,
      events: transferEvents,
      completed: transferEvents.some(e => e.recorded),
    });

    // PCI Procedure Phase
    const pciEvents: TimelineEvent[] = [
      {
        id: 'cath-lab-activation',
        timestamp: stemiCase.cathLabActivationTime || '',
        status: 'Cath Lab Activation Time',
        description: 'Catheterization laboratory activated',
        icon: <Build />,
        color: '#4caf50',
        recorded: !!stemiCase.cathLabActivationTime,
      },
      {
        id: 'cath-lab-arrival',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Cath Lab Arrival Time',
        description: 'Patient arrived at catheterization laboratory',
        icon: <LocalHospital />,
        color: '#4caf50',
        recorded: !!stemiCase.cathLabArrivalTime,
      },
      {
        id: 'pci-procedure-start',
        timestamp: stemiCase.pciProcedureStartTime || '',
        status: 'PCI Procedure Start Time',
        description: 'PCI procedure initiated',
        icon: <MedicalServices />,
        color: '#4caf50',
        recorded: !!stemiCase.pciProcedureStartTime,
      },
      {
        id: 'pci-procedure-complete',
        timestamp: stemiCase.pciProcedureCompleteTime || '',
        status: 'PCI Procedure Complete Time',
        description: 'PCI procedure completed',
        icon: <CheckCircleOutline />,
        color: '#4caf50',
        recorded: !!stemiCase.pciProcedureCompleteTime,
      },
    ];

    phases.push({
      id: 'pci-procedure',
      title: 'PCI Procedure Phase',
      description: 'Catheterization lab and intervention',
      color: '#4caf50',
      icon: <MonitorHeart />,
      events: pciEvents,
      completed: pciEvents.some(e => e.recorded),
    });

    // Post-PCI Management Phase
    const postPciEvents: TimelineEvent[] = [
      {
        id: 'post-pci-complications',
        timestamp: stemiCase.outcomeFormCompletionDate || stemiCase.updatedAt || '',
        status: 'Post-PCI Complications',
        description: stemiCase.postPciComplications 
          ? `Complications: ${stemiCase.postPciComplications === 'YES' ? 'Yes' : 'No'}`
          : 'Recovery monitoring and complication assessment',
        icon: <Warning />,
        color: '#ff9800',
        recorded: !!stemiCase.postPciComplications,
      },
      {
        id: 'discharge-status',
        timestamp: stemiCase.dischargeDate || stemiCase.outcomeFormCompletionDate || '',
        status: 'Discharge Status',
        description: stemiCase.dischargeStatus || 'Discharge planning and status',
        icon: <CheckCircle />,
        color: '#ff9800',
        recorded: !!stemiCase.dischargeStatus,
      },
      {
        id: 'discharge-medications',
        timestamp: stemiCase.outcomeFormCompletionDate || stemiCase.updatedAt || '',
        status: 'Discharge Medications',
        description: stemiCase.dischargeMedications || 'Discharge medication planning',
        icon: <Healing />,
        color: '#ff9800',
        recorded: !!stemiCase.dischargeMedications,
      },
      {
        id: 'follow-up-appointment',
        timestamp: stemiCase.followUpAppointmentDate || '',
        status: 'Follow-up Appointment',
        description: stemiCase.followUpAppointmentProvider 
          ? `Follow-up with ${stemiCase.followUpAppointmentProvider}`
          : 'Follow-up appointment scheduling',
        icon: <Assignment />,
        color: '#ff9800',
        recorded: !!stemiCase.followUpAppointmentDate,
      },
    ];

    phases.push({
      id: 'post-pci-management',
      title: 'Post-PCI Management Phase',
      description: 'Recovery monitoring, complication assessment, and discharge planning',
      color: '#ff9800',
      icon: <Healing />,
      events: postPciEvents,
      completed: postPciEvents.some(e => e.recorded),
    });

    return phases;
  };

  const timelinePhases = createTimelinePhases();


  const getKpiStatus = (minutes: number, target: number): { status: 'success' | 'warning' | 'error'; color: string } => {
    if (minutes <= target) {
      return { status: 'success', color: '#4caf50' };
    } else if (minutes <= target * 1.2) {
      return { status: 'warning', color: '#ff9800' };
    } else {
      return { status: 'error', color: '#f44336' };
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        STEMI Timeline
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Critical timestamps and KPI performance for this case
      </Typography>

      {/* KPI Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {/* Door to ECG KPI */}
        {(stemiCase.doorToEcgMinutes !== null && stemiCase.doorToEcgMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to ECG
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToEcgMinutes} min
                </Typography>
                <Chip
                  label="≤10 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorToEcgMinutes, 10).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door to Balloon KPI */}
        {(stemiCase.doorToBalloonMinutes !== null && stemiCase.doorToBalloonMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to Balloon
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToBalloonMinutes} min
                </Typography>
                <Chip
                  label="≤90 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorToBalloonMinutes, 90).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door to Needle KPI */}
        {(stemiCase.doorToNeedleMinutes !== null && stemiCase.doorToNeedleMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to Needle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToNeedleMinutes} min
                </Typography>
                <Chip
                  label="≤30 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorToNeedleMinutes, 30).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door In Door Out KPI */}
        {(stemiCase.doorInDoorOutMinutes !== null && stemiCase.doorInDoorOutMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door In Door Out
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorInDoorOutMinutes} min
                </Typography>
                <Chip
                  label="≤120 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorInDoorOutMinutes, 120).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Cath Lab Activation to Arrival KPI */}
        {(stemiCase.cathLabActivationTime && stemiCase.cathLabArrivalTime) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Cath Lab Activation to Arrival
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {Math.round((new Date(stemiCase.cathLabArrivalTime).getTime() - new Date(stemiCase.cathLabActivationTime).getTime()) / (1000 * 60))} min
                </Typography>
                <Chip
                  label="≤30 min"
                  size="small"
                  color={getKpiStatus(Math.round((new Date(stemiCase.cathLabArrivalTime).getTime() - new Date(stemiCase.cathLabActivationTime).getTime()) / (1000 * 60)), 30).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* PCI Procedure Duration KPI */}
        {(stemiCase.pciProcedureStartTime && stemiCase.pciProcedureCompleteTime) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                PCI Procedure Duration
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {Math.round((new Date(stemiCase.pciProcedureCompleteTime).getTime() - new Date(stemiCase.pciProcedureStartTime).getTime()) / (1000 * 60))} min
                </Typography>
                <Chip
                  label="≤60 min"
                  size="small"
                  color={getKpiStatus(Math.round((new Date(stemiCase.pciProcedureCompleteTime).getTime() - new Date(stemiCase.pciProcedureStartTime).getTime()) / (1000 * 60)), 60).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Outcome Form Completion */}
        {stemiCase.outcomeFormCompleted && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Outcome Form
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.outcomePercentageCompleteness || 0}%
                </Typography>
                <Chip
                  label="Completed"
                  size="small"
                  color={(stemiCase.outcomePercentageCompleteness ?? 0) >= 80 ? 'success' : (stemiCase.outcomePercentageCompleteness ?? 0) >= 50 ? 'warning' : 'error'}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Phase-based Timeline */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {timelinePhases.map((phase) => (
          <Card 
            key={phase.id}
            sx={{ 
              border: `2px solid ${phase.completed ? phase.color : '#e0e0e0'}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              {/* Phase Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: phase.completed ? phase.color : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.3s ease-in-out',
                    animation: phase.completed ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  {phase.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: phase.completed ? phase.color : '#757575',
                      fontWeight: 600,
                      transition: 'color 0.3s ease-in-out',
                    }}
                  >
                    {phase.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: phase.completed ? phase.color : '#9e9e9e',
                      transition: 'color 0.3s ease-in-out',
                    }}
                  >
                    {phase.description}
                  </Typography>
                </Box>
                {phase.completed && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      backgroundColor: phase.color,
                      color: 'white',
                      fontWeight: 600,
                      animation: 'fadeIn 0.5s ease-in-out',
                      '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: 'scale(0.8)' },
                        '100%': { opacity: 1, transform: 'scale(1)' },
                      },
                    }}
                  />
                )}
              </Box>

              {/* Phase Events */}
              <Box>
                {phase.events.map((event, eventIndex) => (
                  <Box key={event.id}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        py: 2,
                        opacity: event.recorded ? 1 : 0.5,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': event.recorded ? {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 1,
                        } : {},
                      }}
                    >
                      {/* Event Icon */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: event.recorded ? event.color : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'all 0.3s ease-in-out',
                          animation: event.recorded ? 'glow 2s infinite' : 'none',
                          '@keyframes glow': {
                            '0%': { boxShadow: `0 0 0 0 ${event.color}40` },
                            '70%': { boxShadow: `0 0 0 10px ${event.color}00` },
                            '100%': { boxShadow: `0 0 0 0 ${event.color}00` },
                          },
                        }}
                      >
                        {event.icon}
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: event.recorded ? event.color : '#9e9e9e',
                              transition: 'color 0.3s ease-in-out',
                            }}
                          >
                            {event.status}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {event.target && (
                              <Chip
                                label={`Target: ${event.target}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: event.recorded ? event.color : '#e0e0e0',
                                  color: event.recorded ? event.color : '#9e9e9e',
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: event.recorded ? 'text.secondary' : '#9e9e9e',
                                transition: 'color 0.3s ease-in-out',
                              }}
                            >
                              {event.recorded && event.timestamp 
                                ? StemiDatetimeService.formatForDisplay(event.timestamp)
                                : 'Time not recorded'
                              }
                            </Typography>
                          </Box>
                        </Box>

                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: event.recorded ? 'text.primary' : '#9e9e9e',
                            transition: 'color 0.3s ease-in-out',
                          }}
                        >
                          {event.description}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Event Separator */}
                    {eventIndex < phase.events.length - 1 && (
                      <Box
                        sx={{
                          height: 2,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          mx: 6,
                          transition: 'background-color 0.3s ease-in-out',
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default StemiTimelineView;
