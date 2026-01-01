import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, HospitalFilters } from '../../services/hospitalService';
import { hospitalService } from '../../services/hospitalService';
import { useHospitals } from './hooks/useHospitals';
import HospitalsPageView from './HospitalsPageView';

const HospitalsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    filters,
    filteredHospitals,
    loadHospitals,
    setFilters,
    resetFilters,
  } = useHospitals();

  const [tabValue, setTabValue] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateCapacityDialogOpen, setUpdateCapacityDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateHospital = async (hospitalData: any) => {
    try {
      await hospitalService.createHospital(hospitalData);
      setCreateDialogOpen(false);
      loadHospitals();
    } catch (err) {
      console.error('Error creating hospital:', err);
    }
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    if (!window.confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) {
      return;
    }

    try {
      await hospitalService.deleteHospital(hospitalId);
      loadHospitals();
    } catch (err) {
      console.error('Error deleting hospital:', err);
      alert('Failed to delete hospital');
    }
  };

  const handleUpdateCapacity = async (hospitalId: string, capacityData: any) => {
    try {
      await hospitalService.updateHospitalCapacity(hospitalId, capacityData);
      setUpdateCapacityDialogOpen(false);
      loadHospitals();
    } catch (err) {
      console.error('Error updating capacity:', err);
    }
  };

  const handleApplyFilters = (newFilters: HospitalFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleUpdateCapacityClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setUpdateCapacityDialogOpen(true);
  };

  const handleViewDashboard = (hospitalId: string) => {
    navigate(`/hospitals/${hospitalId}`);
  };

  const handleDialogClose = (dialogType: string) => {
    switch (dialogType) {
      case 'create':
        setCreateDialogOpen(false);
        break;
      case 'updateCapacity':
        setUpdateCapacityDialogOpen(false);
        setSelectedHospital(null);
        break;
      case 'filter':
        setFilterDialogOpen(false);
        break;
    }
  };

  const handleDialogOpen = (dialogType: string) => {
    switch (dialogType) {
      case 'create':
        setCreateDialogOpen(true);
        break;
      case 'filter':
        setFilterDialogOpen(true);
        break;
    }
  };

  const dialogStates = {
    createDialogOpen,
    updateCapacityDialogOpen,
    filterDialogOpen,
  };

  return (
    <HospitalsPageView
      hospitals={filteredHospitals}
      loading={loading}
      error={error}
      tabValue={tabValue}
      selectedHospital={selectedHospital}
      filters={filters}
      dialogStates={dialogStates}
      onTabChange={handleTabChange}
      onUpdateCapacity={handleUpdateCapacityClick}
      onViewDashboard={handleViewDashboard}
      onCreateHospital={handleCreateHospital}
      onDeleteHospital={handleDeleteHospital}
      onUpdateCapacitySubmit={handleUpdateCapacity}
      onApplyFilters={handleApplyFilters}
      onResetFilters={handleResetFilters}
      onRefresh={loadHospitals}
      onDialogClose={handleDialogClose}
      onDialogOpen={handleDialogOpen}
    />
  );
};

export default HospitalsPage;
