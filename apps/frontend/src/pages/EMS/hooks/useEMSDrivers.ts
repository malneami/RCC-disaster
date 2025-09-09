import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emsService } from '../services/emsService';

export interface EMSDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  hospitalId?: string;
}

export const useEMSDrivers = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery(
    'ems-drivers',
    () => emsService.getEMSDrivers(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );

  const createDriverMutation = useMutation(
    (data: any) => emsService.createDriver(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-drivers');
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const updateDriverMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => emsService.updateDriver(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-drivers');
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const deleteDriverMutation = useMutation(
    (id: string) => emsService.deleteDriver(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-drivers');
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  return {
    drivers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createDriver: createDriverMutation.mutateAsync,
    updateDriver: updateDriverMutation.mutateAsync,
    deleteDriver: deleteDriverMutation.mutateAsync,
    isCreating: createDriverMutation.isLoading,
    isUpdating: updateDriverMutation.isLoading,
    isDeleting: deleteDriverMutation.isLoading,
  };
};

