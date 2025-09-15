export type EMSAssignmentStatus = 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';

export interface EMSStatusInfo {
  displayName: string;
  color: string;
  icon: string;
  description: string;
}

export const getEMSStatusInfo = (status: EMSAssignmentStatus): EMSStatusInfo => {
  switch (status) {
    case 'EMS_CONTACT':
      return {
        displayName: 'EMS Dispatched',
        color: '#ff9800', // Orange
        icon: '📞',
        description: 'EMS unit has been dispatched and is en route to scene'
      };
    
    case 'EMS_ARRIVAL':
      return {
        displayName: 'EMS Arrived',
        color: '#2196f3', // Blue
        icon: '🚑',
        description: 'EMS unit has arrived at the scene'
      };
    
    case 'DEPARTED':
      return {
        displayName: 'En Route',
        color: '#9c27b0', // Purple
        icon: '🚗',
        description: 'Patient loaded and en route to destination'
      };
    
    case 'ARRIVED':
      return {
        displayName: 'Arrived',
        color: '#4caf50', // Green
        icon: '🏥',
        description: 'Arrived at destination hospital'
      };
    
    case 'CANCELLED':
      return {
        displayName: 'Cancelled',
        color: '#f44336', // Red
        icon: '❌',
        description: 'Transport cancelled'
      };
    
    default:
      return {
        displayName: 'Unknown',
        color: '#666666', // Gray
        icon: '❓',
        description: 'Status unknown'
      };
  }
};

export const getEMSStatusColor = (status: EMSAssignmentStatus): string => {
  return getEMSStatusInfo(status).color;
};

export const getEMSStatusDisplayName = (status: EMSAssignmentStatus): string => {
  return getEMSStatusInfo(status).displayName;
};

export const isValidEMSStatusTransition = (
  currentStatus: EMSAssignmentStatus | null,
  newStatus: EMSAssignmentStatus
): boolean => {
  // If no current status, any status is valid
  if (!currentStatus) {
    return true;
  }

  // Define allowed transitions
  const allowedTransitions: Record<EMSAssignmentStatus, EMSAssignmentStatus[]> = {
    'EMS_CONTACT': ['EMS_ARRIVAL', 'DEPARTED', 'CANCELLED'],
    'EMS_ARRIVAL': ['DEPARTED', 'CANCELLED'],
    'DEPARTED': ['ARRIVED', 'CANCELLED'],
    'ARRIVED': [], // Terminal state
    'CANCELLED': [], // Terminal state
  };

  return allowedTransitions[currentStatus].includes(newStatus);
};

export const getNextAvailableEMSStatuses = (
  currentStatus: EMSAssignmentStatus | null
): EMSAssignmentStatus[] => {
  if (!currentStatus) {
    return ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED', 'ARRIVED', 'CANCELLED'];
  }

  const allowedTransitions: Record<EMSAssignmentStatus, EMSAssignmentStatus[]> = {
    'EMS_CONTACT': ['EMS_ARRIVAL', 'DEPARTED', 'CANCELLED'],
    'EMS_ARRIVAL': ['DEPARTED', 'CANCELLED'],
    'DEPARTED': ['ARRIVED', 'CANCELLED'],
    'ARRIVED': [], // Terminal state
    'CANCELLED': [], // Terminal state
  };

  return allowedTransitions[currentStatus];
};



