import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  FiberManualRecord,
  AccessTime,
  LocalHospital,
  MedicalServices,
  Person,
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
}

const StemiTimelineView: React.FC<StemiTimelineViewProps> = ({ stemiCase }) => {
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      SUSPECTED: '#ff9800',
      ECG_PENDING: '#2196f3',
      STEMI_CONFIRMED: '#f44336',
      NSTEMI_CONFIRMED: '#e91e63',
      UNSTABLE_ANGINA: '#9c27b0',
      RCC_ACTIVATED: '#ff5722',
      IN_TRANSIT: '#607d8b',
      PCI_READY: '#4caf50',
      BALLOON_INFLATED: '#8bc34a',
      CCU_ADMITTED: '#009688',
      DISCHARGED: '#795548',
      EXPIRED: '#424242',
    };
    return statusColors[status] || '#757575';
  };

  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Patient arrival
    if (stemiCase.pathwayStarted) {
      events.push({
        id: 'arrival',
        timestamp: stemiCase.pathwayStarted,
        status: 'Patient Arrival',
        description: `Patient arrived at ${stemiCase.originHospital?.name || 'hospital'}`,
        icon: <Person />,
        color: '#2196f3',
      });
    }

    // Triage
    if (stemiCase.triageTime) {
      events.push({
        id: 'triage',
        timestamp: stemiCase.triageTime,
        status: 'Triage Complete',
        description: 'Patient triaged and assessed',
        icon: <AccessTime />,
        color: '#ff9800',
      });
    }

    // First ECG
    if (stemiCase.firstEcgTime) {
      events.push({
        id: 'ecg',
        timestamp: stemiCase.firstEcgTime,
        status: 'First ECG',
        description: 'First ECG performed and interpreted',
        icon: <MedicalServices />,
        color: '#2196f3',
      });
    }

    // Current status
    if (stemiCase.currentStatus) {
      events.push({
        id: 'status',
        timestamp: stemiCase.updatedAt,
        status: stemiCase.currentStatus.replace(/_/g, ' '),
        description: `Current status: ${stemiCase.currentStatus.replace(/_/g, ' ')}`,
        icon: <FiberManualRecord />,
        color: getStatusColor(stemiCase.currentStatus),
      });
    }

    // RCC Activation
    if (stemiCase.rccActivated) {
      events.push({
        id: 'rcc',
        timestamp: stemiCase.updatedAt,
        status: 'RCC Activated',
        description: 'Regional Coordination Center activated',
        icon: <LocalHospital />,
        color: '#ff5722',
      });
    }

    // Door Out Time
    if (stemiCase.doorOutTime) {
      events.push({
        id: 'door-out',
        timestamp: stemiCase.doorOutTime,
        status: 'Door Out',
        description: 'Patient left for PCI facility',
        icon: <LocalHospital />,
        color: '#607d8b',
      });
    }

    // Balloon Inflation
    if (stemiCase.balloonInflationTime) {
      events.push({
        id: 'balloon',
        timestamp: stemiCase.balloonInflationTime,
        status: 'Balloon Inflated',
        description: 'Primary PCI balloon inflation completed',
        icon: <MedicalServices />,
        color: '#4caf50',
      });
    }

    // Thrombolytic Administration
    if (stemiCase.thrombolyticGiven && stemiCase.thrombolyticAdminTime) {
      events.push({
        id: 'thrombolytic',
        timestamp: stemiCase.thrombolyticAdminTime,
        status: 'Thrombolytic Given',
        description: 'Thrombolytic therapy administered',
        icon: <MedicalServices />,
        color: '#e91e63',
      });
    }

    // Sort events by timestamp
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = createTimelineEvents();


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
      </Box>

      {/* Timeline Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Timeline Events
          </Typography>
          
          {timelineEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No timeline events recorded yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {timelineEvents.map((event, index) => (
                <Box key={event.id}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: event.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          mb: 1,
                        }}
                      >
                        {event.icon}
                      </Box>
                      {index < timelineEvents.length - 1 && (
                        <Box
                          sx={{
                            width: 2,
                            height: 40,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {event.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {StemiDatetimeService.formatForDisplay(event.timestamp)}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {event.description}
                      </Typography>
                    </Box>
                  </Box>

                  {index < timelineEvents.length - 1 && <Divider sx={{ ml: 3 }} />}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StemiTimelineView;
