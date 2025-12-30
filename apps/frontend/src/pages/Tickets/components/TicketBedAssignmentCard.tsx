import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import { Ticket } from '../../../services/ticketService';

interface TicketBedAssignmentCardProps {
  ticket: Ticket;
}

const TicketBedAssignmentCard: React.FC<TicketBedAssignmentCardProps> = ({ ticket }) => {
  const casesWithBeds: Array<{
    caseId: string;
    caseType: 'TRAUMA' | 'STROKE' | 'STEMI';
    assignedBed: NonNullable<any>;
  }> = [];

  ticket.traumaCases?.forEach(case_ => {
    if (case_.assignedBed) {
      casesWithBeds.push({
        caseId: case_.id,
        caseType: 'TRAUMA',
        assignedBed: case_.assignedBed,
      });
    }
  });

  ticket.strokeCases?.forEach(case_ => {
    if (case_.assignedBed) {
      casesWithBeds.push({
        caseId: case_.id,
        caseType: 'STROKE',
        assignedBed: case_.assignedBed,
      });
    }
  });

  ticket.stemiCases?.forEach(case_ => {
    if (case_.assignedBed) {
      casesWithBeds.push({
        caseId: case_.id,
        caseType: 'STEMI',
        assignedBed: case_.assignedBed,
      });
    }
  });

  // Add patient beds (beds assigned without a case)
  const patientBedsWithType: Array<{
    caseId?: string;
    caseType: 'PATIENT';
    assignedBed: NonNullable<any>;
  }> = (ticket.patientBeds || []).map(bed => ({
    caseType: 'PATIENT' as const,
    assignedBed: bed,
  }));

  // Combine case beds and patient beds
  const allBeds = [...casesWithBeds, ...patientBedsWithType];

  const getCaseTypeColor = (caseType: 'TRAUMA' | 'STROKE' | 'STEMI' | 'PATIENT') => {
    switch (caseType) {
      case 'TRAUMA':
        return 'error';
      case 'STROKE':
        return 'warning';
      case 'STEMI':
        return 'info';
      case 'PATIENT':
        return 'success';
      default:
        return 'default';
    }
  };

  if (allBeds.length === 0) {
    // Check if there are any cases at all
    const hasCases = (ticket.traumaCases && ticket.traumaCases.length > 0) ||
                     (ticket.strokeCases && ticket.strokeCases.length > 0) ||
                     (ticket.stemiCases && ticket.stemiCases.length > 0);
    
    if (!hasCases && (!ticket.patientBeds || ticket.patientBeds.length === 0)) {
      return null; 
    }

    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <HotelIcon color="primary" />
            <Typography variant="h6">Bed Assignment</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            No bed assignments found for associated cases.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <HotelIcon color="primary" />
          <Typography variant="h6">Bed Assignment</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {allBeds.length === 1 ? (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Chip
                label={allBeds[0].caseType}
                color={getCaseTypeColor(allBeds[0].caseType)}
                size="small"
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bed Number
                </Typography>
                <Typography variant="body1">
                  {allBeds[0].assignedBed.bedNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Unit
                </Typography>
                <Typography variant="body1">
                  {allBeds[0].assignedBed.unit.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hospital
                </Typography>
                <Typography variant="body1">
                  {allBeds[0].assignedBed.hospital.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={allBeds[0].assignedBed.status}
                  size="small"
                  color={allBeds[0].assignedBed.status === 'OCCUPIED' ? 'error' : 'default'}
                />
              </Grid>
              {allBeds[0].assignedBed.location && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {allBeds[0].assignedBed.location}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Box>
            {allBeds.map((item, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    <Chip
                      label={item.caseType}
                      color={getCaseTypeColor(item.caseType)}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Bed: {item.assignedBed.bedNumber} - {item.assignedBed.unit.name}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Bed Number
                      </Typography>
                      <Typography variant="body1">
                        {item.assignedBed.bedNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Unit
                      </Typography>
                      <Typography variant="body1">
                        {item.assignedBed.unit.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Hospital
                      </Typography>
                      <Typography variant="body1">
                        {item.assignedBed.hospital.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={item.assignedBed.status}
                        size="small"
                        color={item.assignedBed.status === 'OCCUPIED' ? 'error' : 'default'}
                      />
                    </Grid>
                    {item.assignedBed.location && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {item.assignedBed.location}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketBedAssignmentCard;

