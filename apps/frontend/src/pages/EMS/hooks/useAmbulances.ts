import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emsService } from '../services/emsService';
import { CreateAmbulanceDto, UpdateAmbulanceDto, AmbulanceFilter } from '../types/ems';

export const useAmbulances = (filter?: AmbulanceFilter) => {
  const queryClient = useQueryClient();

  const query = useQuery(
    ['ambulances', filter],
    () => emsService.getAmbulances(filter),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const createMutation = useMutation(
    (data: CreateAmbulanceDto) => emsService.createAmbulance(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulances');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateAmbulanceDto }) =>
      emsService.updateAmbulance(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulances');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => emsService.deleteAmbulance(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulances');
      },
    }
  );

  const updateLocationMutation = useMutation(
    ({ vehicleImei, lat, lng, address }: { vehicleImei: string; lat: number; lng: number; address?: string }) =>
      emsService.updateAmbulanceLocation(vehicleImei, lat, lng, address),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulances');
      },
    }
  );


  return {
    ambulances: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAmbulance: createMutation.mutateAsync,
    updateAmbulance: updateMutation.mutateAsync,
    deleteAmbulance: deleteMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
  };
};
