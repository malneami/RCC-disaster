import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

export interface TimeMetric {
  label: string;
  value: string | number;
  target: string;
  unit: string;
  met: boolean;
  percentage?: number;
}

export interface PerformanceIndicator {
  label: string;
  met: boolean;
  color?: 'success' | 'warning' | 'error' | 'info';
}

export interface CaseAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  disabled?: boolean;
}

export interface PatientInfo {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  id: string;
  nationalId?: string;
  mrn?: string;
  admissionDate: string;
  originHospital?: string;
  destinationHospital?: string;
}

export interface CaseDetails {
  [key: string]: any;
}

export interface UnifiedCaseCardProps {
  // Patient Information
  patient: PatientInfo;

  // Case Information
  caseId: string;
  caseType: 'stroke' | 'trauma' | 'stemi';
  status: string;
  severity?: string;
  pathway?: string;

  // Performance Overview
  targetsMet?: string; // e.g., "3/3", "0/1"
  overallScore?: string; // e.g., "100%", "33%"
  performanceIndicators?: PerformanceIndicator[];

  // Critical Time Metrics
  timeMetrics?: TimeMetric[];

  // Data Completeness
  dataCompleteness?: {
    percentage: number;
    completed: number;
    total: number;
  };
  dataCompletenessTooltip?: string;

  // Case-specific details
  caseDetails?: CaseDetails;

  // Actions
  actions: CaseAction[];

  // Expandable content
  expandableContent?: React.ReactNode;

  // Styling
  variant?: 'default' | 'compact';
  elevation?: number;
}

