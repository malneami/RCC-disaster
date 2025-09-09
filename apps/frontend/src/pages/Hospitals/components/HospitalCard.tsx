import React from 'react';
import { Hospital } from '../../../services/hospitalService';
import { getStatusColor, getAvailabilityPercentage, getAvailabilityColor } from '../utils/hospitalUtils';
import EntityCard, { CardField, CardAction } from '../../../components/Common/EntityCard';

interface HospitalCardProps {
  hospital: Hospital;
  onUpdateCapacity: (hospital: Hospital) => void;
  onViewDashboard: (hospitalId: string) => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ 
  hospital, 
  onUpdateCapacity, 
  onViewDashboard 
}) => {
  const availabilityPercentage = getAvailabilityPercentage(hospital);
  const availabilityColor = getAvailabilityColor(availabilityPercentage);

  const services = [];
  if (hospital.hasStemiService) services.push('STEMI');
  if (hospital.hasStrokeService) services.push('Stroke');
  if (hospital.hasTraumaService) services.push('Trauma');

  const fields: CardField[] = [
    {
      key: 'address',
      label: 'Address',
      value: hospital.address || 'No address',
      type: 'text',
    },
    {
      key: 'availability',
      label: 'Availability',
      value: availabilityPercentage,
      type: 'percentage',
      color: availabilityColor,
    },
    {
      key: 'services',
      label: 'Services',
      value: services,
      type: 'services',
    },
    {
      key: 'cluster',
      label: 'Cluster',
      value: hospital.cluster,
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      value: hospital.status,
      type: 'status',
      color: getStatusColor(hospital.status),
    },
  ];

  const actions: CardAction[] = [
    {
      label: 'Update Capacity',
      onClick: () => onUpdateCapacity(hospital),
      variant: 'text',
      size: 'small',
    },
    {
      label: 'View Dashboard',
      onClick: () => onViewDashboard(hospital.id),
      variant: 'text',
      size: 'small',
    },
  ];

  return (
    <EntityCard
      title={hospital.name}
      fields={fields}
      actions={actions}
      gridSize={{ xs: 12, sm: 6, md: 4 }}
      minHeight={320}
    />
  );
};

export default HospitalCard;
