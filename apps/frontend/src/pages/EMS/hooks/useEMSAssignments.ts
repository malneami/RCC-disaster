import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emsService } from '../services/emsService';
import { CreateEMSAssignmentDto, UpdateEMSAssignmentDto, AssignmentFilter } from '../types/ems';

export const useEMSAssignments = (filter?: AssignmentFilter) => {
  const queryClient = useQueryClient();

  const query = useQuery(
    ['ems-assignments', filter],
    () => emsService.getEMSAssignments(filter),
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );

  const activeQuery = useQuery(
    'active-assignments',
    () => emsService.getActiveAssignments(),
    {
      refetchInterval: 15000, // Refetch every 15 seconds for active assignments
    }
  );

  const createMutation = useMutation(
    (data: CreateEMSAssignmentDto) => emsService.createEMSAssignment(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateEMSAssignmentDto }) =>
      emsService.updateEMSAssignment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => emsService.deleteEMSAssignment(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const startAssignmentMutation = useMutation(
    (id: string) => emsService.startAssignment(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const markArrivedMutation = useMutation(
    (id: string) => emsService.markArrived(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const loadPatientMutation = useMutation(
    (id: string) => emsService.loadPatient(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const markDepartedMutation = useMutation(
    (id: string) => emsService.markDeparted(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  const completeAssignmentMutation = useMutation(
    (id: string) => emsService.completeAssignment(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ems-assignments');
        queryClient.invalidateQueries('active-assignments');
      },
    }
  );

  return {
    assignments: query.data || [],
    activeAssignments: activeQuery.data || [],
    isLoading: query.isLoading || activeQuery.isLoading,
    error: query.error || activeQuery.error,
    createAssignment: createMutation.mutateAsync,
    updateAssignment: updateMutation.mutateAsync,
    deleteAssignment: deleteMutation.mutateAsync,
    startAssignment: startAssignmentMutation.mutateAsync,
    markArrived: markArrivedMutation.mutateAsync,
    loadPatient: loadPatientMutation.mutateAsync,
    markDeparted: markDepartedMutation.mutateAsync,
    completeAssignment: completeAssignmentMutation.mutateAsync,
  };
};
