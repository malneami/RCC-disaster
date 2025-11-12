import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  DirectionsCar as TransportIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  AccessTime as PendingIcon,
  Bloodtype as BloodIcon,
  MedicalServices as SpecialistIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Ticket } from '../../../services/ticketService';

interface TicketDetailsTabProps {
  ticket: Ticket;
  onViewPatient: () => void;
}

const TicketDetailsTab: React.FC<TicketDetailsTabProps> = ({ ticket, onViewPatient }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'error';
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'IN_TRANSPORT':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <PendingIcon />;
      case 'ASSIGNED':
        return <AssignmentIcon />;
      case 'IN_TRANSPORT':
        return <TransportIcon />;
      case 'COMPLETED':
        return <CompletedIcon />;
      case 'CANCELLED':
        return <CancelledIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseJsonField = (field: string | undefined) => {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  };

  const symptoms = parseJsonField(ticket.symptoms);
  const vitals = parseJsonField(ticket.vitals);
  const requiredResources = parseJsonField(ticket.requiredResources);

  return (
    <Box>
      {/* Status and Priority Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip
                label={ticket.status}
                color={getStatusColor(ticket.status)}
                icon={getStatusIcon(ticket.status)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Current Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip
                label={ticket.priority}
                color={getPriorityColor(ticket.priority)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Priority Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip label={ticket.pathway} color="info" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Pathway
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {ticket.isEmergency ? 'YES' : 'NO'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Emergency Case
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Patient Information</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={onViewPatient}
                  sx={{ ml: 2 }}
                >
                  View Patient
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name"
                    secondary={`${ticket.patient.firstName} ${ticket.patient.lastName}`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Date of Birth"
                    secondary={formatDate(ticket.patient.dateOfBirth)}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Gender" secondary={ticket.patient.gender} />
                </ListItem>

                {ticket.patient.mrn && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="MRN" secondary={ticket.patient.mrn} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Hospital Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hospital Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <HospitalIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Origin Hospital"
                    secondary={ticket.originHospital.name}
                  />
                </ListItem>

                {ticket.destinationHospital && (
                  <ListItem>
                    <ListItemIcon>
                      <HospitalIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Destination Hospital"
                      secondary={ticket.destinationHospital.name}
                    />
                  </ListItem>
                )}

                {ticket.transportMode && (
                  <ListItem>
                    <ListItemIcon>
                      <TransportIcon />
                    </ListItemIcon>
                    <ListItemText primary="Transport Mode" secondary={ticket.transportMode} />
                  </ListItem>
                )}

                {ticket.emsUnit && (
                  <ListItem>
                    <ListItemIcon>
                      <TransportIcon />
                    </ListItemIcon>
                    <ListItemText primary="EMS Unit" secondary={ticket.emsUnit} />
                  </ListItem>
                )}
              </List>
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
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chief Complaint
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {ticket.chiefComplaint}
                  </Typography>

                  {symptoms && symptoms.symptoms && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Symptoms
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {symptoms.symptoms.map((symptom: string, index: number) => (
                          <Chip
                            key={index}
                            label={symptom}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}

                  {ticket.treatmentPlan && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Treatment Plan
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {ticket.treatmentPlan}
                      </Typography>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  {vitals && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Vital Signs
                      </Typography>
                      <List dense>
                        {vitals.bloodPressure && (
                          <ListItem>
                            <ListItemText
                              primary="Blood Pressure"
                              secondary={`${vitals.bloodPressure} mmHg`}
                            />
                          </ListItem>
                        )}
                        {vitals.heartRate && (
                          <ListItem>
                            <ListItemText
                              primary="Heart Rate"
                              secondary={`${vitals.heartRate} bpm`}
                            />
                          </ListItem>
                        )}
                        {vitals.temperature && (
                          <ListItem>
                            <ListItemText
                              primary="Temperature"
                              secondary={`${vitals.temperature}°C`}
                            />
                          </ListItem>
                        )}
                        {vitals.oxygenSaturation && (
                          <ListItem>
                            <ListItemText
                              primary="Oxygen Saturation"
                              secondary={`${vitals.oxygenSaturation}%`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements and Resources */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requirements & Resources
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <BloodIcon color={ticket.requiresBlood ? 'error' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Blood Required"
                        secondary={ticket.requiresBlood ? 'Yes' : 'No'}
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <SpecialistIcon
                          color={ticket.requiresSpecialist ? 'warning' : 'disabled'}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="Specialist Required"
                        secondary={ticket.requiresSpecialist ? 'Yes' : 'No'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  {requiredResources && (
                    <List dense>
                      {Object.entries(requiredResources).map(([resource, required]) => (
                        <ListItem key={resource}>
                          <ListItemIcon>
                            <HospitalIcon color={required ? 'primary' : 'disabled'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={resource.charAt(0).toUpperCase() + resource.slice(1)}
                            secondary={required ? 'Required' : 'Not Required'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline and Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline & Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Created" secondary={formatDate(ticket.createdAt)} />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Updated"
                        secondary={formatDate(ticket.updatedAt)}
                      />
                    </ListItem>

                    {ticket.emsContactTime && (
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="EMS Contact Time"
                          secondary={formatDate(ticket.emsContactTime)}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Created By
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {ticket.createdBy.firstName} {ticket.createdBy.lastName} (
                    {ticket.createdBy.role})
                  </Typography>

                  {ticket.assignedTo && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Assigned To
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {ticket.assignedTo.firstName} {ticket.assignedTo.lastName} (
                        {ticket.assignedTo.role})
                      </Typography>
                    </>
                  )}

                  {ticket.notes && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2">{ticket.notes}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TicketDetailsTab;

