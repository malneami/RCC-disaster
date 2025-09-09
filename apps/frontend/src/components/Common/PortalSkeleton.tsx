import React, { ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Settings,
} from '@mui/icons-material';

export interface PortalStep {
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface KPICard {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export interface PortalSkeletonProps {
  title: string;
  subtitle?: string;
  portalType: 'stroke' | 'trauma' | 'stemi' | 'patients';
  steps: PortalStep[];
  activeStep: number;
  children: ReactNode;
  onBack?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  showSteps?: boolean;
  headerActions?: ReactNode;
  kpiCards?: KPICard[];
}

export const PortalSkeleton: React.FC<PortalSkeletonProps> = ({
  title,
  subtitle,
  portalType,
  steps,
  activeStep,
  children,
  onBack,
  onRefresh,
  onSettings,
  showSteps = true,
  headerActions,
  kpiCards = [],
}) => {
  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2'; // Blue
      case 'trauma': return '#d32f2f'; // Red
      case 'stemi': return '#388e3c'; // Green
      case 'patients': return '#7b1fa2'; // Purple
      default: return '#1976d2';
    }
  };

  const getPortalIcon = () => {
    switch (portalType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      case 'patients': return '👥';
      default: return '🏥';
    }
  };

  const getPortalGradient = () => {
    switch (portalType) {
      case 'stroke': 
        return 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)';
      case 'trauma': 
        return 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)';
      case 'stemi': 
        return 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)';
      case 'patients': 
        return 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)';
      default: 
        return 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box
        sx={{
          background: getPortalGradient(),
          color: 'white',
          py: 2,
          mb: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {onBack && (
                <IconButton
                  onClick={onBack}
                  sx={{ color: 'white', mr: 0.5 }}
                  size="medium"
                >
                  <ArrowBack />
                </IconButton>
              )}
              
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {getPortalIcon()} {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
              
              <Chip
                label={portalType.toUpperCase()}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  px: 1.5,
                  py: 0.5,
                  height: 'auto',
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {headerActions}
              
              {onRefresh && (
                <Tooltip title="Refresh Data">
                  <IconButton
                    onClick={onRefresh}
                    sx={{ color: 'white' }}
                    size="large"
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}
              
              {onSettings && (
                <Tooltip title="Portal Settings">
                  <IconButton
                    onClick={onSettings}
                    sx={{ color: 'white' }}
                    size="large"
                  >
                    <Settings />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: 2 }}>
        {/* Progress Steps */}
        {showSteps && steps.length > 0 && (
          <Paper sx={{ p: 2, mb: 2, borderRadius: 1 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed || active 
                            ? getPortalColor() 
                            : '#e0e0e0',
                          color: completed || active ? 'white' : '#666',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          boxShadow: completed || active ? 1 : 0,
                        }}
                      >
                        {step.icon || (index + 1)}
                      </Box>
                    )}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                        {step.label}
                      </Typography>
                      {step.description && (
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        )}

        {/* KPI Cards */}
        {kpiCards.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {kpiCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1, color: card.color, fontSize: 20 }}>
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {card.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {card.title}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Main Content - Full Width */}
      <Box sx={{ width: '100%' }}>
        {children}
      </Box>

      <Container maxWidth="xl" sx={{ px: 2 }}>

        {/* Footer */}
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {portalType.toUpperCase()} Portal • Regional Coordination Center
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PortalSkeleton;
