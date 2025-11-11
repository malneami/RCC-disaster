import React, { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { emsService } from '../../../pages/EMS/services/emsService';
import { AmbulanceGPSData, MapFilters } from '../types';
import { Ambulance } from '../../../pages/EMS/types/ems';

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

interface UseAmbulanceTrackingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: MapFilters;
  useGPSAPI?: boolean;
}

export const useAmbulanceTracking = (options: UseAmbulanceTrackingOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = REFRESH_INTERVAL,
    filters = {},
    useGPSAPI = true,
  } = options;

  const [ambulanceData, setAmbulanceData] = useState<AmbulanceGPSData[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Always fetch ambulance data from database to get status and driver info
  const ambulancesQuery = useQuery(
    ['ambulances'],
    () => emsService.getAmbulances(),
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
    }
  );

  // Query for GPS data from external GPS API
  const gpsQuery = useQuery(
    ['ambulances-gps'],
    () => emsService.getAmbulancesGPS(),
    {
      enabled: useGPSAPI,
      refetchInterval: autoRefresh ? refreshInterval : false,
    }
  );

  // Update data when queries complete - merge GPS with database data
  React.useEffect(() => {
    if (!useGPSAPI) {
      // Database-only mode: use database data directly
      if (ambulancesQuery.data) {
        const mappedData = mapAmbulancesToGPS(ambulancesQuery.data);
        setAmbulanceData(mappedData);
        setLastUpdateTime(new Date());
      }
    } else {
      // GPS mode: merge GPS data with database data
      if (gpsQuery.data?.status && gpsQuery.data?.data && ambulancesQuery.data) {
        // Both GPS and database data available - merge them
        const mergedData = mergeGPSWithDatabaseData(gpsQuery.data.data, ambulancesQuery.data);
        setAmbulanceData(mergedData);
        setLastUpdateTime(new Date());
      } else if (gpsQuery.error && ambulancesQuery.data) {
        // GPS failed, fallback to database-only data
        const mappedData = mapAmbulancesToGPS(ambulancesQuery.data);
        setAmbulanceData(mappedData);
        setLastUpdateTime(new Date());
      } else if (!gpsQuery.isLoading && !ambulancesQuery.isLoading && ambulancesQuery.data) {
        // GPS data not available but database is - use database data
        const mappedData = mapAmbulancesToGPS(ambulancesQuery.data);
        setAmbulanceData(mappedData);
        setLastUpdateTime(new Date());
      }
    }
  }, [useGPSAPI, gpsQuery.data, gpsQuery.error, gpsQuery.isLoading, ambulancesQuery.data, ambulancesQuery.isLoading]);

  // Merge GPS data with database ambulance data to get status, driver, and other info
  const mergeGPSWithDatabaseData = (gpsData: any[], ambulances: Ambulance[]): AmbulanceGPSData[] => {
    if (!Array.isArray(gpsData) || !Array.isArray(ambulances)) return [];
    
    // Create a map of ambulances by IMEI for quick lookup
    const ambulanceMap = new Map<string, Ambulance>();
    ambulances.forEach(amb => {
      if (amb.vehicleImei) {
        ambulanceMap.set(amb.vehicleImei, amb);
      }
    });
    
    return gpsData
      .filter(item => item.lat && item.lng)
      .map(item => {
        const imei = item.imei || item.vehicleImei || '';
        const dbAmbulance = ambulanceMap.get(imei);
        
        // Use database data for status, driver, and other info, GPS data for location and movement
        return {
          id: dbAmbulance?.id || item.id || `gps-${imei}`,
          vehicleImei: imei,
          callSign: dbAmbulance?.callSign || item.callSign || item.name || imei || 'Unknown',
          plateNumber: dbAmbulance?.plateNumber || item.plateNumber || item.plate || 'N/A',
          type: dbAmbulance?.type || item.type || 'BASIC',
          status: dbAmbulance?.status || item.status || 'AVAILABLE', // Use DB status, never infer from speed
          latitude: parseFloat(item.lat) || parseFloat(item.latitude),
          longitude: parseFloat(item.lng) || parseFloat(item.longitude),
          speed: item.speed ? parseFloat(item.speed) : undefined,
          direction: item.direction || item.course || item.angle,
          address: item.address || item.location_address || dbAmbulance?.currentLocationAddress,
          lastUpdate: item.timestamp ? new Date(item.timestamp) : (dbAmbulance?.updatedAt ? new Date(dbAmbulance.updatedAt) : new Date()),
          fuelLevel: dbAmbulance?.fuelLevel || item.fuelLevel || item.fuel,
          engineStatus: item.engineStatus || item.ignition,
          accuracy: item.accuracy,
          driver: dbAmbulance?.driver, // Get driver from database
        };
      });
  };

  // Map regular Ambulance data to AmbulanceGPSData
  const mapAmbulancesToGPS = (ambulances: Ambulance[]): AmbulanceGPSData[] => {
    return ambulances
      .filter(amb => amb.currentLocationLat && amb.currentLocationLng)
      .map(amb => ({
        id: amb.id,
        vehicleImei: amb.vehicleImei,
        callSign: amb.callSign,
        plateNumber: amb.plateNumber,
        type: amb.type,
        status: amb.status,
        latitude: amb.currentLocationLat!,
        longitude: amb.currentLocationLng!,
        address: amb.currentLocationAddress,
        lastUpdate: amb.updatedAt ? new Date(amb.updatedAt) : new Date(),
        fuelLevel: amb.fuelLevel,
        driver: amb.driver,
      }));
  };


  // Apply filters to ambulance data
  const filteredData = useCallback(() => {
    let filtered = [...ambulanceData];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(amb => filters.status!.includes(amb.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(amb => filters.type!.includes(amb.type));
    }

    if (filters.hasDriver !== undefined) {
      filtered = filtered.filter(amb => filters.hasDriver ? !!amb.driver : !amb.driver);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(amb => 
        amb.callSign.toLowerCase().includes(query) ||
        amb.plateNumber.toLowerCase().includes(query) ||
        amb.vehicleImei.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [ambulanceData, filters]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Always refresh both queries to ensure data is synced
    await Promise.all([
      ambulancesQuery.refetch(),
      useGPSAPI ? gpsQuery.refetch() : Promise.resolve(),
    ]);
  }, [useGPSAPI, gpsQuery, ambulancesQuery]);

  // Get stats about tracked ambulances
  const getStats = useCallback(() => {
    const data = filteredData();
    return {
      total: data.length,
      available: data.filter(a => a.status === 'AVAILABLE').length,
      inUse: data.filter(a => a.status === 'IN_USE').length,
      maintenance: data.filter(a => a.status === 'MAINTENANCE').length,
      outOfService: data.filter(a => a.status === 'OUT_OF_SERVICE').length,
      withDriver: data.filter(a => a.driver).length,
      withoutDriver: data.filter(a => !a.driver).length,
    };
  }, [filteredData]);

  // Calculate next refresh time
  const getNextRefreshTime = useCallback(() => {
    if (!autoRefresh) return null;
    return new Date(lastUpdateTime.getTime() + refreshInterval);
  }, [autoRefresh, lastUpdateTime, refreshInterval]);

  // Get seconds until next refresh
  const getSecondsUntilRefresh = useCallback(() => {
    const nextRefresh = getNextRefreshTime();
    if (!nextRefresh) return null;
    return Math.max(0, Math.floor((nextRefresh.getTime() - Date.now()) / 1000));
  }, [getNextRefreshTime]);

  return {
    ambulances: filteredData(),
    allAmbulances: ambulanceData,
    isLoading: useGPSAPI 
      ? (gpsQuery.isLoading || ambulancesQuery.isLoading)
      : ambulancesQuery.isLoading,
    isRefetching: useGPSAPI
      ? (gpsQuery.isRefetching || ambulancesQuery.isRefetching)
      : ambulancesQuery.isRefetching,
    error: useGPSAPI 
      ? (gpsQuery.error || ambulancesQuery.error)
      : ambulancesQuery.error,
    lastUpdateTime,
    nextRefreshTime: getNextRefreshTime(),
    secondsUntilRefresh: getSecondsUntilRefresh(),
    refresh,
    stats: getStats(),
  };
};

