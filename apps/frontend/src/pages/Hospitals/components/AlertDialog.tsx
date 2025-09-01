import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { CapacityAlert } from '../../../services/hospitalService';
import AlertDisplay, { AlertItem } from '../../../components/common/AlertDisplay';

interface AlertDialogProps {
  open: boolean;
  alerts: CapacityAlert[];
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, alerts, onClose }) => {
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Capacity Alerts ({alerts.length})
      </DialogTitle>
      <DialogContent>
        <AlertDisplay
          alerts={alertItems}
          variant="list"
          maxHeight="60vh"
          emptyMessage="All hospitals have sufficient bed availability."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
