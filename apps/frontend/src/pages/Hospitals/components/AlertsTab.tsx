import React from 'react';
import { CapacityAlert } from '../../../services/hospitalService';
import AlertDisplay, { AlertItem } from '../../../components/common/AlertDisplay';

interface AlertsTabProps {
  alerts: CapacityAlert[];
}

const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  const alertItems: AlertItem[] = alerts.map(alert => ({
    id: alert.hospitalId,
    title: alert.hospitalName,
    message: `${alert.availabilityPercentage}% availability (${alert.availableBeds}/${alert.totalBeds} beds)`,
    type: alert.type as 'CRITICAL' | 'WARNING',
    metadata: {
      'Available Beds': alert.availableBeds,
      'Total Beds': alert.totalBeds,
      'Availability': `${alert.availabilityPercentage}%`,
    },
  }));

  return (
    <AlertDisplay
      alerts={alertItems}
      title="Capacity Alerts"
      showCount={true}
      variant="cards"
    />
  );
};

export default AlertsTab;
