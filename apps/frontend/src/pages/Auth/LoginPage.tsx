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
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
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
      
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: { xs: 2, sm: 3, md: 4 }, 
            width: '100%',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Left Logo - Hidden on mobile */}
            <Box sx={{ 
              flex: 1, 
              display: { xs: 'none', md: 'flex' }, 
              justifyContent: 'center' 
            }}>
              <img 
                src="/jazan-health-cluster-logo.png" 
                alt="Jazan Health Cluster Logo" 
                style={{ 
                  height: '60px', 
                  objectFit: 'contain',
                  opacity: 0.7
                }} 
              />
            </Box>

            {/* Login Card */}
            <Card sx={{ maxWidth: 480, width: '100%', flex: { xs: '1', md: '0 0 480px' } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <img 
                    src="/jazan-health-cluster-logo.png" 
                    alt="Jazan Health Cluster Logo" 
                    style={{ 
                      height: '40px', 
                      marginBottom: '16px',
                      objectFit: 'contain'
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

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?{' '}
                      <Link 
                        component={RouterLink} 
                        to="/register"
                        sx={{ 
                          textDecoration: 'none',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Request Access
                      </Link>
                    </Typography>
                  </Box>
                </form>
              </CardContent>
            </Card>

            {/* Right Logo - Hidden on mobile */}
            <Box sx={{ 
              flex: 1, 
              display: { xs: 'none', md: 'flex' }, 
              justifyContent: 'center' 
            }}>
              <img 
                src="/jazan-health-cluster-logo.png" 
                alt="Jazan Health Cluster Logo" 
                style={{ 
                  height: '60px', 
                  objectFit: 'contain',
                  opacity: 0.7
                }} 
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default LoginPage;