import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faMapMarkerAlt, faAmbulance, faHandPointer, faTimes, faLink } from '@fortawesome/free-solid-svg-icons';
import { disasterService, CreateDisasterIncidentPayload, DisasterIncidentType, DisasterScope } from '../../../services/disasterService';
import { useSnackbar } from 'notistack';
import DisasterMapPicker from './DisasterMapPicker';
import { LiveAmbulanceMap } from '../../../components/LiveTracking';
import HospitalSelect from '../../../components/Common/HospitalSelect';
import type { Hospital } from '../../../services/hospitalService';

interface DisasterIncidentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INTERNAL_INCIDENT_OPTIONS: { value: DisasterIncidentType; label: string }[] = [
  { value: 'INTERNAL_FIRE', label: 'Fire Incident' },
  { value: 'SMOKE_ELECTRICAL_FAILURE', label: 'Smoke / Electrical Failure / Short Circuit' },
  { value: 'POWER_FAILURE', label: 'Power Failure' },
  { value: 'WATER_LEAKAGE_FLOODING', label: 'Water Leakage / Flooding' },
  { value: 'IT_SYSTEM_FAILURE', label: 'IT System Failure' },
];

const EXTERNAL_INCIDENT_OPTIONS: { value: DisasterIncidentType; label: string }[] = [
  { value: 'RTA_MCI', label: 'RTA/MCI (Mass Casualty)' },
  { value: 'CODE_YELLOW', label: 'Code Yellow' },
  { value: 'EARTHQUAKE', label: 'Earthquake' },
  { value: 'FLOOD', label: 'Flood' },
  { value: 'FIRE', label: 'Fire' },
  { value: 'CHEMICAL_SPILL', label: 'Chemical Spill' },
  { value: 'OUTBREAK', label: 'Infectious Disease Outbreak' },
];

