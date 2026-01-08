import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { userRegistrationService, Hospital } from '../../services/userRegistrationService';

interface UserRegistrationFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  requestedRole: string;
  hospitalId: string;
  justification: string;
}

const UserRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserRegistrationFormData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    requestedRole: '',
    hospitalId: '',
    justification: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  const userRoles = [
    { value: 'ADMIN', label: 'Administrator', description: 'System Administrator with full access' },
    { value: 'RCC', label: 'RCC Coordinator', description: 'Regional Care Coordinator' },
    { value: 'EMS', label: 'EMS Operator', description: 'Emergency Medical Services' },
    { value: 'DATA_COLLECTOR', label: 'Data Collector', description: 'Clinical Data Entry' },
    { value: 'CATH_LAB_USER', label: 'Cath Lab User', description: 'Cardiac Catheterization Lab' },
    { value: 'HOSPITAL_USER', label: 'Hospital User', description: 'Hospital-specific access and management' },
    { value: 'ED_NURSE', label: 'ED Nurse', description: 'Emergency Department Nurse' },
    { value: 'UNIT_NURSE', label: 'Unit Nurse', description: 'Unit/Floor Nurse' },
    { value: 'BED_COORDINATOR', label: 'Bed Coordinator', description: 'Bed Management Coordinator' },
  ];

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsData = await userRegistrationService.getHospitals();
        setHospitals(hospitalsData);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleInputChange = (field: keyof UserRegistrationFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password || !formData.requestedRole || !formData.hospitalId) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.phoneNumber && formData.phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!formData.hospitalId || formData.hospitalId.trim() === '') {
      setError('Hospital is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await userRegistrationService.createRegistrationRequest({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        requestedRole: formData.requestedRole as any,
        hospitalId: formData.hospitalId || undefined,
        justification: formData.justification || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit registration request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Helmet>
          <title>Registration Submitted - RCC Healthcare Platform</title>
        </Helmet>
        
        <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Chip 
                label="✓" 
                color="success" 
                sx={{ fontSize: '2rem', height: 60, width: 60 }}
              />
            </Box>
            
            <Typography variant="h5" component="h1" gutterBottom color="success.main">
              Registration Request Submitted
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your registration request has been submitted successfully. An administrator will review your request and contact you within 1-2 business days.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Once approved, you will be able to login immediately with the password you provided. You will receive an email notification once your request has been processed.
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              fullWidth
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Helmet>
        <title>User Registration - RCC Healthcare Platform</title>
      </Helmet>
      
      <Card sx={{ maxWidth: 800, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Request Access
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Submit a registration request to gain access to the RCC Healthcare Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={loading}
                  helperText="This will be your login email"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  disabled={loading}
                  placeholder="+966 50 000 0000"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={loading}
                  helperText="Minimum 8 characters"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  disabled={loading}
                  helperText="Must match the password above"
                />
              </Grid>

              {/* Role Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Role Request
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControl required fullWidth>
                  <InputLabel>Requested Role</InputLabel>
                  <Select
                    value={formData.requestedRole}
                    onChange={handleInputChange('requestedRole')}
                    disabled={loading}
                  >
                    {userRoles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box>
                          <Typography variant="body1">{role.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Hospital Assignment */}
              <Grid item xs={12}>
                <FormControl required fullWidth>
                  <InputLabel>Hospital</InputLabel>
                  <Select
                    value={formData.hospitalId}
                    onChange={handleInputChange('hospitalId')}
                    disabled={loading || hospitalsLoading}
                    label="Hospital"
                  >
                    <MenuItem value="">
                      <em>Select a hospital</em>
                    </MenuItem>
                    {hospitals.map((hospital) => (
                      <MenuItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Select your hospital
                  </Typography>
                </FormControl>
              </Grid>

              {/* Justification */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Justification (Optional)"
                  value={formData.justification}
                  onChange={handleInputChange('justification')}
                  disabled={loading}
                  placeholder="Please explain why you need access to the RCC Healthcare Platform..."
                  helperText="Help administrators understand your need for access"
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Registration Request'}
                </Button>
              </Grid>

              {/* Login Link */}
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Button 
                      variant="text" 
                      onClick={() => navigate('/login')}
                      sx={{ textTransform: 'none' }}
                    >
                      Sign in here
                    </Button>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserRegistrationPage;
