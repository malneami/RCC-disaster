import React, { useState } from 'react';
import { Box, Alert, CircularProgress, alpha, Typography, IconButton, Tooltip, Button, InputBase, Paper, Chip, useTheme, Badge } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  Error as CriticalIcon,
  CheckCircle as HealthyIcon,
  Hotel as BedIcon,
  Favorite as StemiIcon,
  Psychology as StrokeIcon,
  LocalFireDepartment as TraumaIcon,
} from '@mui/icons-material';
import { Hospital, CapacityAlert, HospitalFilters } from '../../services/hospitalService';
import HospitalDetailDrawer from './components/HospitalDetailDrawer';
import CreateHospitalDialog from './components/CreateHospitalDialog';
import UpdateCapacityDialog from './components/UpdateCapacityDialog';
import AlertDialog from './components/AlertDialog';
import FilterDialog from './components/FilterDialog';

interface HospitalsPageProps {
  hospitals: Hospital[];
  alerts: CapacityAlert[];
  loading: boolean;
  error: string | null;
  tabValue: number;
  selectedHospital: Hospital | null;
  filters: HospitalFilters;
  dialogStates: {
    createDialogOpen: boolean;
    updateCapacityDialogOpen: boolean;
    alertDialogOpen: boolean;
    filterDialogOpen: boolean;
  };
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onUpdateCapacity: (hospital: Hospital) => void;
  onViewDashboard: (hospitalId: string) => void;
  onCreateHospital: (hospitalData: any) => void;
  onUpdateCapacitySubmit: (hospitalId: string, capacityData: any) => void;
  onApplyFilters: (filters: HospitalFilters) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onDialogClose: (dialogType: string) => void;
  onDialogOpen: (dialogType: string) => void;
}

// Stat Pill Component
const StatPill: React.FC<{
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 2,
      py: 1,
      borderRadius: 3,
      backgroundColor: alpha(color, 0.08),
      border: `1px solid ${alpha(color, 0.2)}`,
      transition: 'all 0.2s ease',
      cursor: 'default',
      '&:hover': {
        backgroundColor: alpha(color, 0.12),
        transform: 'translateY(-1px)',
      },
    }}
  >
    <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>
      {icon}
    </Box>
    <Typography sx={{ fontWeight: 700, color: color, fontSize: '1rem' }}>
      {value}
    </Typography>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

