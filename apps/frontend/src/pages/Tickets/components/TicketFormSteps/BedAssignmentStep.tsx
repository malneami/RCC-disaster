import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useQuery } from 'react-query';
import { CreateTicketData, UpdateTicketData } from '../../../../services/ticketService';
import { patientService } from '../../../../services/patientService';
import { ticketService } from '../../../../services/ticketService';
import { BedAssignmentFormData } from '../../../Trauma/types/traumaTypes';
import BedAssignmentStep from '../../../Trauma/components/forms/BedAssignmentStep';

interface TicketBedAssignmentStepProps {
  formData: Partial<CreateTicketData | UpdateTicketData>;
  onDataChange: (data: Partial<CreateTicketData | UpdateTicketData>) => void;
  patientId?: string;
  ticketId?: string;
  mode: 'create' | 'update';
  validationError?: string | null;
  originHospitalId?: string;
  destinationHospitalId?: string;
}

const TicketBedAssignmentStep: React.FC<TicketBedAssignmentStepProps> = ({
  formData,
  onDataChange,
  patientId,
  ticketId,
  mode,
  validationError,
  originHospitalId,
  destinationHospitalId,
}) => {
  const [showNewBedAssignment, setShowNewBedAssignment] = useState(false);
  const [existingBedAssignments, setExistingBedAssignments] = useState<Array<{
    caseId: string;
    caseType: 'TRAUMA' | 'STROKE' | 'STEMI';
    assignedBed: NonNullable<any>;
  }>>([]);

  // Fetch ticket data for update mode
  const { data: ticketData, isLoading: loadingTicket } = useQuery(
    ['ticket', ticketId],
    () => {
      if (!ticketId) throw new Error('Ticket ID is required');
      return ticketService.getTicketById(ticketId);
    },
    {
      enabled: mode === 'update' && !!ticketId,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: patientCasesData, isLoading: loadingPatientCases } = useQuery(
    ['patientCasesWithBeds', patientId],
    () => {
      if (!patientId) throw new Error('Patient ID is required');
      return patientService.getPatientCasesWithBeds(patientId);
    },
    {
      enabled: mode === 'create' && !!patientId && !showNewBedAssignment,
      staleTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (mode === 'update' && ticketData) {
      const casesWithBeds: Array<{
        caseId: string;
        caseType: 'TRAUMA' | 'STROKE' | 'STEMI';
        assignedBed: NonNullable<any>;
      }> = [];

      ticketData.traumaCases?.forEach((case_: any) => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'TRAUMA',
            assignedBed: case_.assignedBed,
          });
        }
      });

      ticketData.strokeCases?.forEach((case_: any) => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'STROKE',
            assignedBed: case_.assignedBed,
          });
        }
      });

      ticketData.stemiCases?.forEach((case_: any) => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'STEMI',
            assignedBed: case_.assignedBed,
          });
        }
      });

      setExistingBedAssignments(casesWithBeds);

      if (!formData.bedAssignment || !formData.bedAssignment.bedId) {
        let bedToUse: any = null;
        
        if (casesWithBeds.length > 0) {
          const mostRecent = casesWithBeds.sort((a, b) => 
            new Date(b.assignedBed.arrivalDate || 0).getTime() - new Date(a.assignedBed.arrivalDate || 0).getTime()
          )[0];
          bedToUse = mostRecent.assignedBed;
        } 
        else if (ticketData.patientBeds && ticketData.patientBeds.length > 0) {
          bedToUse = ticketData.patientBeds[0];
        }
        
        if (bedToUse) {
          let hospitalType: 'origin' | 'destination' | undefined;
          const originHospitalId = ticketData.originHospitalId;
          const destinationHospitalId = ticketData.destinationHospitalId;
          
          if (originHospitalId && bedToUse.hospital.id === originHospitalId) {
            hospitalType = 'origin';
          } else if (destinationHospitalId && bedToUse.hospital.id === destinationHospitalId) {
            hospitalType = 'destination';
          }
          
          onDataChange({
            bedAssignment: {
              bedId: bedToUse.id,
              hospitalId: bedToUse.hospital.id,
              hospitalType,
              unitId: bedToUse.unit.id,
              bedNumber: bedToUse.bedNumber,
              location: bedToUse.location,
              arrivalDate: bedToUse.arrivalDate,
              assignedBed: {
                id: bedToUse.id,
                bedNumber: bedToUse.bedNumber,
                unitName: bedToUse.unit.name,
                hospitalName: bedToUse.hospital.name,
              },
            } as BedAssignmentFormData,
          });
        }
      }
    } else if (mode === 'create' && patientCasesData && patientId) {
      const casesWithBeds: Array<{
        caseId: string;
        caseType: 'TRAUMA' | 'STROKE' | 'STEMI';
        assignedBed: NonNullable<any>;
      }> = [];

      patientCasesData.traumaCases?.forEach(case_ => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'TRAUMA',
            assignedBed: case_.assignedBed,
          });
        }
      });

      patientCasesData.strokeCases?.forEach(case_ => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'STROKE',
            assignedBed: case_.assignedBed,
          });
        }
      });

      patientCasesData.stemiCases?.forEach(case_ => {
        if (case_.assignedBed) {
          casesWithBeds.push({
            caseId: case_.id,
            caseType: 'STEMI',
            assignedBed: case_.assignedBed,
          });
        }
      });

      setExistingBedAssignments(casesWithBeds);
    }
  }, [ticketData, patientCasesData, mode, patientId, formData.bedAssignment, onDataChange]);

  const handleBedAssignmentChange = (data: Partial<BedAssignmentFormData>) => {
    onDataChange({
      bedAssignment: {
        ...(formData.bedAssignment as BedAssignmentFormData || {}),
        ...data,
      } as BedAssignmentFormData,
    });
  };

  const getCaseTypeColor = (caseType: 'TRAUMA' | 'STROKE' | 'STEMI') => {
    switch (caseType) {
      case 'TRAUMA':
        return 'error';
      case 'STROKE':
        return 'warning';
      case 'STEMI':
        return 'info';
      default:
        return 'default';
    }
  };

  const isLoading = (mode === 'update' && loadingTicket) || (mode === 'create' && loadingPatientCases);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bed Assignment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Assign a bed to the case that will be created from this ticket, or update an existing bed assignment.
      </Typography>

      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      {/* Show existing bed assignments */}
      {((existingBedAssignments.length > 0) || (mode === 'update' && ticketData?.patientBeds && ticketData.patientBeds.length > 0)) && !showNewBedAssignment && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Existing Bed Assignments
          </Typography>
          {existingBedAssignments.map((item, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={item.caseType}
                        color={getCaseTypeColor(item.caseType)}
                        size="small"
                      />
                      <Typography variant="subtitle2">
                        Bed: {item.assignedBed.bedNumber}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Unit: {item.assignedBed.unit.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hospital: {item.assignedBed.hospital.name}
                    </Typography>
                    {item.assignedBed.location && (
                      <Typography variant="body2" color="text.secondary">
                        Location: {item.assignedBed.location}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          {/* Show patient beds if no case beds */}
          {existingBedAssignments.length === 0 && mode === 'update' && ticketData?.patientBeds && ticketData.patientBeds.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Patient Bed Assignment (not linked to a case)
              </Typography>
              {ticketData.patientBeds.map((bed) => (
                <Box key={bed.id} sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Bed:</strong> {bed.bedNumber} - {bed.unit.name} ({bed.hospital.name})
                  </Typography>
                  {bed.location && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Location:</strong> {bed.location}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
          <Button
            variant="outlined"
            onClick={() => setShowNewBedAssignment(true)}
            sx={{ mt: 2 }}
          >
            Create New Bed Assignment
          </Button>
        </Box>
      )}

      {/* Show bed assignment form */}
      {(showNewBedAssignment || (existingBedAssignments.length === 0 && (!ticketData?.patientBeds || ticketData.patientBeds.length === 0))) && (
        <Box>
          {existingBedAssignments.length > 0 && (
            <Button
              variant="text"
              onClick={() => {
                setShowNewBedAssignment(false);
                onDataChange({ bedAssignment: undefined });
              }}
              sx={{ mb: 2 }}
            >
              Cancel New Assignment
            </Button>
          )}
          <BedAssignmentStep
            data={formData.bedAssignment as BedAssignmentFormData || {}}
            onChange={handleBedAssignmentChange}
            errors={{}}
            validationErrors={validationError ? { bedAssignment: validationError } : {}}
            patientInfo={{
              originHospitalId: originHospitalId || '',
              destinationHospitalId: destinationHospitalId || '',
            } as any}
          />
        </Box>
      )}
    </Box>
  );
};

export default TicketBedAssignmentStep;

