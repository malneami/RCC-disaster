import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, HospitalFilters } from '../../services/hospitalService';
import { hospitalService } from '../../services/hospitalService';
import { disasterService } from '../../services/disasterService';
import type { DisasterIncident } from '../../services/disasterService';
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
  const [incidents, setIncidents] = useState<DisasterIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
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

  // Listen for hospital capacity changes (e.g., when beds are assigned/unassigned)
  useEffect(() => {
    const handleCapacityChange = () => {
      loadHospitals();
    };

    window.addEventListener('hospital-capacity-changed', handleCapacityChange);
    return () => {
      window.removeEventListener('hospital-capacity-changed', handleCapacityChange);
    };
  }, [loadHospitals]);

  const loadIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const data = await disasterService.getActiveIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch disaster incidents:', err);
      setIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      loadIncidents();
    }
  }, [tabValue, loadIncidents]);

  const handleViewDisasterManagement = () => {
    navigate('/disaster-management');
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
      incidents={incidents}
      loadingIncidents={loadingIncidents}
      onTabChange={handleTabChange}
      onUpdateCapacity={handleUpdateCapacityClick}
      onViewDashboard={handleViewDashboard}
      onCreateHospital={handleCreateHospital}
      onDeleteHospital={handleDeleteHospital}
      onUpdateCapacitySubmit={handleUpdateCapacity}
      onApplyFilters={handleApplyFilters}
      onResetFilters={handleResetFilters}
      onRefresh={loadHospitals}
      onRefreshIncidents={loadIncidents}
      onDialogClose={handleDialogClose}
      onDialogOpen={handleDialogOpen}
      onViewDisasterManagement={handleViewDisasterManagement}
    />
  );
};

export default HospitalsPage;
