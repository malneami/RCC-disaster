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
  Assignment,
  EventAvailable,
  LocalShipping,
  Healing,
  DepartureBoard,
  CallMade,
  CheckCircleOutline,
  Accessibility,
  Psychology,
  Medication,
  Assessment,
  Scanner,
} from '@mui/icons-material';
import { StrokeCase } from '../../../services/strokeService';

interface StrokeTimelineViewProps {
  strokeCase: StrokeCase;
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

const StrokeTimelineView: React.FC<StrokeTimelineViewProps> = ({ strokeCase }) => {
  const createTimelinePhases = (): TimelinePhase[] => {
    const phases: TimelinePhase[] = [];

    // Emergency Department Phase
    const emergencyEvents: TimelineEvent[] = [
      {
        id: 'date-of-admission',
        timestamp: strokeCase.dateOfAdmission || '',
        status: 'Date of Admission',
        description: 'Patient admission to emergency department',
        icon: <EventAvailable />,
        color: '#2196f3',
        recorded: !!strokeCase.dateOfAdmission,
      },
      {
        id: 'triage-time',
        timestamp: strokeCase.timeOfTriage || '',
        status: 'Triage Time',
        description: 'Patient triaged and assessed',
        icon: <MedicalServices />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfTriage,
        target: '10 min',
      },
      {
        id: 'physician-assessment',
        timestamp: strokeCase.timeOfPhysicianAssessment || '',
        status: 'Physician Assessment',
        description: 'Initial physician assessment completed',
        icon: <LocalHospital />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfPhysicianAssessment,
        target: '15 min',
      },
      {
        id: 'swallowing-screening',
        timestamp: strokeCase.timeOfSwallowingScreening || '',
        status: 'Swallowing Screening',
        description: strokeCase.swallowingScreeningResult 
          ? `Swallowing screening completed - Result: ${strokeCase.swallowingScreeningResult}`
          : 'Swallowing screening assessment',
        icon: <Assessment />,
        color: '#ff9800',
        recorded: !!strokeCase.timeOfSwallowingScreening,
        target: '4 hours',
      },
    ];

    phases.push({
      id: 'emergency-department',
      title: 'Emergency Department Phase',
      description: 'Initial assessment and triage',
      color: '#f44336',
      icon: <LocalHospital />,
      events: emergencyEvents,
      completed: emergencyEvents.some(e => e.recorded),
    });

    // Diagnostic Phase
    const diagnosticEvents: TimelineEvent[] = [
      {
        id: 'ct-scan-start',
        timestamp: strokeCase.timeOfCtScanStart || '',
        status: 'CT Scan Start',
        description: 'CT scan initiated for stroke diagnosis',
        icon: <Scanner />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfCtScanStart,
        target: '20 min',
      },
      {
        id: 'ct-report-final',
        timestamp: strokeCase.timeOfCtReportFinal || '',
        status: 'CT Report Final',
        description: strokeCase.ctFindings 
          ? `CT scan completed - Findings: ${strokeCase.ctFindings}`
          : 'CT scan report finalized',
        icon: <CheckCircleOutline />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfCtReportFinal,
        target: '30 min',
      },
    ];

    phases.push({
      id: 'diagnostic-phase',
      title: 'Diagnostic Phase',
      description: 'Imaging and diagnostic procedures',
      color: '#9c27b0',
      icon: <Scanner />,
      events: diagnosticEvents,
      completed: diagnosticEvents.some(e => e.recorded),
    });

    // Treatment Phase
    const treatmentEvents: TimelineEvent[] = [
      {
        id: 'thrombolysis-order',
        timestamp: strokeCase.thrombolysisOrderTime || '',
        status: 'Thrombolysis Order',
        description: strokeCase.candidateForIVThrombolysis === 'YES' 
          ? 'IV thrombolysis ordered for eligible patient'
          : 'Thrombolysis treatment planning',
        icon: <Medication />,
        color: '#4caf50',
        recorded: !!strokeCase.thrombolysisOrderTime,
        target: '60 min',
      },
      {
        id: 'iv-thrombolysis-admin',
        timestamp: strokeCase.ivThrombolysisAdministrationTime || '',
        status: 'IV Thrombolysis Administration',
        description: strokeCase.ivThrombolysisGiven === 'YES'
          ? 'IV thrombolysis successfully administered'
          : strokeCase.reasonForNotAdministeringIV 
            ? `IV thrombolysis not given - ${strokeCase.reasonForNotAdministeringIV}`
            : 'IV thrombolysis administration',
        icon: <Healing />,
        color: '#4caf50',
        recorded: !!strokeCase.ivThrombolysisAdministrationTime,
        target: '60 min',
      },
      {
        id: 'mechanical-thrombectomy-puncture',
        timestamp: strokeCase.timeOfMechanicalThrombectomyPuncture || '',
        status: 'Mechanical Thrombectomy Puncture',
        description: strokeCase.candidateForMechanicalThrombectomy === 'YES'
          ? 'Mechanical thrombectomy procedure initiated'
          : 'Mechanical thrombectomy procedure planning',
        icon: <Build />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfMechanicalThrombectomyPuncture,
        target: '120 min',
      },
      {
        id: 'thrombectomy-complete',
        timestamp: strokeCase.timeOfThrombectomyComplete || '',
        status: 'Thrombectomy Complete',
        description: strokeCase.mechanicalThrombectomyPerformed === true
          ? 'Mechanical thrombectomy procedure completed'
          : 'Thrombectomy procedure completion',
        icon: <CheckCircle />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfThrombectomyComplete,
      },
    ];

    phases.push({
      id: 'treatment-phase',
      title: 'Treatment Phase',
      description: 'Acute stroke treatment and interventions',
      color: '#4caf50',
      icon: <Healing />,
      events: treatmentEvents,
      completed: treatmentEvents.some(e => e.recorded),
    });

    // Transfer Phase (if applicable)
    if (strokeCase.transferToAnotherHospital) {
      const transferEvents: TimelineEvent[] = [
        {
          id: 'transfer-activation',
          timestamp: strokeCase.timeOfTransferActivation || '',
          status: 'Transfer Activation',
          description: 'Patient transfer to another hospital activated',
          icon: <LocalShipping />,
          color: '#ff5722',
          recorded: !!strokeCase.timeOfTransferActivation,
        },
        {
          id: 'transfer-departure',
          timestamp: strokeCase.timeOfTransferDeparture || '',
          status: 'Transfer Departure',
          description: 'Patient departed for receiving hospital',
          icon: <DepartureBoard />,
          color: '#ff5722',
          recorded: !!strokeCase.timeOfTransferDeparture,
          target: strokeCase.facilityHasCt ? '40 min' : '20 min',
        },
      ];

      phases.push({
        id: 'transfer-phase',
        title: 'Transfer Phase',
        description: 'Transfer to receiving hospital',
        color: '#ff5722',
        icon: <LocalShipping />,
        events: transferEvents,
        completed: transferEvents.some(e => e.recorded),
      });
    }

    // Post-Treatment Management Phase
    const postTreatmentEvents: TimelineEvent[] = [
      {
        id: 'stroke-unit-admission',
        timestamp: strokeCase.admittedToStrokeUnit ? (strokeCase.dateOfAdmission || '') : '',
        status: 'Stroke Unit Admission',
        description: strokeCase.admittedToStrokeUnit
          ? 'Patient admitted to specialized stroke unit'
          : 'Stroke unit admission planning',
        icon: <LocalHospital />,
        color: '#ff9800',
        recorded: !!strokeCase.admittedToStrokeUnit,
        target: '24 hours',
      },
      {
        id: 'disposition',
        timestamp: strokeCase.disposition ? (strokeCase.dateOfAdmission || '') : '',
        status: 'Patient Disposition',
        description: strokeCase.disposition 
          ? `Patient disposition: ${strokeCase.disposition}`
          : 'Patient disposition planning',
        icon: <Assignment />,
        color: '#ff9800',
        recorded: !!strokeCase.disposition,
      },
      {
        id: 'follow-up-contact',
        timestamp: strokeCase.followUpContactAttempted ? (strokeCase.updatedAt || '') : '',
        status: 'Follow-up Contact',
        description: strokeCase.followUpContactAttempted
          ? 'Follow-up contact attempted'
          : 'Follow-up contact planning',
        icon: <CallMade />,
        color: '#ff9800',
        recorded: !!strokeCase.followUpContactAttempted,
      },
      {
        id: 'modified-rankin-scale',
        timestamp: strokeCase.modifiedRankinScaleAt90Days ? (strokeCase.updatedAt || '') : '',
        status: 'Modified Rankin Scale',
        description: strokeCase.modifiedRankinScaleAt90Days
          ? `90-day mRS score: ${strokeCase.modifiedRankinScaleAt90Days}`
          : '90-day Modified Rankin Scale assessment',
        icon: <Accessibility />,
        color: '#ff9800',
        recorded: !!strokeCase.modifiedRankinScaleAt90Days,
      },
    ];

    phases.push({
      id: 'post-treatment-management',
      title: 'Post-Treatment Management Phase',
      description: 'Recovery monitoring and follow-up care',
      color: '#ff9800',
      icon: <Psychology />,
      events: postTreatmentEvents,
      completed: postTreatmentEvents.some(e => e.recorded),
    });

    return phases;
  };

  const timelinePhases = createTimelinePhases();


  const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Stroke Timeline
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Critical timestamps and KPI performance for this stroke case
      </Typography>

      {/* Stroke Type Display */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom align="center">
              Stroke Type
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <Typography variant="h6">
                {strokeCase.strokeType || strokeCase.strokeTypeDetailed || 'Unknown'}
              </Typography>
              <Chip
                label="Type"
                size="small"
                color="primary"
              />
            </Box>
          </CardContent>
        </Card>
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
                                ? formatDateTime(event.timestamp)
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

export default StrokeTimelineView;