// Hospital Card Component
const HospitalCard: React.FC<{
  hospital: Hospital;
  isSelected: boolean;
  onClick: () => void;
}> = ({ hospital, isSelected, onClick }) => {
  const theme = useTheme();

  const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
    hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds + (hospital.nicuBeds || 0);
  const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
    hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
    hospital.pediatricBedsAvailable + hospital.standardBedsAvailable + (hospital.nicuBedsAvailable || 0);
  const percentage = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

  const getStatusConfig = () => {
    const status = hospital.status?.toLowerCase() || '';
    if (status === 'active' || status === 'operational')
      return { color: '#10b981', label: 'Active', bg: alpha('#10b981', 0.1) };
    if (status === 'maintenance')
      return { color: '#f59e0b', label: 'Maintenance', bg: alpha('#f59e0b', 0.1) };
    return { color: '#ef4444', label: 'Inactive', bg: alpha('#ef4444', 0.1) };
  };

  const getCapacityColor = () => {
    if (percentage <= 15) return '#ef4444';
    if (percentage <= 35) return '#f59e0b';
    return '#10b981';
  };

  const statusConfig = getStatusConfig();
  const capacityColor = getCapacityColor();

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme.palette.primary.light,
          boxShadow: `0 4px 20px ${alpha('#000', 0.06)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
        {/* Hospital Avatar */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
        >
          {hospital.name?.charAt(0) || 'H'}
        </Box>

        {/* Hospital Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {hospital.name}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.25,
                borderRadius: 2,
                backgroundColor: statusConfig.bg,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusConfig.color }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: statusConfig.color }}>
                {statusConfig.label}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            📍 {hospital.cluster || 'Unassigned'}
          </Typography>
        </Box>

        {/* Bed Stats */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
              {hospital.icuBedsAvailable}/{hospital.icuBeds}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
              ICU
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>
              {hospital.picuBedsAvailable}/{hospital.picuBeds}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
              PICU
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {availableBeds}/{totalBeds}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
              Total
            </Typography>
          </Box>
        </Box>

        {/* Capacity Bar */}
        <Box sx={{ width: 140 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Capacity</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: capacityColor }}>{percentage}%</Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(capacityColor, 0.15),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${percentage}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${capacityColor} 0%, ${alpha(capacityColor, 0.7)} 100%)`,
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
        </Box>

        {/* Services */}
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          {hospital.hasStemiService && (
            <Tooltip title="STEMI Service" arrow>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#ef4444', 0.1) }}>
                <StemiIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              </Box>
            </Tooltip>
          )}
          {hospital.hasStrokeService && (
            <Tooltip title="Stroke Center" arrow>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#3b82f6', 0.1) }}>
                <StrokeIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
              </Box>
            </Tooltip>
          )}
          {hospital.hasTraumaService && (
            <Tooltip title="Trauma Center" arrow>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: alpha('#f59e0b', 0.1) }}>
                <TraumaIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const HospitalsPage: React.FC<HospitalsPageProps> = ({
  hospitals,
  alerts,
  loading,
  error,
  selectedHospital,
  filters,
  dialogStates,
  onUpdateCapacity,
  onViewDashboard,
  onCreateHospital,
  onUpdateCapacitySubmit,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  onDialogClose,
  onDialogOpen,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHospitalForDrawer, setSelectedHospitalForDrawer] = useState<Hospital | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Calculate statistics
  const getAvailabilityPercentage = (hospital: Hospital) => {
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
      hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds + (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
      hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
      hospital.pediatricBedsAvailable + hospital.standardBedsAvailable + (hospital.nicuBedsAvailable || 0);
    return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
  };

  const stats = {
    total: hospitals.length,
    critical: hospitals.filter(h => getAvailabilityPercentage(h) <= 15).length,
    warning: hospitals.filter(h => { const a = getAvailabilityPercentage(h); return a > 15 && a <= 35; }).length,
    healthy: hospitals.filter(h => getAvailabilityPercentage(h) > 35).length,
    totalBeds: hospitals.reduce((sum, h) => sum + h.icuBeds + h.picuBeds + h.maleBeds + h.femaleBeds + h.pediatricBeds + h.standardBeds + (h.nicuBeds || 0), 0),
    availableBeds: hospitals.reduce((sum, h) => sum + h.icuBedsAvailable + h.picuBedsAvailable + h.maleBedsAvailable + h.femaleBedsAvailable + h.pediatricBedsAvailable + h.standardBedsAvailable + (h.nicuBedsAvailable || 0), 0),
  };

  // Filter hospitals
  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = !searchQuery.trim() ||
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.cluster?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'critical' && getAvailabilityPercentage(h) <= 15) ||
      (statusFilter === 'warning' && getAvailabilityPercentage(h) > 15 && getAvailabilityPercentage(h) <= 35) ||
      (statusFilter === 'healthy' && getAvailabilityPercentage(h) > 35);
    return matchesSearch && matchesStatus;
  });

  const handleCardClick = (hospital: Hospital) => {
    setSelectedHospitalForDrawer(hospital);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hospital Management - RCC Healthcare</title>
      </Helmet>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f8fafc',
          pb: 4,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            backgroundColor: 'white',
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
            {/* Title */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Hospital Network
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {stats.total} facilities in the network
              </Typography>
            </Box>

            {/* Search */}
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                maxWidth: 400,
                px: 2,
                py: 1,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: '#f8fafc',
                '&:focus-within': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: 'white',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
              }}
            >
              <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, fontSize: '0.875rem' }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Paper>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Badge badgeContent={alerts.length} color="error">
                <IconButton
                  size="small"
                  onClick={() => onDialogOpen('alert')}
                  sx={{
                    backgroundColor: alpha('#000', 0.04),
                    '&:hover': { backgroundColor: alpha('#000', 0.08) },
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Badge>
              <IconButton
                size="small"
                onClick={onRefresh}
                sx={{
                  backgroundColor: alpha('#000', 0.04),
                  '&:hover': { backgroundColor: alpha('#000', 0.08) },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <Button
                variant="contained"
                size="medium"
                startIcon={<AddIcon />}
                onClick={() => onDialogOpen('create')}
                sx={{
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
                }}
              >
                Add Hospital
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stats Pills */}
        <Box
          sx={{
            px: 4,
            py: 2,
            backgroundColor: 'white',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <StatPill label="Total" value={stats.total} color="#3b82f6" icon={<HospitalIcon sx={{ fontSize: 18 }} />} />
          <StatPill label="Critical" value={stats.critical} color="#ef4444" icon={<CriticalIcon sx={{ fontSize: 18 }} />} />
          <StatPill label="Warning" value={stats.warning} color="#f59e0b" icon={<WarningIcon sx={{ fontSize: 18 }} />} />
          <StatPill label="Healthy" value={stats.healthy} color="#10b981" icon={<HealthyIcon sx={{ fontSize: 18 }} />} />
          <StatPill
            label="Available Beds"
            value={`${stats.availableBeds}/${stats.totalBeds}`}
            color="#8b5cf6"
            icon={<BedIcon sx={{ fontSize: 18 }} />}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 4, mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filter Chips */}
        <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Filter:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { key: 'all', label: 'All Hospitals' },
              { key: 'critical', label: 'Critical', color: '#ef4444' },
              { key: 'warning', label: 'Warning', color: '#f59e0b' },
              { key: 'healthy', label: 'Healthy', color: '#10b981' },
            ].map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                onClick={() => setStatusFilter(f.key)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 2,
                  backgroundColor: statusFilter === f.key
                    ? (f.color ? alpha(f.color, 0.15) : alpha(theme.palette.primary.main, 0.15))
                    : 'white',
                  color: statusFilter === f.key
                    ? (f.color || theme.palette.primary.main)
                    : 'text.secondary',
                  border: `1px solid ${statusFilter === f.key
                    ? (f.color || theme.palette.primary.main)
                    : theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: f.color ? alpha(f.color, 0.1) : alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              />
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            Showing {filteredHospitals.length} of {hospitals.length} hospitals
          </Typography>
        </Box>

        {/* Hospital Cards List */}
        <Box sx={{ px: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredHospitals.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <HospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No hospitals found</Typography>
            </Paper>
          ) : (
            filteredHospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                isSelected={selectedHospitalForDrawer?.id === hospital.id}
                onClick={() => handleCardClick(hospital)}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Side Drawer */}
      <HospitalDetailDrawer
        hospital={selectedHospitalForDrawer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateCapacity={onUpdateCapacity}
        onViewDashboard={onViewDashboard}
      />

      {/* Dialogs */}
      <CreateHospitalDialog
        open={dialogStates.createDialogOpen}
        onClose={() => onDialogClose('create')}
        onSubmit={onCreateHospital}
      />

      <UpdateCapacityDialog
        open={dialogStates.updateCapacityDialogOpen}
        hospital={selectedHospital}
        onClose={() => onDialogClose('updateCapacity')}
        onSubmit={onUpdateCapacitySubmit}
      />

      <AlertDialog
        open={dialogStates.alertDialogOpen}
        alerts={alerts}
        onClose={() => onDialogClose('alert')}
      />

      <FilterDialog
        open={dialogStates.filterDialogOpen}
        filters={filters}
        onClose={() => onDialogClose('filter')}
        onApply={onApplyFilters}
        onReset={onResetFilters}
      />
    </>
  );
};

export default HospitalsPage;
