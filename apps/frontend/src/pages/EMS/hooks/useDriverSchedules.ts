import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emsService } from '../services/emsService';
import { CreateDriverScheduleDto, UpdateDriverScheduleDto } from '../types/ems';

export const useDriverSchedules = () => {
  const queryClient = useQueryClient();

  const query = useQuery(
    'driver-schedules',
    () => emsService.getDriverSchedules(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const activeQuery = useQuery(
    'active-schedules',
    () => emsService.getActiveSchedules(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds for active schedules
    }
  );

  const createMutation = useMutation(
    (data: CreateDriverScheduleDto) => emsService.createDriverSchedule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateDriverScheduleDto }) =>
      emsService.updateDriverSchedule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => emsService.deleteDriverSchedule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const startBreakMutation = useMutation(
    (id: string) => emsService.startDriverBreak(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  const endBreakMutation = useMutation(
    (id: string) => emsService.endDriverBreak(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('driver-schedules');
        queryClient.invalidateQueries('active-schedules');
      },
    }
  );

  return {
    schedules: query.data || [],
    activeSchedules: activeQuery.data || [],
    isLoading: query.isLoading || activeQuery.isLoading,
    error: query.error || activeQuery.error,
    createSchedule: createMutation.mutateAsync,
    updateSchedule: updateMutation.mutateAsync,
    deleteSchedule: deleteMutation.mutateAsync,
    startBreak: startBreakMutation.mutateAsync,
    endBreak: endBreakMutation.mutateAsync,
  };
};
