import React from 'react';
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
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

interface DriverFormProps {
  open: boolean;
  editingDriver: any | null;
  formData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    status: 'ACTIVE' | 'INACTIVE';
    hospitalId: string;
  };
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (field: string, value: string) => void;
  hospitals: any[];
  loading?: boolean;
}

const DriverForm: React.FC<DriverFormProps> = ({
  open,
  editingDriver,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
  hospitals,
  loading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FontAwesomeIcon icon={faUser} />
        {editingDriver ? 'Edit Driver' : 'Add New Driver'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => onFormDataChange('firstName', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => onFormDataChange('lastName', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => onFormDataChange('phoneNumber', e.target.value)}
                required
                variant="outlined"
                placeholder="+966501234567"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => onFormDataChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={hospitals}
                getOptionLabel={(option) => option.name}
                value={hospitals.find(h => h.id === formData.hospitalId) || null}
                onChange={(_, newValue) => onFormDataChange('hospitalId', newValue?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Hospital"
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={onClose}
            startIcon={<FontAwesomeIcon icon={faTimes} />}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faSave} />}
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Create Driver')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DriverForm;

