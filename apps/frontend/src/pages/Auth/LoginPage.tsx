import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet-async';

import { useAuth } from '../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(data.email, data.password);
      enqueueSnackbar('Login successful', { variant: 'success' });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - RCC Healthcare Platform</title>
      </Helmet>
      
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Card sx={{ maxWidth: 480, mx: 'auto', width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <FontAwesomeIcon 
                  icon={faHospital}
                  style={{
                    fontSize: '48px',
                    color: '#1976d2',
                    marginBottom: '16px',
                  }}
                />
                <Typography variant="h4" component="h1" gutterBottom>
                  RCC Healthcare
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Regional Coordination Center Platform
                </Typography>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isSubmitting}
                  autoComplete="email"
                />

                <TextField
                  {...register('password')}
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Development Login Credentials:</strong><br />
                    Admin: admin@rcc-healthcare.com<br />
                    RCC: coordinator@rcc-healthcare.com<br />
                    EMS: ems@rcc-healthcare.com<br />
                    Data Collector: datacollector@rcc-healthcare.com<br />
                    Cath Lab: cathlab@rcc-healthcare.com<br />
                    Password: Healthcare@2024
                  </Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default LoginPage;