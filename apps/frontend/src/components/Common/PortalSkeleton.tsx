import React, { ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Tooltip,
  alpha,
  Divider,
} from '@mui/material';
import {
  Refresh,
  Settings,
  Add,
  Favorite,
  People,
  LocalHospital,
  Psychology,
  Warning,
  Hotel,
  PregnantWoman,
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
  portalType: 'stroke' | 'trauma' | 'stemi' | 'ob' | 'disaster' | 'patients' | 'beds';
  steps: PortalStep[];
  activeStep: number;
  children: ReactNode;
  onBack?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  showSteps?: boolean;
  onCreateCase?: () => void;
  headerActions?: ReactNode;
  kpiCards?: KPICard[];
}

export const PortalSkeleton: React.FC<PortalSkeletonProps> = ({
  title,
  subtitle,
  portalType,
  kpiCards = [],
  onRefresh,
  onSettings,
  onCreateCase,
  headerActions,
  children,
}) => {
  // Get button text based on portal type
  const getCreateButtonText = () => {
    switch (portalType) {
      case 'stemi':
        return 'Create STEMI Case';
      case 'stroke':
        return 'Create Stroke Case';
      case 'trauma':
        return 'Create Trauma Case';
      case 'ob':
        return 'Create Transfer';
      case 'disaster':
        return 'Create Incident';
      case 'beds':
        return 'Add Bed';
      default:
        return 'Create Case';
    }
  };

  // Get portal-specific header background color (hospital dashboard style)
  const getHeaderBackground = () => {
    switch (portalType) {
      case 'stemi':
        return '#FFFFFF'; // Clean white
      case 'stroke':
        return '#FFFFFF'; // Clean white
      case 'trauma':
        return '#FFFFFF'; // Clean white
      case 'ob':
        return '#FFFFFF'; // Clean white
      case 'disaster':
        return '#FFFFFF'; // Clean white
      case 'beds':
        return '#FFFFFF'; // Clean white
      default:
        return '#FFFFFF';
    }
  };

  // Get portal accent color (medical professional colors)
  const getPortalAccentColor = () => {
    switch (portalType) {
      case 'stemi':
        return '#1976D2'; // Medical blue
      case 'stroke':
        return '#1976D2'; // Medical blue
      case 'trauma':
        return '#D32F2F'; // Medical red
      case 'ob':
        return '#9C27B0'; // OB purple
      case 'disaster':
        return '#D97706'; // Disaster amber
      case 'beds':
        return '#2E7D32'; // Medical green
      default:
        return '#1976D2';
    }
  };

  // Get text color for header (hospital dashboard style)
  const getHeaderTextColor = () => {
    return '#1A1A1A'; // Dark professional text
  };

  // Get subtitle color for header
  const getHeaderSubtitleColor = () => {
    return '#666666'; // Professional gray
  };

  // Get portal icon component based on portal type
  const getPortalIconComponent = () => {
    switch (portalType) {
      case 'stemi':
        return Favorite;
      case 'stroke':
        return Psychology;
      case 'trauma':
        return Warning;
      case 'ob':
        return PregnantWoman;
      case 'disaster':
        return Warning;
      case 'patients':
        return People;
      case 'beds':
        return Hotel;
      default:
        return LocalHospital;
    }
  };

  // Hospital dashboard card colors (professional, clean)
  const hospitalCardColors = [
    { bg: '#FFFFFF', border: '#E0E0E0', icon: '#1976D2' }, // White with blue accent
    { bg: '#FFFFFF', border: '#E0E0E0', icon: '#2E7D32' }, // White with green accent
    { bg: '#FFFFFF', border: '#E0E0E0', icon: '#D32F2F' }, // White with red accent
    { bg: '#FFFFFF', border: '#E0E0E0', icon: '#ED6C02' }, // White with orange accent
    { bg: '#FFFFFF', border: '#E0E0E0', icon: '#7B1FA2' }, // White with purple accent
  ];

  // Map KPI cards to hospital colors
  const getCardStyle = (index: number) => {
    const colorIndex = index % hospitalCardColors.length;
    return hospitalCardColors[colorIndex];
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* Hospital Dashboard Header */}
      <Container maxWidth="xl" sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            backgroundColor: getHeaderBackground(),
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            py: 1.5,
            px: 2,
          }}
        >
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: getPortalAccentColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    boxShadow: `0 2px 8px ${getPortalAccentColor()}40`,
                    color: '#FFFFFF',
                  }}
                >
                  {React.createElement(getPortalIconComponent(), { sx: { fontSize: '1.5rem' } })}
                </Box>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    color: getHeaderTextColor(),
                    letterSpacing: '0.02em',
                  }}
                >
                  {title || 'STEMI Portal'}
                </Typography>
              </Box>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    color: getHeaderSubtitleColor(),
                    fontWeight: 400,
                    ml: 6.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Create Case Button - Special Prominent Style */}
              {onCreateCase && (
                <Button
                  variant="contained"
                  startIcon={<Add sx={{ fontSize: '1.25rem' }} />}
                  onClick={onCreateCase}
                  sx={{
                    backgroundColor: '#FF8A4C',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    px: 3,
                    py: 1,
                    borderRadius: '6px',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: '#FF7A33',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                    },
                    '&:active': {
                      backgroundColor: '#E96A2C',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {getCreateButtonText()}
                </Button>
              )}

              {/* Additional header actions */}
              {headerActions && (
                <Box>
                  {headerActions}
                </Box>
              )}
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton
                    onClick={onRefresh}
                    size="medium"
                    sx={{
                      color: '#666666',
                      backgroundColor: '#F5F5F5',
                      border: '1px solid #E0E0E0',
                      '&:hover': {
                        backgroundColor: '#EEEEEE',
                        borderColor: getPortalAccentColor(),
                        color: getPortalAccentColor(),
                      },
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}
              {onSettings && (
                <Tooltip title="Settings">
                  <IconButton
                    onClick={onSettings}
                    size="medium"
                    sx={{
                      color: '#666666',
                      backgroundColor: '#F5F5F5',
                      border: '1px solid #E0E0E0',
                      '&:hover': {
                        backgroundColor: '#EEEEEE',
                        borderColor: getPortalAccentColor(),
                        color: getPortalAccentColor(),
                      },
                    }}
                  >
                    <Settings />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Divider between header and cards */}
          {kpiCards.length > 0 && (
            <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
          )}

          {/* KPI Cards - StatPill style from Hospitals page */}
          {kpiCards.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 2,
                mb: 0,
              }}
            >
              {kpiCards.map((card, index) => {
                const cardStyle = getCardStyle(index);
                const accentColor = card.color || cardStyle.icon;

                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 3,
                      backgroundColor: alpha(accentColor, 0.08),
                      border: `1px solid ${alpha(accentColor, 0.2)}`,
                      transition: 'all 0.2s ease',
                      cursor: 'default',
                      '&:hover': {
                        backgroundColor: alpha(accentColor, 0.12),
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center', '& svg': { fontSize: 18 } }}>
                      {card.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: accentColor, fontSize: '1rem', lineHeight: 1 }}>
                      {card.value}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1 }}>
                      {card.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Container>

      {/* Main Content - Hospital Dashboard Style */}
      <Container maxWidth="xl" sx={{ py: 1, px: 2 }}>
        {children && (
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E0E0E0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              p: 1.5,
            }}
          >
            {children}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PortalSkeleton;