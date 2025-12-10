import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Patient } from '../../services/patientService';
import MultiStepPatientForm from './components/forms/MultiStepPatientForm';
import GenericPageHeader from '../../components/Common/GenericPageHeader';
import GenericTabs from '../../components/Common/GenericTabs';
import GenericFilterDialog from '../../components/Common/GenericFilterDialog';
import ExportDialog from '../../components/Common/ExportDialog';
import SearchBar from '../../components/Common/SearchBar';
import { usePatientData } from './hooks/usePatientData';
import { usePatientExport } from './hooks/usePatientExport';
import { usePatientTabsContent } from './components/table/PatientTabsContent';
import { usePatientActions } from './components/forms/PatientActions';
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

  const handleFilterDialogApply = (newFilters: any) => {
    handleFiltersChange(newFilters);
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

  const headerActions = usePatientActions({
    onAddPatient: handleAddPatient,
  });

  if (loading && patients.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <GenericPageHeader
        title="Patient Management"
        actions={headerActions}
      />

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder="Search patients by name, MRN, or National ID..."
        onToggleFilters={() => setShowFilterDialog(true)}
        resultCount={totalPatients}
        resultLabel="patients found"
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <GenericTabs
        tabs={tabsConfig}
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
      />

      {/* Patient Form Dialog */}
      <MultiStepPatientForm
        open={showPatientForm}
        patient={selectedPatient}
        onClose={handlePatientFormClose}
        onPatientCreated={handlePatientCreatedWrapper}
        onPatientUpdated={handlePatientUpdatedWrapper}
        onViewDuplicate={handleViewDuplicate}
      />

      {/* Filter Dialog */}
      <GenericFilterDialog
        open={showFilterDialog}
        title="Patient Filters"
        fields={filterFields}
        values={filters}
        onClose={handleFilterDialogClose}
        onApply={handleFilterDialogApply}
        onReset={handleFilterDialogReset}
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