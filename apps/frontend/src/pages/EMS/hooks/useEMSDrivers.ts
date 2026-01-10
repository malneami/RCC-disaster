import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState } from 'react';
import { emsService } from '../services/emsService';

export interface EMSDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  hospitalId?: string;
  activeAssignment?: {
    id: string;
    status: string;
    ticket: {
      ticketNumber: string;
    };
  } | null;
}

export const useEMSDrivers = (initialOptions?: { pageSize?: number }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialOptions?.pageSize || 10);
  const [search, setSearch] = useState<string | undefined>(undefined);
  
  const query = useQuery(
    ['ems-drivers', page, pageSize, search],
    () => emsService.getEMSDrivers({ page, pageSize, search }),
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
    drivers: query.data?.data || [],
    total: query.data?.total || 0,
    page: query.data?.page || page,
    pageSize: query.data?.pageSize || pageSize,
    isLoading: query.isLoading,
    error: query.error,
    setPage,
    setPageSize,
    search,
    setSearch,
    createDriver: createDriverMutation.mutateAsync,
    updateDriver: updateDriverMutation.mutateAsync,
    deleteDriver: deleteDriverMutation.mutateAsync,
    isCreating: createDriverMutation.isLoading,
    isUpdating: updateDriverMutation.isLoading,
    isDeleting: deleteDriverMutation.isLoading,
  };
};

