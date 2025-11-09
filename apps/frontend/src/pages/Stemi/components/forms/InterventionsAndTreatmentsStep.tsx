import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
} from '@mui/material';
import { InterventionsAndTreatments } from '../../services/stemiService';
import { StemiDatetimeService } from '../../services/stemiDatetimeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';

interface InterventionsAndTreatmentsStepProps {
  data: InterventionsAndTreatments;
  onChange: (data: InterventionsAndTreatments) => void;
  timelineWarnings?: Record<string, string[]>;
}

const InterventionsAndTreatmentsStep: React.FC<InterventionsAndTreatmentsStepProps> = ({
  data,
  onChange,
  timelineWarnings = {},
}) => {
  const [hospitalsWithStemi, setHospitalsWithStemi] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  // Fetch hospitals with STEMI service
  useEffect(() => {
    const fetchHospitalsWithStemi = async () => {
      setLoadingHospitals(true);
      try {
        const hospitals = await hospitalService.getAllHospitals({
          hasStemiService: true,
        });
        setHospitalsWithStemi(hospitals);
      } catch (error) {
        console.error('Error fetching hospitals with STEMI service:', error);
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitalsWithStemi();
  }, []);

  const handleChange = (field: keyof InterventionsAndTreatments) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...data, [field]: value });
  };

  const emphasizeKeywords = (text: string) => {
    const keywords = ['Door', 'Balloon', 'PCI', 'ECG', 'Thrombolytic', 'Admission', 'Triage'];
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isKeyword = keywords.some(
        (keyword) => keyword.toLowerCase() === part.toLowerCase()
      );

      return isKeyword ? (
        <Box key={`${part}-${index}`} component="span" sx={{ fontWeight: 700 }}>
          {part}
        </Box>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      );
    });
  };

  const buildHelperText = (defaultText: string, warnings?: string[]) => {
    if (!warnings || warnings.length === 0) {
      return defaultText;
    }

    return (
      <Box>
        <Typography variant="caption" color="textSecondary" display="block">
          {defaultText}
        </Typography>
        {warnings.map((warning, index) => (
          <Typography
            key={`${warning}-${index}`}
            variant="body2"
            color="warning.main"
            display="block"
            sx={{ mt: 1, fontWeight: 600 }}
          >
            {emphasizeKeywords(warning)}
          </Typography>
        ))}
      </Box>
    );
  };

  const warningBorderStyles = (warnings?: string[]) =>
    warnings && warnings.length > 0
      ? {
          '& .MuiOutlinedInput-root fieldset': {
            borderColor: 'warning.main',
            borderWidth: 2,
          },
          '& .MuiOutlinedInput-root:hover fieldset': {
            borderColor: 'warning.main',
          },
          '& .MuiOutlinedInput-root.Mui-focused fieldset': {
            borderColor: 'warning.dark',
          },
        }
      : undefined;

  const doorOutWarnings = timelineWarnings['interventionsAndTreatments.doorOutTime'];
  const balloonWarnings = timelineWarnings['interventionsAndTreatments.balloonInflationTime'];
  const thrombolyticWarnings = timelineWarnings['interventionsAndTreatments.thrombolyticAdminTime'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Interventions and Treatments
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Record the interventions and treatments for this STEMI case.
      </Typography>

      <Grid container spacing={3}>
        {/* Primary PCI Eligibility */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={data.eligibleForPrimaryPci || false}
                onChange={handleChange('eligibleForPrimaryPci')}
              />
            }
            label="Eligible for Primary PCI"
          />
          <Typography variant="caption" display="block" color="textSecondary">
            Is the patient eligible for primary PCI intervention?
          </Typography>
        </Grid>

        {/* PCI Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Type of PCI</InputLabel>
            <Select
              value={data.pciType || ''}
              onChange={handleChange('pciType')}
              label="Type of PCI"
            >
              <MenuItem value="">Select PCI Type</MenuItem>
              <MenuItem value="PRIMARY">Primary</MenuItem>
              <MenuItem value="NON_PRIMARY">Non Primary</MenuItem>
              <MenuItem value="RESCUE_PCI">Rescue PCI</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Type of PCI procedure performed or planned
          </Typography>
        </Grid>

        {/* PCI Location */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>PCI Location</InputLabel>
            <Select
              value={data.pciLocation || ''}
              onChange={handleChange('pciLocation')}
              label="PCI Location"
              disabled={loadingHospitals}
            >
              <MenuItem value="">Select PCI Location</MenuItem>
              {loadingHospitals ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    Loading hospitals...
                  </Box>
                </MenuItem>
              ) : (
                hospitalsWithStemi.map((hospital) => (
                  <MenuItem key={hospital.id} value={hospital.name}>
                    {hospital.name}
                  </MenuItem>
                ))
              )}
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Where the PCI was or will be performed
          </Typography>
        </Grid>

        {/* Door Out Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Door Out Time"
            type="datetime-local"
            value={data.doorOutTime || ''}
            onChange={handleChange('doorOutTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.eligibleForPrimaryPci}
            helperText={buildHelperText('When the patient left the referring facility for PCI', doorOutWarnings)}
            sx={warningBorderStyles(doorOutWarnings)}
          />
        </Grid>

        {/* Balloon Inflation Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Balloon Inflation Time"
            type="datetime-local"
            value={data.balloonInflationTime || ''}
            onChange={handleChange('balloonInflationTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.eligibleForPrimaryPci}
            helperText={buildHelperText('When the balloon was inflated during the PCI procedure', balloonWarnings)}
            sx={warningBorderStyles(balloonWarnings)}
          />
        </Grid>

        {/* Thrombolytic Given */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={data.thrombolyticGiven || false}
                onChange={handleChange('thrombolyticGiven')}
              />
            }
            label="Thrombolytic Given"
          />
          <Typography variant="caption" display="block" color="textSecondary">
            Was thrombolytic therapy administered?
          </Typography>
        </Grid>

        {/* Thrombolytic Administration Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Thrombolytic Administration Time"
            type="datetime-local"
            value={data.thrombolyticAdminTime || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('thrombolyticAdminTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.thrombolyticGiven}
            helperText={buildHelperText('When the thrombolytic medication was administered', thrombolyticWarnings)}
            sx={warningBorderStyles(thrombolyticWarnings)}
          />
        </Grid>

        {/* Fibrinolytic Absolute Contraindications */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Reason fibrinolytic therapy not given if no primary PCI offered - Absolute Contraindications</InputLabel>
            <Select
              value={data.fibrinolyticAbsoluteContraindications || ''}
              onChange={handleChange('fibrinolyticAbsoluteContraindications')}
              label="Reason fibrinolytic therapy not given if no primary PCI offered - Absolute Contraindications"
            >
              <MenuItem value="">Select contraindication</MenuItem>
              <MenuItem value="ANY_PRIOR_INTRACRANIAL_HEMORRHAGE">Any Prior Intracranial hemorrhage</MenuItem>
              <MenuItem value="KNOWN_STRUCTURAL_CEREBRAL_VASCULAR_LESION">Known structural cerebral vascular lesion</MenuItem>
              <MenuItem value="KNOWN_MALIGNANT_INTRACRANIAL_NEOPLASM">Known malignant intracranial neoplasm (primary or metastatic)</MenuItem>
              <MenuItem value="ISCHEMIC_STROKE_WITHIN_3_MONTHS">Ischemic stroke within 3 months EXCEPT acute ischemic stroke within 3 hours</MenuItem>
              <MenuItem value="SUSPECTED_AORTIC_DISSECTION">Suspected aortic dissection</MenuItem>
              <MenuItem value="ACTIVE_BLEEDING_OR_BLEEDING_DIATHESIS">Active bleeding or bleeding diathesis (excluding menses)</MenuItem>
              <MenuItem value="SIGNIFICANT_CLOSED_HEAD_OR_FACIAL_TRAUMA">Significant closed-head or facial trauma within 3 months</MenuItem>
              <MenuItem value="OFFERED_THROMBOLYSIS_FROM_OTHER_HOSPITAL">Offered thrombolysis from other hospital</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Select the absolute contraindication for fibrinolytic therapy
          </Typography>
        </Grid>

        {/* Fibrinolytic Relative Contraindications */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Reason fibrinolytic therapy not given if no primary PCI offered - Relative Contraindications"
            multiline
            rows={3}
            value={data.fibrinolyticRelativeContraindications || ''}
            onChange={handleChange('fibrinolyticRelativeContraindications')}
            helperText="Describe any relative contraindications for fibrinolytic therapy"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InterventionsAndTreatmentsStep;
