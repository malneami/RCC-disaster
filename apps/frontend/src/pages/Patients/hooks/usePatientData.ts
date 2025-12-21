import { useState, useEffect } from 'react';
import { Patient, PatientFilter, patientService } from '../../../services/patientService';

export const usePatientData = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PatientFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, [currentPage, filters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await patientService.getPatients(currentPage, 20, filters);
      setPatients(response.data);
      setTotalPatients(response.total);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const searchResults = await patientService.searchPatients(searchQuery);
        setPatients(searchResults);
        setTotalPatients(searchResults.length);
      } catch (error) {
        console.error('Error searching patients:', error);
        setError('Failed to search patients');
      } finally {
        setLoading(false);
      }
    } else {
      loadPatients();
    }
  };

  const handleFiltersChange = (newFilters: PatientFilter) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
    // Update total count if no filters or search are active
    // Otherwise, reload data to get accurate count
    if (Object.keys(filters).length === 0 && !searchQuery.trim()) {
      setTotalPatients(prev => prev + 1);
    } else {
      // Reload to get accurate count with filters/search
      loadPatients();
    }
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    setPatients(prev => 
      prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
  };

  const handleExportPatient = async (patient: Patient) => {
    try {
      const blob = await patientService.exportPatient(patient.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${patient.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export patient data');
    }
  };

  const totalPages = Math.ceil(totalPatients / 20);

  return {
    // State
    patients,
    loading,
    totalPatients,
    currentPage,
    filters,
    searchQuery,
    error,
    totalPages,
    
    // Actions
    setCurrentPage,
    setSearchQuery,
    setError,
    handleSearch,
    handleFiltersChange,
    handlePatientCreated,
    handlePatientUpdated,
    handleExportPatient,
  };
};
