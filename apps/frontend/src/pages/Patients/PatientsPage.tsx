import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  InputBase,
  IconButton,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Patient } from '../../services/patientService';
import MultiStepPatientForm from './components/forms/MultiStepPatientForm';
import GenericTabs from '../../components/Common/GenericTabs';
import PatientFilters from './components/PatientFilters';
import ExportDialog from '../../components/Common/ExportDialog';
import { usePatientData } from './hooks/usePatientData';
import { usePatientExport } from './hooks/usePatientExport';
import { usePatientTabsContent } from './components/table/PatientTabsContent';
import { createPatientFilterFields } from './config/patientFilterFields';
import { ExportOptions } from '../../components/Common/ExportDialog';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPatient, setExportPatient] = useState<Patient | null>(null);

  const {
    patients,
    loading,
    totalPatients,
    currentPage,
    filters,
    searchQuery,
    error,
    totalPages,
    setCurrentPage,
    setSearchQuery,
    setError,
    handleSearch,
    handleFiltersChange,
    handlePatientCreated,
    handlePatientUpdated,
  } = usePatientData();

  const { exportPatient: exportPatientData } = usePatientExport();

  const handleViewPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientForm(true);
  };

  const handleAddPatient = () => {
    setShowPatientForm(true);
  };

  const handlePatientFormClose = () => {
    setShowPatientForm(false);
    setSelectedPatient(null);
  };

  const handlePatientCreatedWrapper = (patient: Patient) => {
    handlePatientCreated(patient);
    setSelectedPatient(null);
    handlePatientFormClose();
  };

  const handlePatientUpdatedWrapper = (patient: Patient) => {
    handlePatientUpdated(patient);
    setSelectedPatient(null);
    handlePatientFormClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    handleFiltersChange({});
  };

  const handleViewDuplicate = (patient: Patient) => {
    // Open the patient details in a new tab or navigate to it
    window.open(`/patients/${patient.id}`, '_blank');
  };

  const handleFilterDialogClose = () => {
    setShowFilterDialog(false);
  };

  const handleFilterDialogReset = () => {
    handleFiltersChange({});
  };

  const handleExportPatient = (patient: Patient) => {
    setExportPatient(patient);
    setShowExportDialog(true);
  };

  const handleExportDialogClose = () => {
    setShowExportDialog(false);
    setExportPatient(null);
  };

  const handleExport = async (options: ExportOptions) => {
    if (exportPatient) {
      await exportPatientData(exportPatient, options);
    }
  };

  const filterFields = createPatientFilterFields();
  const theme = useTheme();

  const tabsConfig = usePatientTabsContent({
    patients,
    loading,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    onViewPatient: handleViewPatient,
    onEditPatient: handleEditPatient,
    onExportPatient: handleExportPatient,
  });

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFilterCount = Object.keys(filters).length;

  if (loading && patients.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Integrated Header with Search */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: 2.5,
          backgroundColor: 'white',
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Top Row: Title and Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Title Section */}
          <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 0.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Patient Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              {totalPatients} {totalPatients === 1 ? 'patient' : 'patients'} found
              {hasActiveFilters && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilterDialog(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                borderColor: hasActiveFilters ? theme.palette.primary.main : undefined,
                backgroundColor: hasActiveFilters ? alpha(theme.palette.primary.main, 0.08) : undefined,
                color: hasActiveFilters ? theme.palette.primary.main : undefined,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: hasActiveFilters
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Filters
              {hasActiveFilters && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    minWidth: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                  }}
                />
              )}
            </Button>
            <Button
              variant="contained"
              size="medium"
              startIcon={<AddIcon />}
              onClick={handleAddPatient}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            >
              Add Patient
            </Button>
          </Box>
        </Box>

        {/* Search Bar Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: { xs: '100%', sm: 300 },
              px: 2,
              py: 1.25,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: '#f8fafc',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: theme.palette.primary.main,
                backgroundColor: 'white',
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
              },
            }}
          >
            <SearchIcon sx={{ color: 'text.disabled', mr: 1.5, fontSize: 20 }} />
            <InputBase
              placeholder="Search patients by name, MRN, or National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              sx={{
                flex: 1,
                fontSize: '0.875rem',
                '& input': {
                  py: 0.5,
                },
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  handleSearch();
                }}
                sx={{
                  ml: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Paper>

          {/* Quick Reset Button - only show when there's something to reset */}
          {(searchQuery || hasActiveFilters) && (
            <Button
              variant="outlined"
              size="medium"
              onClick={handleReset}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 500,
                px: 2,
                borderColor: theme.palette.divider,
                color: 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.04),
                },
              }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              Active filters:
            </Typography>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              const field = filterFields.find((f) => f.key === key);
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : typeof value === 'object' && value !== null
                  ? JSON.stringify(value)
                  : String(value);
              return (
                <Chip
                  key={key}
                  label={`${field?.label || key}: ${displayValue}`}
                  size="small"
                  onDelete={() => {
                    const newFilters = { ...filters };
                    delete (newFilters as any)[key];
                    handleFiltersChange(newFilters);
                  }}
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-deleteIcon': {
                      fontSize: '0.9rem',
                      color: theme.palette.primary.main,
                      '&:hover': {
                        color: theme.palette.primary.dark,
                      },
                    },
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Patient Filters Dialog */}
        <PatientFilters
          open={showFilterDialog}
          onClose={handleFilterDialogClose}
          fields={filterFields}
          values={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleFilterDialogClose}
          onClearFilters={handleFilterDialogReset}
        />

        {/* Tabs */}
        <GenericTabs
          tabs={tabsConfig}
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        />
      </Box>



      {/* Patient Form Dialog */}
      <MultiStepPatientForm
        open={showPatientForm}
        patient={selectedPatient}
        onClose={handlePatientFormClose}
        onPatientCreated={handlePatientCreatedWrapper}
        onPatientUpdated={handlePatientUpdatedWrapper}
        onViewDuplicate={handleViewDuplicate}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        title="Export Patient Data"
        entityName="patient"
        onClose={handleExportDialogClose}
        onExport={handleExport}
      />
    </Box>
  );
};

export default PatientsPage;