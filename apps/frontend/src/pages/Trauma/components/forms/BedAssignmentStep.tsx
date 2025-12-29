import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BedAssignmentFormData, PatientInfoFormData } from '../../types/traumaTypes';
import { useBeds } from '../../../Beds/hooks/useBeds';
import { bedService, BedListItem, Unit } from '../../../Beds/services/bedService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import { useQuery } from 'react-query';

interface BedAssignmentStepProps {
  data: BedAssignmentFormData;
  onChange: (data: Partial<BedAssignmentFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
  patientInfo?: PatientInfoFormData;
  onValidationError?: (error: string | null) => void;
}

const BedAssignmentStep: React.FC<BedAssignmentStepProps> = ({
  data,
  onChange,
  validationErrors = {},
  patientInfo,
  onValidationError,
}) => {
  const [bedStatusError, setBedStatusError] = useState<string | null>(null);
  const [hospitalType, setHospitalType] = useState<'origin' | 'destination' | ''>(
    data.hospitalType || ''
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    data.hospitalId || ''
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>(data.unitId || '');
  const [arrivalDate, setArrivalDate] = useState<Date | null>(
    data.arrivalDate ? new Date(data.arrivalDate) : null
  );

  const originHospitalId = patientInfo?.originHospitalId;
  const destinationHospitalId = patientInfo?.destinationHospitalId;

  const { data: hospitalsData } = useQuery(
    'hospitals',
    () => hospitalService.getAllHospitals(),
    {
      staleTime: 10 * 60 * 1000,
    }
  );
  const hospitals = hospitalsData || [];

  const getHospitalName = (hospitalId: string) => {
    const hospital = hospitals.find((h: Hospital) => h.id === hospitalId);
    if (hospital) return hospital.name;
    if (hospitalId === originHospitalId) return 'Origin Hospital';
    if (hospitalId === destinationHospitalId) return 'Destination Hospital';
    return hospitalId;
  };

  const currentHospitalId = useMemo(() => {
    if (hospitalType === 'origin') return originHospitalId;
    if (hospitalType === 'destination') return destinationHospitalId;
    return selectedHospitalId;
  }, [hospitalType, originHospitalId, destinationHospitalId, selectedHospitalId]);

  const { data: unitsData, isLoading: unitsLoading } = useQuery(
    ['units', currentHospitalId],
    () => bedService.getUnits(currentHospitalId || undefined),
    {
      enabled: !!currentHospitalId,
      staleTime: 5 * 60 * 1000,
    }
  );
  const units = unitsData || [];

  const { beds, loading: bedsLoading } = useBeds(
    currentHospitalId || selectedUnitId
      ? {
          hospitalId: currentHospitalId || undefined,
          unitId: selectedUnitId || undefined,
        }
      : undefined
  );

  const availableBeds = beds.filter(
    (bed) => bed.status === 'VACANT' || bed.status === 'RESERVED'
  );

  useEffect(() => {
    if (selectedUnitId && !data.bedId && availableBeds.length > 0) {
      // Only consider VACANT or RESERVED beds for auto-assignment
      if (availableBeds.length > 0) {
        const firstVacantBed = availableBeds.find((bed) => bed.status === 'VACANT') || availableBeds[0];
        if (firstVacantBed && firstVacantBed.id !== data.bedId) {
          handleBedSelection(firstVacantBed.id, firstVacantBed);
        }
      }
    }
  }, [selectedUnitId, availableBeds.length]);

  const handleHospitalTypeChange = (type: 'origin' | 'destination' | '') => {
    setHospitalType(type);
    setSelectedUnitId('');
    
    const hospitalId = type === 'origin' ? originHospitalId : destinationHospitalId;
    setSelectedHospitalId(hospitalId || '');
    
    onChange({
      hospitalType: type as 'origin' | 'destination' | undefined,
      hospitalId: hospitalId || undefined,
      unitId: undefined,
      bedId: undefined,
      bedNumber: undefined,
      location: undefined,
      assignedBed: undefined,
    });
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    
    onChange({
      unitId,
      bedId: undefined,
      bedNumber: undefined,
      location: undefined,
      assignedBed: undefined,
    });
  };

  const handleBedSelection = (bedId: string, bed?: BedListItem) => {
    const selectedBed = bed || availableBeds.find((b) => b.id === bedId);
    if (selectedBed) {
      if (selectedBed.status !== 'VACANT' && selectedBed.status !== 'RESERVED') {
        const errorMessage = `Bed ${selectedBed.bedNumber} is ${selectedBed.status} and cannot be assigned. Please select a VACANT or RESERVED bed.`;
        setBedStatusError(errorMessage);
        if (onValidationError) {
          onValidationError(errorMessage);
        }
        onChange({
          bedId: undefined,
          bedNumber: undefined,
          assignedBed: undefined,
        });
        return;
      }
      
      setBedStatusError(null);
      if (onValidationError) {
        onValidationError(null);
      }
      
      onChange({
        bedId,
        bedNumber: selectedBed.bedNumber,
        assignedBed: {
          id: selectedBed.id,
          bedNumber: selectedBed.bedNumber,
          unitName: selectedBed.unitName,
          hospitalName: selectedBed.hospital?.name || getHospitalName(currentHospitalId || ''),
        },
      });
    }
  };

  const handleArrivalDateChange = (newValue: Date | null) => {
    setArrivalDate(newValue);
    onChange({
      arrivalDate: newValue?.toISOString() || undefined,
    });
  };

  const assignedBed = data.assignedBed;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Bed Assignment (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign a bed to the patient. You can skip this step if no bed assignment is needed.
          </Typography>
          {bedStatusError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bedStatusError}
            </Alert>
          )}
          {validationErrors?.['bedAssignment.bedId'] && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors['bedAssignment.bedId']}
            </Alert>
          )}
        </Grid>

        {(originHospitalId || destinationHospitalId) && (
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Select Hospital</FormLabel>
              <RadioGroup
                row
                value={hospitalType}
                onChange={(e) => handleHospitalTypeChange(e.target.value as 'origin' | 'destination' | '')}
              >
                {originHospitalId && (
                  <FormControlLabel
                    value="origin"
                    control={<Radio />}
                    label={`Origin: ${getHospitalName(originHospitalId)}`}
                  />
                )}
                {destinationHospitalId && (
                  <FormControlLabel
                    value="destination"
                    control={<Radio />}
                    label={`Destination: ${getHospitalName(destinationHospitalId)}`}
                  />
                )}
              </RadioGroup>
            </FormControl>
          </Grid>
        )}

        {currentHospitalId && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={unitsLoading}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={selectedUnitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                label="Unit"
              >
                {unitsLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading units...
                  </MenuItem>
                ) : units.length === 0 ? (
                  <MenuItem disabled>No units available</MenuItem>
                ) : (
                  units.map((unit: Unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.bedType})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        )}

        {selectedUnitId && (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                disabled={bedsLoading}
                error={!!bedStatusError || !!validationErrors?.['bedAssignment.bedId']}
              >
                <InputLabel>Select Bed (Optional)</InputLabel>
                <Select
                  value={data.bedId || ''}
                  onChange={(e) => handleBedSelection(e.target.value)}
                  label="Select Bed (Optional)"
                >
                  <MenuItem value="">
                    <em>Auto-assign first available bed</em>
                  </MenuItem>
                  {bedsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading beds...
                    </MenuItem>
                  ) : availableBeds.length === 0 ? (
                    <MenuItem disabled>
                      No available beds in this unit
                    </MenuItem>
                  ) : (
                    availableBeds.map((bed: BedListItem) => (
                      <MenuItem key={bed.id} value={bed.id}>
                        {bed.bedNumber} - {bed.unitName} ({bed.status})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {(bedStatusError || validationErrors?.['bedAssignment.bedId']) && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {bedStatusError || validationErrors?.['bedAssignment.bedId']}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                  Leave empty to auto-assign first available bed, or select a specific bed
                </Typography>
              </FormControl>
            </Grid>

            {assignedBed && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6">Assigned Bed</Typography>
                      <Chip label={data.bedId ? 'Assigned' : 'Auto-assigned'} color="success" size="small" />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Bed Number
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {assignedBed.bedNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Unit
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {assignedBed.unitName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Hospital
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {assignedBed.hospitalName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Bed ID
                        </Typography>
                        <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {assignedBed.id}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {assignedBed && (
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Expected Arrival Date & Time"
                  value={arrivalDate}
                  onChange={handleArrivalDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationErrors?.['bedAssignment.arrivalDate'],
                      helperText: validationErrors?.['bedAssignment.arrivalDate'] || 'Date and time when the patient will arrive at the bed',
                    },
                  }}
                />
              </Grid>
            )}

            {selectedUnitId && !assignedBed && (
              <Grid item xs={12}>
                <Alert severity="info">
                  {availableBeds.length > 0
                    ? `First available bed will be auto-assigned from ${availableBeds.length} available bed(s).`
                    : 'No available beds found in this unit.'}
                </Alert>
              </Grid>
            )}
          </>
        )}

        {!currentHospitalId && (
          <Grid item xs={12}>
            <Alert severity="info">
              Select a hospital to assign a bed, or skip this step to proceed without bed assignment.
            </Alert>
          </Grid>
        )}
      </Grid>
    </LocalizationProvider>
  );
};

export default BedAssignmentStep;

