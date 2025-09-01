import { FilterField } from '../../../components/common/FilterComponents';
import { HospitalFilters } from '../../../services/hospitalService';

/**
 * Hospital filter field configuration
 */
export const hospitalFilterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'AVAILABLE', label: 'Available' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'LIMITED', label: 'Limited' },
      { value: 'CRITICAL', label: 'Critical' },
      { value: 'OFFLINE', label: 'Offline' },
    ],
  },
  {
    key: 'cluster',
    label: 'Cluster',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Clusters' },
      { value: 'Jazan', label: 'Jazan' },
    ],
  },
  {
    key: 'hasStemiService',
    label: 'STEMI Service',
    type: 'boolean',
    gridSize: 4,
  },
  {
    key: 'hasStrokeService',
    label: 'Stroke Service',
    type: 'boolean',
    gridSize: 4,
  },
  {
    key: 'hasTraumaService',
    label: 'Trauma Service',
    type: 'boolean',
    gridSize: 4,
  },
];

/**
 * Convert HospitalFilters to generic filter values
 */
export const hospitalFiltersToValues = (filters: HospitalFilters): Record<string, any> => ({
  status: filters.status || '',
  cluster: filters.cluster || '',
  hasStemiService: filters.hasStemiService,
  hasStrokeService: filters.hasStrokeService,
  hasTraumaService: filters.hasTraumaService,
});

/**
 * Convert generic filter values to HospitalFilters
 */
export const valuesToHospitalFilters = (values: Record<string, any>): HospitalFilters => ({
  status: values.status || '',
  cluster: values.cluster || '',
  hasStemiService: values.hasStemiService,
  hasStrokeService: values.hasStrokeService,
  hasTraumaService: values.hasTraumaService,
});
