import { Hospital } from '../../../services/hospitalService';

/**
 * Get the color for hospital status
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
      return 'success';
    case 'LIMITED':
      return 'warning';
    case 'CRITICAL':
      return 'error';
    case 'OFFLINE':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Calculate availability percentage for a hospital
 */
export const getAvailabilityPercentage = (hospital: Hospital) => {
  const totalBeds = (hospital.icuBeds || 0) + (hospital.picuBeds || 0) +
    (hospital.maleBeds || 0) + (hospital.femaleBeds || 0) +
    (hospital.pediatricBeds || 0) + (hospital.standardBeds || 0) +
    (hospital.nicuBeds || 0);
  const availableBeds = (hospital.icuBedsAvailable || 0) + (hospital.picuBedsAvailable || 0) +
    (hospital.maleBedsAvailable || 0) + (hospital.femaleBedsAvailable || 0) +
    (hospital.pediatricBedsAvailable || 0) + (hospital.standardBedsAvailable || 0) +
    (hospital.nicuBedsAvailable || 0);
  return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
};

/**
 * Get color based on availability percentage
 */
export const getAvailabilityColor = (percentage: number) => {
  if (percentage <= 10) return 'error';
  if (percentage <= 25) return 'warning';
  return 'success';
};

/**
 * Filter hospitals based on filter criteria
 */
export const filterHospitals = (hospitals: Hospital[], filters: any) => {
  return hospitals.filter(hospital => {
    if (filters.status && hospital.status !== filters.status) return false;
    if (filters.cluster && hospital.cluster !== filters.cluster) return false;
    if (filters.hasStemiService !== undefined && hospital.hasStemiService !== filters.hasStemiService) return false;
    if (filters.hasStrokeService !== undefined && hospital.hasStrokeService !== filters.hasStrokeService) return false;
    if (filters.hasTraumaService !== undefined && hospital.hasTraumaService !== filters.hasTraumaService) return false;
    return true;
  });
};

/**
 * Get total bed count for a hospital
 */
export const getTotalBeds = (hospital: Hospital) => {
  return hospital.icuBeds + hospital.picuBeds + hospital.maleBeds + 
         hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds;
};

/**
 * Get available bed count for a hospital
 */
export const getAvailableBeds = (hospital: Hospital) => {
  return hospital.icuBedsAvailable + hospital.picuBedsAvailable + 
         hospital.maleBedsAvailable + hospital.femaleBedsAvailable + 
         hospital.pediatricBedsAvailable + hospital.standardBedsAvailable;
};

/**
 * Get bed utilization percentage
 */
export const getBedUtilization = (hospital: Hospital) => {
  const totalBeds = getTotalBeds(hospital);
  const availableBeds = getAvailableBeds(hospital);
  return totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
};
