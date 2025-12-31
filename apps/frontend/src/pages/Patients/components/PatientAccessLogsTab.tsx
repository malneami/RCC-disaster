import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Warning,
  Download,
  Search,
  FilterList,
  GetApp,
  Refresh,
  Close,
  Person,
  Computer,
  CalendarToday,
  Email,
  Badge,
  Info,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { patientService, PatientAccessLog } from '@/services/patientService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Pagination from '@/components/Common/Pagination';

// Color scheme - vibrant but professional
const GRADIENT_COLORS = {
  view: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', // Vibrant blue
  create: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)', // Vibrant green
  update: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)', // Vibrant orange
  delete: 'linear-gradient(135deg, #ef5350 0%, #e57373 100%)', // Vibrant red
  export: 'linear-gradient(135deg, #26a69a 0%, #4db6ac 100%)', // Vibrant teal
  search: 'linear-gradient(135deg, #29b6f6 0%, #4fc3f7 100%)', // Vibrant cyan
  primary: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', // Primary blue
};

const getAccessTypeGradient = (accessType: string) => {
  switch (accessType) {
    case 'VIEW':
      return GRADIENT_COLORS.view;
    case 'CREATE':
      return GRADIENT_COLORS.create;
    case 'UPDATE':
      return GRADIENT_COLORS.update;
    case 'DELETE':
      return GRADIENT_COLORS.delete;
    case 'EXPORT':
      return GRADIENT_COLORS.export;
    case 'SEARCH':
      return GRADIENT_COLORS.search;
    default:
      return GRADIENT_COLORS.view;
  }
};

const getAccessTypeColor = (accessType: string) => {
  switch (accessType) {
    case 'VIEW':
      return '#42a5f5';
    case 'CREATE':
      return '#66bb6a';
    case 'UPDATE':
      return '#ffa726';
    case 'DELETE':
      return '#ef5350';
    case 'EXPORT':
      return '#26a69a';
    case 'SEARCH':
      return '#29b6f6';
    default:
      return '#42a5f5';
  }
};

const PatientAccessLogsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<PatientAccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PatientAccessLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const accessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        page,
        limit,
      };
      if (patientIdFilter) filters.patientId = patientIdFilter;
      if (userIdFilter) filters.userId = userIdFilter;
      if (accessTypeFilter) filters.accessType = accessTypeFilter;
      if (startDate) filters.startDate = startDate.toISOString().split('T')[0];
      if (endDate) filters.endDate = endDate.toISOString().split('T')[0];

      const response = await patientService.getAllAccessLogs(filters);
      setLogs(response?.data || []);
      setTotal(response?.total || 0);
      setTotalPages(response?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setPatientIdFilter('');
    setUserIdFilter('');
    setAccessTypeFilter('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Timestamp', 'User', 'Role', 'Patient', 'Access Type', 'Method', 'IP Address', 'Reason'];
      const rows = (logs || []).map((log) => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.user?.role || 'N/A',
        log.patient ? `${log.patient.firstName} ${log.patient.lastName}` : 'N/A',
        log.accessType,
        log.accessMethod,
        log.ipAddress || 'N/A',
        log.reason || 'N/A',
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    }
  };

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'VIEW':
        return <Visibility fontSize="small" />;
      case 'CREATE':
      case 'UPDATE':
        return <Edit fontSize="small" />;
      case 'DELETE':
        return <Warning fontSize="small" />;
      case 'EXPORT':
        return <Download fontSize="small" />;
      case 'SEARCH':
        return <Search fontSize="small" />;
      default:
        return <Visibility fontSize="small" />;
    }
  };

  const hasActiveFilters = patientIdFilter || userIdFilter || accessTypeFilter || startDate || endDate;

  if (loading && (!logs || logs.length === 0)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)',
          borderRadius: '16px',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={56}
            thickness={4}
            sx={{
              color: '#42a5f5',
              mb: 2.5,
            }}
          />
          <Box
            sx={{
              color: '#42a5f5',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Loading access logs...
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Fade in={true} timeout={400}>
        <Box sx={{ p: 2 }}>
          {/* Modern Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              mb: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(66, 165, 245, 0.25), 0 4px 8px rgba(0, 0, 0, 0.06)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  fontSize: '1.5rem',
                }}
              >
                Patient Access Logs
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                  variant="contained"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    background: showFilters ? GRADIENT_COLORS.primary : 'rgba(66, 165, 245, 0.12)',
                    color: showFilters ? '#ffffff' : '#42a5f5',
                    borderRadius: '12px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: showFilters ? '0 4px 12px rgba(66, 165, 245, 0.4)' : 'none',
                    '&:hover': {
                      background: GRADIENT_COLORS.primary,
                      color: '#ffffff',
                      boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Filters {hasActiveFilters && `(${[patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate].filter(Boolean).length})`}
              </Button>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleExport}
                  sx={{
                    background: GRADIENT_COLORS.export,
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(38, 166, 154, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1e9b8f 0%, #26a69a 100%)',
                      boxShadow: '0 6px 16px rgba(38, 166, 154, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Export
              </Button>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={loadLogs}
                  sx={{
                    background: GRADIENT_COLORS.primary,
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                      boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                Refresh
              </Button>
            </Box>
          </Box>

          {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                }}
                onClose={() => setError(null)}
              >
              {error}
            </Alert>
          )}

            {/* Modern Filters */}
          {showFilters && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: '1px solid rgba(66, 165, 245, 0.25)',
                }}
              >
                <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Patient ID"
                  value={patientIdFilter}
                  onChange={(e) => setPatientIdFilter(e.target.value)}
                  size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                            },
                          },
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                              borderWidth: '2px',
                            },
                          },
                        },
                      }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                            },
                          },
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                              borderWidth: '2px',
                            },
                          },
                        },
                      }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Access Type"
                  value={accessTypeFilter}
                  onChange={(e) => setAccessTypeFilter(e.target.value)}
                  size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                            },
                          },
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#42a5f5',
                              borderWidth: '2px',
                            },
                          },
                        },
                      }}
                >
                  <MenuItem value="">All</MenuItem>
                  {accessTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#42a5f5',
                                },
                              },
                              '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#42a5f5',
                                  borderWidth: '2px',
                                },
                              },
                            },
                          },
                        },
                      }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#42a5f5',
                                },
                              },
                              '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#42a5f5',
                                  borderWidth: '2px',
                                },
                              },
                            },
                          },
                        },
                      }}
                />
              </Grid>
              <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleResetFilters}
                      sx={{
                        background: GRADIENT_COLORS.primary,
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                          boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                        },
                      }}
                    >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
              </Box>
            )}

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: '#6ec6ff',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
            Total: {total} access logs
          </Typography>
          </Box>

          {/* Logs Display */}
          {!logs || logs.length === 0 ? (
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '60px 20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: GRADIENT_COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 6px 20px rgba(66, 165, 245, 0.4)',
                }}
              >
                <Info sx={{ fontSize: 48, color: '#ffffff' }} />
          </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#424242',
                  mb: 1.5,
                }}
              >
                  No Access Logs Found
                </Typography>
              <Typography
                sx={{
                  color: '#42a5f5',
                  fontSize: '0.9375rem',
                  maxWidth: '400px',
                  margin: '0 auto',
                  fontWeight: 500,
                }}
              >
                  There are no access logs matching your filters.
                </Typography>
              </Box>
        ) : (
          <>
              {/* Timeline-style Log Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {logs.map((log, index) => (
                  <Box
                    key={log.id}
                    sx={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                      border: '1px solid rgba(66, 165, 245, 0.3)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(66, 165, 245, 0.25), 0 4px 8px rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    {/* Timeline line */}
                    {index < logs.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '40px',
                          top: '60px',
                          bottom: '-16px',
                          width: '2px',
                          background: 'linear-gradient(180deg, rgba(66, 165, 245, 0.4) 0%, transparent 100%)',
                        }}
                      />
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background: getAccessTypeGradient(log.accessType),
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {log.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        {log.user?.lastName?.charAt(0)?.toUpperCase() || ''}
                      </Avatar>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1a237e',
                                  fontSize: '1rem',
                                }}
                              >
                                {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User'}
                            </Typography>
                        <Chip
                          label={log.accessType}
                          size="small"
                                icon={getAccessTypeIcon(log.accessType)}
                                sx={{
                                  background: getAccessTypeGradient(log.accessType),
                                  color: '#ffffff',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: '22px',
                                  boxShadow: `0 2px 8px ${getAccessTypeColor(log.accessType)}50`,
                                }}
                              />
                              {log.user && (
                                <Chip
                                  label={log.user.role}
                                  size="small"
                              sx={{
                                    background: 'rgba(66, 165, 245, 0.12)',
                                    color: '#42a5f5',
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    border: '1px solid rgba(66, 165, 245, 0.3)',
                                  }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday sx={{ fontSize: '14px', color: '#42a5f5' }} />
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem', ml: 0.5 }}>
                                  ({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              setDetailDialogOpen(true);
                            }}
                              sx={{
                            color: '#42a5f5',
                            background: 'rgba(66, 165, 245, 0.12)',
                            '&:hover': {
                              background: 'rgba(66, 165, 245, 0.25)',
                              transform: 'scale(1.1)',
                            },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        </Box>

                        {/* Patient Info */}
                        {log.patient && (
                          <Box
                            sx={{
                              background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                              borderRadius: '12px',
                              padding: '12px',
                              mb: 1.5,
                              border: '1px solid rgba(66, 165, 245, 0.3)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Person sx={{ fontSize: '16px', color: '#42a5f5' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a237e', fontSize: '0.875rem' }}>
                                {log.patient.firstName} {log.patient.lastName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', ml: 3 }}>
                              {log.patient.mrn && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Badge sx={{ fontSize: '12px', color: '#42a5f5' }} />
                                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                    MRN: {log.patient.mrn}
                                  </Typography>
                                </Box>
                              )}
                              {log.patient.nationalId && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Badge sx={{ fontSize: '12px', color: '#42a5f5' }} />
                                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                    ID: {log.patient.nationalId}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Additional Info */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                              {log.accessMethod}
                            </Typography>
                          </Box>
                          {log.ipAddress && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                {log.ipAddress}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Reason */}
                        {log.reason && (
                          <Box
                            sx={{
                              mt: 1.5,
                              pt: 1.5,
                              borderTop: '1px solid rgba(66, 165, 245, 0.2)',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                              Reason:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem', mt: 0.5 }}>
                              {log.reason}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

          {/* Modern Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            <Box
              sx={{
                background: GRADIENT_COLORS.primary,
                padding: '20px 24px',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    fontSize: '1.25rem',
                  }}
                >
                  Access Log Details
                  </Typography>
                <IconButton
                  onClick={() => setDetailDialogOpen(false)}
                  sx={{
                    color: '#ffffff',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              {selectedLog && (
                <Box>
                  {/* Header Section with Access Type */}
                  <Box
                    sx={{
                      background: getAccessTypeGradient(selectedLog.accessType),
                      borderRadius: '16px',
                      padding: '24px',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      boxShadow: `0 4px 16px ${getAccessTypeColor(selectedLog.accessType)}40`,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 72,
                        height: 72,
                        background: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '2rem',
                        fontWeight: 700,
                        border: '3px solid rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {getAccessTypeIcon(selectedLog.accessType)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Chip
                        label={selectedLog.accessType}
                        size="medium"
                        icon={getAccessTypeIcon(selectedLog.accessType)}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.3)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          height: '32px',
                          mb: 1,
                        }}
                      />
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.5 }}>
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                        {formatDistanceToNow(new Date(selectedLog.timestamp), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {/* User Information Card */}
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                          borderRadius: '16px',
                          padding: '20px',
                          border: '1px solid rgba(66, 165, 245, 0.25)',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(66, 165, 245, 0.2)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '10px',
                              background: GRADIENT_COLORS.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Person sx={{ color: '#ffffff', fontSize: '20px' }} />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: '#666',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            User Information
                          </Typography>
                        </Box>
                        {selectedLog.user ? (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar
                                sx={{
                                  width: 56,
                                  height: 56,
                                  background: GRADIENT_COLORS.primary,
                                  fontSize: '1.4rem',
                                  fontWeight: 700,
                                }}
                              >
                                {selectedLog.user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                {selectedLog.user.lastName?.charAt(0)?.toUpperCase() || ''}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5, fontSize: '1.125rem' }}>
                                  {selectedLog.user.firstName} {selectedLog.user.lastName}
                  </Typography>
                  <Chip
                                  label={selectedLog.user.role}
                    size="small"
                                  sx={{
                                    background: 'rgba(66, 165, 245, 0.12)',
                                    color: '#42a5f5',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Email sx={{ fontSize: '18px', color: '#42a5f5' }} />
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>
                                    Email
                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {selectedLog.user.email}
                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                            No user information available
                          </Typography>
                        )}
                      </Box>
                </Grid>

                    {/* Patient Information Card */}
                    {selectedLog.patient && (
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '2px solid rgba(66, 165, 245, 0.4)',
                            height: '100%',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.25)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: GRADIENT_COLORS.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Person sx={{ color: '#ffffff', fontSize: '20px' }} />
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#666',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Patient Information
                  </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 56,
                                height: 56,
                                background: GRADIENT_COLORS.primary,
                                fontSize: '1.4rem',
                                fontWeight: 700,
                              }}
                            >
                              {selectedLog.patient.firstName?.charAt(0)?.toUpperCase() || 'P'}
                              {selectedLog.patient.lastName?.charAt(0)?.toUpperCase() || ''}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5, fontSize: '1.125rem' }}>
                                {selectedLog.patient.firstName} {selectedLog.patient.lastName}
                  </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {selectedLog.patient.mrn && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Badge sx={{ fontSize: '18px', color: '#42a5f5' }} />
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>
                                    MRN
                    </Typography>
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {selectedLog.patient.mrn}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            {selectedLog.patient.nationalId && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Badge sx={{ fontSize: '18px', color: '#42a5f5' }} />
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>
                                    National ID
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {selectedLog.patient.nationalId}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                </Grid>
                    )}

                    {/* Access Details Section */}
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                          borderRadius: '16px',
                          padding: '20px',
                          border: '1px solid rgba(66, 165, 245, 0.25)',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#666',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 2,
                          }}
                        >
                          Access Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(66, 165, 245, 0.2)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Computer sx={{ fontSize: '20px', color: '#42a5f5' }} />
                                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 500 }}>
                                  Access Method
                                </Typography>
                              </Box>
                              <Typography variant="body1" sx={{ color: '#424242', fontWeight: 600, fontSize: '0.9375rem', flex: 1 }}>
                                {selectedLog.accessMethod}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(66, 165, 245, 0.2)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Computer sx={{ fontSize: '20px', color: '#42a5f5' }} />
                                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 500 }}>
                                  IP Address
                                </Typography>
                              </Box>
                              <Typography variant="body1" sx={{ color: '#424242', fontWeight: 600, fontSize: '0.9375rem', fontFamily: 'monospace', flex: 1 }}>
                                {selectedLog.ipAddress || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(66, 165, 245, 0.2)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CalendarToday sx={{ fontSize: '20px', color: '#42a5f5' }} />
                                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 500 }}>
                                  Timestamp
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#424242', fontWeight: 500, fontSize: '0.875rem' }}>
                                {format(new Date(selectedLog.timestamp), 'PPpp')}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                                {formatDistanceToNow(new Date(selectedLog.timestamp), { addSuffix: true })}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* User Agent */}
                {selectedLog.userAgent && (
                  <Grid item xs={12}>
                        <Box
                          sx={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(66, 165, 245, 0.25)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: GRADIENT_COLORS.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Computer sx={{ color: '#ffffff', fontSize: '20px' }} />
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#666',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                      User Agent
                    </Typography>
                          </Box>
                          <Box
                            sx={{
                              background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid rgba(66, 165, 245, 0.2)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                              {selectedLog.userAgent}
                            </Typography>
                          </Box>
                        </Box>
                  </Grid>
                )}

                    {/* Reason */}
                {selectedLog.reason && (
                  <Grid item xs={12}>
                        <Box
                          sx={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(66, 165, 245, 0.25)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: GRADIENT_COLORS.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Info sx={{ color: '#ffffff', fontSize: '20px' }} />
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#666',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                      Reason
                    </Typography>
                          </Box>
                          <Box
                            sx={{
                              background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid rgba(66, 165, 245, 0.2)',
                            }}
                          >
                            <Typography variant="body1" sx={{ color: '#424242', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                              {selectedLog.reason}
                            </Typography>
                          </Box>
                        </Box>
                  </Grid>
                )}
              </Grid>
                </Box>
            )}
          </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={{
                  background: GRADIENT_COLORS.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '8px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                    boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                  },
                }}
              >
                Close
              </Button>
          </DialogActions>
        </Dialog>
      </Box>
      </Fade>
    </LocalizationProvider>
  );
};

export default PatientAccessLogsTab;
