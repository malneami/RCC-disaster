import { useMemo, useState } from 'react';
import { Hospital } from '../../../services/hospitalService';

export const useHospitalGrid = (hospitals: Hospital[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter hospitals
  const filteredHospitals = useMemo(() => {
    let result = hospitals;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.name?.toLowerCase().includes(query) ||
        h.cluster?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(h => h.status?.toLowerCase() === statusFilter);
    }

    return result;
  }, [hospitals, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = hospitals.length;
    const active = hospitals.filter(h => h.status?.toLowerCase() === 'active' || h.status?.toLowerCase() === 'operational').length;
    const totalBeds = hospitals.reduce((sum, h) => sum + h.icuBeds + h.picuBeds + h.maleBeds + h.femaleBeds + h.pediatricBeds + h.standardBeds + (h.nicuBeds || 0), 0);
    const availableBeds = hospitals.reduce((sum, h) => sum + h.icuBedsAvailable + h.picuBedsAvailable + h.maleBedsAvailable + h.femaleBedsAvailable + h.pediatricBedsAvailable + h.standardBedsAvailable + (h.nicuBedsAvailable || 0), 0);
    return { total, active, totalBeds, availableBeds };
  }, [hospitals]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredHospitals,
    stats
  };
};
