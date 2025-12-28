import { useMutation, useQueryClient } from 'react-query';
import { bedService, BedListItem, BedStatus, Bed, GetBedsParams } from '../services/bedService';
import { useSnackbar } from 'notistack';

interface UpdateBedVariables {
  bedId: string;
  status: BedStatus;
  reason?: string;
  notes?: string;
}

interface CreateBedVariables {
  unitId: string;
  bedNumber: string;
  location?: string;
  notes?: string;
  isOperational?: boolean;
}

export const useBedMutations = (
  bedFilters?: GetBedsParams,
) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const updateBedMutation = useMutation(
    (variables: UpdateBedVariables) =>
      bedService.updateBedStatus(variables.bedId, variables.status, variables.reason, variables.notes),
    {
      onMutate: async (variables) => {
        await queryClient.cancelQueries(['beds', bedFilters]);
        await queryClient.cancelQueries(['bed', variables.bedId]);

        const previousBeds = queryClient.getQueryData<BedListItem[]>(['beds', bedFilters]);
        const previousBed = queryClient.getQueryData<Bed>(['bed', variables.bedId]);

        if (previousBeds) {
          queryClient.setQueryData<BedListItem[]>(['beds', bedFilters], (old) => {
            if (!old) return [];
            return old.map(bed =>
              bed.id === variables.bedId ? { ...bed, status: variables.status } : bed
            );
          });
        }

        if (previousBed) {
          queryClient.setQueryData<Bed>(['bed', variables.bedId], (old) => {
            if (!old) return previousBed;
            return { ...old, status: variables.status };
          });
        }

        return { previousBeds, previousBed };
      },
      onError: (error: any, variables, context) => {
        if (context?.previousBeds) {
          queryClient.setQueryData(['beds', bedFilters], context.previousBeds);
        }
        if (context?.previousBed) {
          queryClient.setQueryData(['bed', variables.bedId], context.previousBed);
        }
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update bed status';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      },
      onSuccess: () => {
        enqueueSnackbar('Bed status updated successfully', { variant: 'success' });
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries(['beds']);
        queryClient.invalidateQueries(['bedStats']);
        queryClient.invalidateQueries(['bed', variables.bedId]);
      },
    }
  );

  const createBedMutation = useMutation(
    (variables: CreateBedVariables) => bedService.createBed(variables),
    {
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['beds', bedFilters]);

        // Snapshot previous value
        const previousBeds = queryClient.getQueryData<BedListItem[]>(['beds', bedFilters]);

        // We can't optimistically add because we don't have the full bed data yet
        // But we can prepare the cache

        return { previousBeds };
      },
      onError: (error: any, _variables: CreateBedVariables, context: { previousBeds?: BedListItem[] } | undefined) => {
        // Rollback if needed
        if (context?.previousBeds) {
          queryClient.setQueryData(['beds', bedFilters], context.previousBeds);
        }
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create bed';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      },
      onSuccess: (data: Bed) => {
        enqueueSnackbar('Bed created successfully', { variant: 'success' });
        
        // Optimistically add the new bed to the list
        queryClient.setQueryData<BedListItem[]>(['beds', bedFilters], (old) => {
          if (!old) return [];
          const newBedListItem: BedListItem = {
            id: data.id,
            bedNumber: data.bedNumber,
            status: data.status,
            isOperational: data.isOperational,
            unitName: data.unit.name,
            hospital: data.hospital,
            currentPatientName: data.currentPatient?.name,
          };
          // Add to the beginning and sort
          const updated = [newBedListItem, ...old];
          return updated.sort((a, b) =>
            a.unitName.localeCompare(b.unitName) || a.bedNumber.localeCompare(b.bedNumber)
          );
        });
      },
      onSettled: () => {
        // Always refetch to ensure consistency
        queryClient.invalidateQueries(['beds']);
        queryClient.invalidateQueries(['bedStats']);
      },
    }
  );

  const deleteBedMutation = useMutation(
    (bedId: string) => bedService.deleteBed(bedId),
    {
      onMutate: async (bedId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['beds', bedFilters]);
        await queryClient.cancelQueries(['bed', bedId]);

        // Snapshot previous values
        const previousBeds = queryClient.getQueryData<BedListItem[]>(['beds', bedFilters]);
        const previousBed = queryClient.getQueryData<Bed>(['bed', bedId]);

        // Optimistically remove bed from list
        if (previousBeds) {
          queryClient.setQueryData<BedListItem[]>(['beds', bedFilters], (old) => {
            if (!old) return [];
            return old.filter(bed => bed.id !== bedId);
          });
        }

        return { previousBeds, previousBed };
      },
      onError: (error: any, bedId, context) => {
        // Rollback on error
        if (context?.previousBeds) {
          queryClient.setQueryData(['beds', bedFilters], context.previousBeds);
        }
        if (context?.previousBed) {
          queryClient.setQueryData(['bed', bedId], context.previousBed);
        }
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete bed';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      },
      onSuccess: () => {
        enqueueSnackbar('Bed deleted successfully', { variant: 'success' });
      },
      onSettled: (bedId) => {
        // Always refetch to ensure consistency
        queryClient.invalidateQueries(['beds']);
        queryClient.invalidateQueries(['bedStats']);
        queryClient.invalidateQueries(['bed', bedId]);
      },
    }
  );

  return {
    updateBed: updateBedMutation.mutateAsync,
    updateBedLoading: updateBedMutation.isLoading,
    createBed: createBedMutation.mutateAsync,
    createBedLoading: createBedMutation.isLoading,
    deleteBed: deleteBedMutation.mutateAsync,
    deleteBedLoading: deleteBedMutation.isLoading,
  };
};

