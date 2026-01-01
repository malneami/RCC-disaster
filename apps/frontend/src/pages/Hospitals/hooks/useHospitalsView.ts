import { useState, useMemo } from 'react';
import { Hospital } from '../../../services/hospitalService';
import { useTheme, alpha } from '@mui/material';

export const useHospitalsView = (hospitals: Hospital[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHospitalForDrawer, setSelectedHospitalForDrawer] = useState<Hospital | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  // Calculate statistics
  const getAvailabilityPercentage = (hospital: Hospital) => {
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
      hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds + (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
      hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
      hospital.pediatricBedsAvailable + hospital.standardBedsAvailable + (hospital.nicuBedsAvailable || 0);
    return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
  };

  const stats = useMemo(() => ({
    total: hospitals.length,
    critical: hospitals.filter(h => getAvailabilityPercentage(h) <= 15).length,
    warning: hospitals.filter(h => { const a = getAvailabilityPercentage(h); return a > 15 && a <= 35; }).length,
    healthy: hospitals.filter(h => getAvailabilityPercentage(h) > 35).length,
    totalBeds: hospitals.reduce((sum, h) => sum + h.icuBeds + h.picuBeds + h.maleBeds + h.femaleBeds + h.pediatricBeds + h.standardBeds + (h.nicuBeds || 0), 0),
    availableBeds: hospitals.reduce((sum, h) => sum + h.icuBedsAvailable + h.picuBedsAvailable + h.maleBedsAvailable + h.femaleBedsAvailable + h.pediatricBedsAvailable + h.standardBedsAvailable + (h.nicuBedsAvailable || 0), 0),
  }), [hospitals]);

  // Filter hospitals
  const filteredHospitals = useMemo(() => hospitals.filter(h => {
    const matchesSearch = !searchQuery.trim() ||
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.cluster?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'critical' && getAvailabilityPercentage(h) <= 15) ||
      (statusFilter === 'warning' && getAvailabilityPercentage(h) > 15 && getAvailabilityPercentage(h) <= 35) ||
      (statusFilter === 'healthy' && getAvailabilityPercentage(h) > 35);
    return matchesSearch && matchesStatus;
  }), [hospitals, searchQuery, statusFilter]);

  const handleCardClick = (hospital: Hospital) => {
    setSelectedHospitalForDrawer(hospital);
    setDrawerOpen(true);
  };

  // Filter chip definitions
  const filterChips = [
    { key: 'all', label: 'All Hospitals' },
    { key: 'critical', label: 'Critical', color: '#ef4444' },
    { key: 'warning', label: 'Warning', color: '#f59e0b' },
    { key: 'healthy', label: 'Healthy', color: '#10b981' },
  ];

  const getChipStyles = (chipKey: string, color?: string) => ({
    fontWeight: 600,
    fontSize: '0.75rem',
    borderRadius: 2,
    backgroundColor: statusFilter === chipKey
      ? (color ? alpha(color, 0.15) : alpha(theme.palette.primary.main, 0.15))
      : 'white',
    color: statusFilter === chipKey
      ? (color || theme.palette.primary.main)
      : 'text.secondary',
    border: `1px solid ${statusFilter === chipKey
      ? (color || theme.palette.primary.main)
      : theme.palette.divider}`,
    '&:hover': {
      backgroundColor: color ? alpha(color, 0.1) : alpha(theme.palette.primary.main, 0.1),
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedHospitalForDrawer,
    setSelectedHospitalForDrawer,
    drawerOpen,
    setDrawerOpen,
    stats,
    filteredHospitals,
    handleCardClick,
    filterChips,
    getChipStyles,
  };
};