const DisasterIncidentForm: React.FC<DisasterIncidentFormProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disasterScope, setDisasterScope] = useState<DisasterScope | null>(null);
  const [form, setForm] = useState<Partial<CreateDisasterIncidentPayload> & { incidentType: DisasterIncidentType }>({
    incidentType: 'RTA_MCI',
    colorCode: 'RED',
    locationLat: 0,
    locationLng: 0,
    estimatedGreen: 0,
    estimatedYellow: 0,
    estimatedRed: 0,
    estimatedBlack: 0,
  });

  const incidentTypeOptions = disasterScope === 'INTERNAL' ? INTERNAL_INCIDENT_OPTIONS : EXTERNAL_INCIDENT_OPTIONS;

  const handleScopeChange = (scope: DisasterScope) => {
    setDisasterScope(scope);
    const options = scope === 'INTERNAL' ? INTERNAL_INCIDENT_OPTIONS : EXTERNAL_INCIDENT_OPTIONS;
    setForm((f) => ({ ...f, incidentType: options[0].value }));
    if (scope === 'EXTERNAL') {
      setSelectedInternalHospitalId('');
      handleClearLocation();
    }
  };

  const handleInternalHospitalSelect = useCallback(
    (hospital: Hospital | null) => {
      if (!hospital) {
        setSelectedInternalHospitalId('');
        setForm((f) => ({ ...f, locationLat: 0, locationLng: 0, locationAddress: '' }));
        return;
      }
      setSelectedInternalHospitalId(hospital.id);
      const lat = hospital.latitude ?? 17.5;
      const lng = hospital.longitude ?? 42.5;
      const address = [hospital.name, hospital.address].filter(Boolean).join(', ') || hospital.name;
      setForm((f) => ({
        ...f,
        locationLat: lat,
        locationLng: lng,
        locationAddress: address,
      }));
      enqueueSnackbar(`Location set to ${hospital.name}`, { variant: 'success', autoHideDuration: 2000 });
    },
    [enqueueSnackbar]
  );

  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  const [assignedAmbulances, setAssignedAmbulances] = useState<{ id: string; callSign?: string; triageCategory?: string }[]>([]);
  const [selectedTriageCategory, setSelectedTriageCategory] = useState<'RED' | 'YELLOW' | 'GREEN' | 'BLACK'>('RED');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [pasteLinkUrl, setPasteLinkUrl] = useState('');
  const [pasteLinkLoading, setPasteLinkLoading] = useState(false);
  const [selectedInternalHospitalId, setSelectedInternalHospitalId] = useState('');

  const reverseGeocode = (lat: number, lng: number): Promise<string> => {
    return fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then((r) => r.json())
      .then((data) => data.display_name || '')
      .catch(() => '');
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setForm((f) => ({ ...f, locationLat: lat, locationLng: lng }));
    enqueueSnackbar('Location selected', { variant: 'success', autoHideDuration: 2000 });
    setGeocoding(true);
    reverseGeocode(lat, lng)
      .then((address) => {
        setForm((f) => ({ ...f, locationAddress: address }));
      })
      .finally(() => setGeocoding(false));
  };

  const handleClearLocation = () => {
    setSelectedInternalHospitalId('');
    setForm((f) => ({
      ...f,
      locationLat: 0,
      locationLng: 0,
      locationAddress: '',
    }));
    enqueueSnackbar('Location cleared', { variant: 'info', autoHideDuration: 1500 });
  };

  const handlePasteLink = async () => {
    if (!pasteLinkUrl.trim()) {
      enqueueSnackbar('Please paste a Google Maps link', { variant: 'warning' });
      return;
    }
    setPasteLinkLoading(true);
    setError(null);
    try {
      const { lat, lng } = await disasterService.resolveMapUrl(pasteLinkUrl.trim());
      handleMapLocationChange(lat, lng);
      setPasteLinkUrl('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not resolve map link';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setPasteLinkLoading(false);
    }
  };

  const handleGetLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          locationLat: pos.coords.latitude,
          locationLng: pos.coords.longitude,
        }));
        // Reverse geocode via Nominatim
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        )
          .then((r) => r.json())
          .then((data) => {
            setForm((f) => ({ ...f, locationAddress: data.display_name || '' }));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      },
      () => {
        setError('Could not get location');
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!disasterScope) {
      setError('Please select disaster scope (Internal or External)');
      return;
    }
    if (!form.incidentType) {
      setError('Incident type is required');
      return;
    }
    if (
      form.locationLat == null ||
      form.locationLng == null ||
      (form.locationLat === 0 && form.locationLng === 0)
    ) {
      setError('Please select a location on the map or use GPS');
      return;
    }
    setLoading(true);
    try {
      const payload: CreateDisasterIncidentPayload = {
        disasterScope,
        incidentType: form.incidentType,
        locationLat: form.locationLat,
        locationLng: form.locationLng,
        locationAddress: form.locationAddress,
        locationDescription: form.locationDescription,
        estimatedGreen: form.estimatedGreen ?? 0,
        estimatedYellow: form.estimatedYellow ?? 0,
        estimatedRed: form.estimatedRed ?? 0,
        estimatedBlack: form.estimatedBlack ?? 0,
        notes: form.notes,
      };
      if (form.incidentType === 'RTA_MCI') payload.colorCode = form.colorCode || 'RED';

      const result = await disasterService.createIncident(payload);
      setCreatedIncidentId(result.incident?.id || null);
      enqueueSnackbar('Disaster incident created successfully', { variant: 'success' });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to create incident';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isValidAmbulanceId = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id) && !id.startsWith('gps-');
  };

  const handleAssignAmbulance = async (
    incidentId: string,
    ambulanceId: string,
    ambulance?: { callSign?: string },
    triageCategory?: string
  ) => {
    if (!isValidAmbulanceId(ambulanceId)) {
      enqueueSnackbar('This ambulance is not registered in the system and cannot be assigned.', { variant: 'warning' });
      return;
    }
    if (assignedAmbulances.some((a) => a.id === ambulanceId)) {
      enqueueSnackbar('Ambulance already assigned', { variant: 'info' });
      return;
    }
    const category = (form.incidentType === 'RTA_MCI' ? triageCategory || selectedTriageCategory : undefined) as
      | 'RED'
      | 'YELLOW'
      | 'GREEN'
      | 'BLACK'
      | undefined;
    setAssigningId(ambulanceId);
    try {
      await disasterService.assignAmbulance(incidentId, ambulanceId, category);
      setAssignedAmbulances((prev) => [
        ...prev,
        { id: ambulanceId, callSign: ambulance?.callSign, triageCategory: category },
      ]);
      enqueueSnackbar('Ambulance assigned successfully', { variant: 'success' });
      onSuccess?.();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to assign', { variant: 'error' });
    } finally {
      setAssigningId(null);
    }
  };

  const handleClose = () => {
    setDisasterScope(null);
    setSelectedInternalHospitalId('');
    setForm({
      incidentType: 'RTA_MCI',
      colorCode: 'RED',
      locationLat: 0,
      locationLng: 0,
      estimatedGreen: 0,
      estimatedYellow: 0,
      estimatedRed: 0,
      estimatedBlack: 0,
    });
    setCreatedIncidentId(null);
    setAssignedAmbulances([]);
    setSelectedTriageCategory('RED');
    setPasteLinkUrl('');
    setError(null);
    onClose();
  };

  return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={createdIncidentId ? 'lg' : 'sm'}
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#856404' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Create Disaster Incident
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              {!createdIncidentId && (
              <>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Disaster Scope</InputLabel>
                  <Select
                    value={disasterScope ?? ''}
                    label="Disaster Scope"
                    onChange={(e) => handleScopeChange(e.target.value as DisasterScope)}
                  >
                    <MenuItem value="INTERNAL">Internal (Hospital)</MenuItem>
                    <MenuItem value="EXTERNAL">External (Community)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={!disasterScope}>
                  <InputLabel>Incident Type</InputLabel>
                  <Select
                    value={form.incidentType}
                    label="Incident Type"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        incidentType: e.target.value as DisasterIncidentType,
                      }))
                    }
                  >
                    {incidentTypeOptions.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              </>)}

              {!createdIncidentId && disasterScope === 'INTERNAL' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Select hospital or use map/GPS below
                  </Typography>
                  <HospitalSelect
                    value={selectedInternalHospitalId}
                    onChange={setSelectedInternalHospitalId}
                    onHospitalSelect={handleInternalHospitalSelect}
                    label="Hospital (Internal Incident Location)"
                    placeholder="Select hospital"
                    disabled={loading}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                {!createdIncidentId ? (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 1,
                        p: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                        <FontAwesomeIcon icon={faHandPointer} color="#1976d2" />
                        {disasterScope === 'INTERNAL' ? 'Or click on the map' : 'Click on the map'} to set incident location
                      </Typography>
                      {(form.locationLat !== 0 || form.locationLng !== 0) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          startIcon={<FontAwesomeIcon icon={faTimes} />}
                          onClick={handleClearLocation}
                          disabled={loading}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                    <DisasterMapPicker
                      lat={form.locationLat ?? 0}
                      lng={form.locationLng ?? 0}
                      onChange={handleMapLocationChange}
                      height={220}
                      disabled={loading}
                    />
                    {geocoding && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Fetching address…
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    {form.incidentType === 'RTA_MCI' && (
                      <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          START triage — assign ambulance to category
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 0.5 }}>
                            Est: R:{form.estimatedRed ?? 0} Y:{form.estimatedYellow ?? 0} G:{form.estimatedGreen ?? 0} B:{form.estimatedBlack ?? 0}
                          </Typography>
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Assign to category</InputLabel>
                            <Select
                              value={selectedTriageCategory}
                              label="Assign to category"
                              onChange={(e) => setSelectedTriageCategory(e.target.value as 'RED' | 'YELLOW' | 'GREEN' | 'BLACK')}
                            >
                              <MenuItem value="RED">RED (Immediate)</MenuItem>
                              <MenuItem value="YELLOW">YELLOW (Delayed)</MenuItem>
                              <MenuItem value="GREEN">GREEN (Minor)</MenuItem>
                              <MenuItem value="BLACK">BLACK (Deceased)</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    )}
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FontAwesomeIcon icon={faAmbulance} /> All ambulances — click a marker to assign
                    </Typography>
                    {assignedAmbulances.length > 0 && (
                      <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {form.incidentType === 'RTA_MCI' ? (
                          ['RED', 'YELLOW', 'GREEN', 'BLACK'].map((cat) => {
                            const list = assignedAmbulances.filter((a) => a.triageCategory === cat || (!a.triageCategory && cat === 'RED'));
                            if (list.length === 0) return null;
                            return (
                              <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 80 }}>{cat}:</Typography>
                                {list.map((a) => (
                                  <Typography key={a.id} variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                                    {a.callSign || a.id.slice(0, 8)} ✓
                                  </Typography>
                                ))}
                              </Box>
                            );
                          })
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {assignedAmbulances.map((a) => (
                              <Typography key={a.id} variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                                {a.callSign || a.id.slice(0, 8)} ✓
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                    <LiveAmbulanceMap
                      height={Math.min(500, typeof window !== 'undefined' ? window.innerHeight - 320 : 450)}
                      defaultCenter={
                        form.locationLat != null && form.locationLng != null
                          ? [form.locationLat, form.locationLng]
                          : undefined
                      }
                      defaultZoom={12}
                      showControls={true}
                      showFilters={false}
                      disasterIncidents={
                        createdIncidentId && form.locationLat != null && form.locationLng != null
                          ? [
                              {
                                id: createdIncidentId,
                                incidentType: form.incidentType!,
                                colorCode: form.colorCode as any,
                                status: 'ACTIVE',
                                locationLat: form.locationLat,
                                locationLng: form.locationLng,
                                createdAt: new Date().toISOString(),
                              },
                            ]
                          : []
                      }
                      selectedIncidentId={createdIncidentId}
                      onAssignAmbulanceToDisaster={
                        createdIncidentId
                          ? (incidentId, ambulanceId, ambulance, triageCategory) =>
                              handleAssignAmbulance(incidentId, ambulanceId, ambulance, triageCategory)
                          : undefined
                      }
                      assigningAmbulanceId={assigningId}
                      selectedTriageCategory={form.incidentType === 'RTA_MCI' ? selectedTriageCategory : null}
                    />
                  </>
                )}
              </Grid>

              {!createdIncidentId && (
              <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Paste Google Maps link (e.g. maps.app.goo.gl/...)"
                    value={pasteLinkUrl}
                    onChange={(e) => setPasteLinkUrl(e.target.value)}
                    onPaste={(e) => {
                      const text = e.clipboardData?.getData('text') || '';
                      if (/maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps/i.test(text)) {
                        setPasteLinkUrl(text.trim());
                      }
                    }}
                    disabled={loading || pasteLinkLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FontAwesomeIcon icon={faLink} style={{ color: '#666', fontSize: 14 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handlePasteLink}
                    disabled={!pasteLinkUrl.trim() || loading || pasteLinkLoading}
                    sx={{ minWidth: 80 }}
                  >
                    {pasteLinkLoading ? <CircularProgress size={20} /> : 'Apply'}
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                  onClick={handleGetLocation}
                  disabled={loading}
                  fullWidth
                >
                  Use GPS Location
                </Button>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={form.locationLat || ''}
                  onChange={(e) => setForm((f) => ({ ...f, locationLat: parseFloat(e.target.value) || 0 }))}
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={form.locationLng || ''}
                  onChange={(e) => setForm((f) => ({ ...f, locationLng: parseFloat(e.target.value) || 0 }))}
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.locationAddress || ''}
                  onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
                />
              </Grid>

              {form.incidentType === 'RTA_MCI' && (
                <>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Green (Minor)"
                      type="number"
                      value={form.estimatedGreen ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimatedGreen: parseInt(e.target.value, 10) || 0 }))
                      }
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(76, 175, 80, 0.08)',
                          '& fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                          '&:hover fieldset': { borderColor: '#4caf50' },
                          '&.Mui-focused fieldset': { borderColor: '#4caf50', borderWidth: 2 },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Yellow (Delayed)"
                      type="number"
                      value={form.estimatedYellow ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimatedYellow: parseInt(e.target.value, 10) || 0 }))
                      }
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 193, 7, 0.12)',
                          '& fieldset': { borderColor: 'rgba(255, 193, 7, 0.6)' },
                          '&:hover fieldset': { borderColor: '#ffc107' },
                          '&.Mui-focused fieldset': { borderColor: '#ffc107', borderWidth: 2 },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Red (Immediate)"
                      type="number"
                      value={form.estimatedRed ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimatedRed: parseInt(e.target.value, 10) || 0 }))
                      }
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(244, 67, 54, 0.08)',
                          '& fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                          '&:hover fieldset': { borderColor: '#f44336' },
                          '&.Mui-focused fieldset': { borderColor: '#f44336', borderWidth: 2 },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Black (Deceased)"
                      type="number"
                      value={form.estimatedBlack ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimatedBlack: parseInt(e.target.value, 10) || 0 }))
                      }
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(33, 33, 33, 0.06)',
                          '& fieldset': { borderColor: 'rgba(66, 66, 66, 0.5)' },
                          '&:hover fieldset': { borderColor: '#424242' },
                          '&.Mui-focused fieldset': { borderColor: '#212121', borderWidth: 2 },
                        },
                      }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Grid>
              </>
              )}

            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            {!createdIncidentId ? (
              <Button type="submit" variant="contained" color="error" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Create Incident'}
              </Button>
            ) : (
              <Button onClick={handleClose} variant="contained">
                Done
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
  );
};

export default DisasterIncidentForm;
