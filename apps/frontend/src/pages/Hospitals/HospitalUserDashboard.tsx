import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Container,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { hospitalService, Hospital } from '../../services/hospitalService';
import { useAuth } from '../../contexts/AuthContext';

const HospitalUserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'HOSPITAL_USER') {
      navigate('/hospitals');
      return;
    }

    loadMyHospital();
  }, [user, navigate]);

  const loadMyHospital = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hospitalData = await hospitalService.getMyHospital();
      setHospital(hospitalData);
      
      // Automatically redirect to the hospital dashboard
      navigate(`/hospitals/${hospitalData.id}`);
    } catch (err: any) {
      console.error('Failed to load assigned hospital:', err);
      setError(err.message || 'Failed to load your assigned hospital');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 3 }}>
          <Helmet>
            <title>Loading Hospital Dashboard - RCC Healthcare</title>
          </Helmet>
          
          <Box display="flex" flexDirection="column" alignItems="center" gap={3} sx={{ py: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading your hospital dashboard...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch your assigned hospital information.
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 3 }}>
          <Helmet>
            <title>Hospital Access Error - RCC Healthcare</title>
          </Helmet>
          
          <Box display="flex" flexDirection="column" alignItems="center" gap={3} sx={{ py: 8 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="4x" color="#f44336" />
            
            <Typography variant="h5" color="error" textAlign="center">
              Hospital Access Error
            </Typography>
            
            <Alert severity="error" sx={{ maxWidth: 500, textAlign: 'center' }}>
              {error}
            </Alert>
            
            <Box display="flex" gap={2}>
              <Button variant="contained" onClick={loadMyHospital}>
                Try Again
              </Button>
              <Button variant="outlined" onClick={() => navigate('/profile')}>
                View Profile
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" textAlign="center">
              If this problem persists, please contact your system administrator.
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (hospital) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 3 }}>
          <Helmet>
            <title>{hospital.name} - Hospital Dashboard - RCC Healthcare</title>
          </Helmet>
          
          <Box display="flex" flexDirection="column" alignItems="center" gap={3} sx={{ py: 8 }}>
            <FontAwesomeIcon icon={faHospital} size="4x" color="#1976d2" />
            
            <Typography variant="h4" component="h1" textAlign="center">
              {hospital.name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {hospital.address || 'No address provided'}
            </Typography>
            
            <Alert severity="success" sx={{ maxWidth: 500, textAlign: 'center' }}>
              Successfully loaded your assigned hospital. Redirecting to dashboard...
            </Alert>
            
            <Button 
              variant="contained" 
              onClick={() => navigate(`/hospitals/${hospital.id}`)}
              sx={{ mt: 2 }}
            >
              Go to Hospital Dashboard
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return null;
};

export default HospitalUserDashboard;