const UnifiedCaseCard: React.FC<UnifiedCaseCardProps> = ({
  patient,
  caseType,
  status,
  severity: _severity,
  pathway: _pathway,
  targetsMet,
  overallScore,
  performanceIndicators = [],
  timeMetrics = [],
  dataCompleteness,
  dataCompletenessTooltip,
  caseDetails = {},
  actions,
  expandableContent,
  elevation = 1,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: CaseAction) => {
    action.onClick();
    handleMenuClose();
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      // Get all elements and inline their computed styles for html2canvas compatibility
      const element = cardRef.current;

      // Force a reflow to ensure all styles are computed
      element.offsetHeight;

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        onclone: (clonedDoc: Document) => {
          // Find all MUI Chips in the cloned document and ensure they render properly
          const chips = clonedDoc.querySelectorAll('.MuiChip-root');
          chips.forEach((chip: Element) => {
            const htmlChip = chip as HTMLElement;
            const originalChip = cardRef.current?.querySelector(`.MuiChip-root[class="${chip.className}"]`) || chip;
            const computedStyle = window.getComputedStyle(originalChip);

            // Inline critical styles for the chip container
            htmlChip.style.display = 'inline-flex';
            htmlChip.style.alignItems = 'center';
            htmlChip.style.justifyContent = 'center';
            htmlChip.style.backgroundColor = computedStyle.backgroundColor;
            htmlChip.style.color = computedStyle.color;
            htmlChip.style.borderRadius = computedStyle.borderRadius;
            htmlChip.style.padding = computedStyle.padding || '0 8px';
            htmlChip.style.fontSize = computedStyle.fontSize;
            htmlChip.style.fontWeight = computedStyle.fontWeight;
            htmlChip.style.height = computedStyle.height;

            // Style the chip label span explicitly
            const chipLabel = htmlChip.querySelector('.MuiChip-label');
            if (chipLabel) {
              const labelEl = chipLabel as HTMLElement;
              labelEl.style.color = computedStyle.color;
              labelEl.style.fontSize = computedStyle.fontSize;
              labelEl.style.fontWeight = computedStyle.fontWeight;
              labelEl.style.visibility = 'visible';
              labelEl.style.opacity = '1';
              labelEl.style.display = 'block';
            }
          });

          // Ensure all text is visible
          const allText = clonedDoc.querySelectorAll('p, span, div');
          allText.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              htmlEl.style.visibility = 'visible';
              htmlEl.style.opacity = '1';
            }
          });
        },
      } as any);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${patient.name.replace(/\s+/g, '_')}_${caseType}_case.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading card as PNG:', error);
      alert('Failed to download PNG. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getCaseTypeIcon = () => {
    switch (caseType) {
      case 'stroke':
        return '🧠';
      case 'trauma':
        return '⚠️';
      case 'stemi':
        return '❤️';
      default:
        return '📋';
    }
  };

  const getCaseTypeColor = () => {
    switch (caseType) {
      case 'stroke':
        return '#1976d2';
      case 'trauma':
        return '#d32f2f';
      case 'stemi':
        return '#d32f2f';
      default:
        return '#666';
    }
  };

  // Bind status to a data- attribute to avoid unused warning while preserving API
  const dataStatus = status;

  const formatTimeValue = (value: string | number, unit: string) => {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (value < 0) return `${Math.abs(value)}${unit}`;
      return `${value}${unit}`;
    }
    return value;
  };

  const getTimeMetricColor = (met: boolean, percentage?: number) => {
    if (!met) return 'error';
    if (percentage !== undefined && percentage < 0) return 'success'; // Ahead of target
    return 'success';
  };

  const formatPatientName = (name: string) => {
    return name; // Return full name without truncation
  };

  return (
    <Card
      ref={cardRef}
      data-status={dataStatus}
      elevation={elevation}
      sx={{
        mb: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 2,
        border: `1px solid ${getCaseTypeColor()}20`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        '&:hover': {
          elevation: 8,
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${getCaseTypeColor()}30`,
          border: `1px solid ${getCaseTypeColor()}40`,
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box
          mb={2}
          sx={{
            background: `linear-gradient(135deg, ${getCaseTypeColor()}10 0%, ${getCaseTypeColor()}05 100%)`,
            borderRadius: 1,
            p: 1.5,
            border: `1px solid ${getCaseTypeColor()}15`,
          }}
        >
          {/* Name Row - Full Width with Menu Button */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getCaseTypeColor()} 0%, ${getCaseTypeColor()}CC 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'white',
                boxShadow: `0 2px 8px ${getCaseTypeColor()}40`,
                flexShrink: 0,
              }}
            >
              {getCaseTypeIcon()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                }}
              >
                {formatPatientName(patient.name)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  fontWeight: 500,
                }}
              >
                {patient.age}Y {patient.gender.toLowerCase()} • {format(new Date(patient.admissionDate), 'MMM dd, HH:mm')}
              </Typography>
            </Box>
            {actions.length > 0 && (
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  color: 'text.secondary',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Performance Overview */}
        {(targetsMet || overallScore || performanceIndicators.length > 0) && (
          <Box mb={2}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Performance Overview
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              {targetsMet && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                    Targets Met:
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    {targetsMet.split('/')[0].split('').map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: index < parseInt(targetsMet.split('/')[0]) ? 'success.main' : 'error.main',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Patient Details */}
        <Box mb={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                Origin Hospital: {patient.originHospital || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                Destination Hospital: {patient.destinationHospital || 'N/A'}
              </Typography>
            </Grid>
            {patient.nationalId && (
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                  National ID: {patient.nationalId}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Critical Time Metrics */}
        {timeMetrics.length > 0 && (
          <Box mb={2}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Critical Time Metrics
            </Typography>
            {timeMetrics.map((metric, index) => (
              <Box key={index} mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                    {metric.label}:
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body2"
                      color={getTimeMetricColor(metric.met, metric.percentage)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatTimeValue(metric.value, metric.unit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {metric.target}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.percentage ? Math.min(Math.abs(metric.percentage), 100) : 0}
                  color={getTimeMetricColor(metric.met, metric.percentage)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                {/* <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {metric.met ? '✓ Target Met' : '✗ Target Missed'}
                  </Typography>
                  {metric.percentage !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.abs(metric.percentage)}% of target
                    </Typography>
                  )}
                </Box>*/}
              </Box>
            ))}
          </Box>
        )}

        {/* Data Completeness */}
        {dataCompleteness && (
          <Tooltip
            title={dataCompletenessTooltip || ''}
            arrow
            placement="top"
            enterDelay={500}
          >
            <Box mb={2}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  color: '#1e293b',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Data Completeness
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <LinearProgress
                  variant="determinate"
                  value={dataCompleteness.percentage}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={dataCompleteness.percentage >= 90 ? 'success' : dataCompleteness.percentage >= 70 ? 'warning' : 'error'}
                />
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                  {dataCompleteness.completed} of {dataCompleteness.total} fields completed
                </Typography>
                {dataCompleteness.percentage >= 90 ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </Box>
            </Box>
          </Tooltip>
        )}

        {/* Case Details */}
        {Object.keys(caseDetails).length > 0 && (
          <Box mb={5}>
            <Grid container spacing={2}>
              {Object.entries(caseDetails).map(([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value || 'N/A'}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          },
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            sx={{
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: action.color === 'error' ? 'error.light' : 'primary.light',
                color: action.color === 'error' ? 'error.contrastText' : 'primary.contrastText',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText
              primary={action.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Expandable Content */}
      {expandableContent && (
        <>
          <Divider />
          <Box
            display="flex"
            justifyContent="center"
            gap={1}
            py={1}
            sx={{
              position: expanded ? 'relative' : 'absolute',
              bottom: expanded ? 'auto' : 0,
              left: 0,
              right: 0,
              backgroundColor: expanded ? 'transparent' : 'background.paper',
              borderTop: expanded ? 'none' : '1px solid',
              borderColor: 'divider',
              borderRadius: expanded ? 0 : '0 0 8px 8px',
              zIndex: 1,
            }}
          >
            <Button
              size="small"
              onClick={handleDownloadPNG}
              startIcon={<DownloadIcon />}
              disabled={isDownloading}
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1,
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download PNG'}
            </Button>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1,
              }}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </Box>
          <Collapse in={expanded}>
            <CardContent sx={{ pt: 0 }}>
              {expandableContent}
            </CardContent>
          </Collapse>
        </>
      )}
    </Card>
  );
};

export default UnifiedCaseCard;
