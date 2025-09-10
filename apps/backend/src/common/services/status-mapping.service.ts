import { Injectable } from '@nestjs/common';
import { TicketStatus, AssignmentStatus } from '@prisma/client';

@Injectable()
export class StatusMappingService {
  /**
   * Maps EMS Assignment Status to Ticket Status
   * This ensures immediate synchronization between EMS operations and ticket status
   */
  static mapEMSToTicket(emsStatus: AssignmentStatus): TicketStatus {
    switch (emsStatus) {
      case 'EMS_CONTACT':
        return TicketStatus.ASSIGNED;
      
      case 'EMS_ARRIVAL':
        return TicketStatus.ASSIGNED; // Still assigned, but EMS has arrived
      
      case 'DEPARTED':
        return TicketStatus.IN_TRANSPORT; // Patient is being transported
      
      case 'ARRIVED':
        return TicketStatus.COMPLETED; // Transport completed
      
      case 'CANCELLED':
        return TicketStatus.CANCELLED;
      
      default:
        throw new Error(`Unknown EMS status: ${emsStatus}`);
    }
  }

  /**
   * Maps Ticket Status to EMS Assignment Status
   * Used for reverse mapping when needed
   */
  static mapTicketToEMS(ticketStatus: TicketStatus): AssignmentStatus | null {
    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return null; // No EMS status yet
      
      case TicketStatus.ASSIGNED:
        return 'EMS_CONTACT'; // Default EMS status for assigned tickets
      
      case TicketStatus.IN_TRANSPORT:
        return 'DEPARTED';
      
      case TicketStatus.COMPLETED:
        return 'ARRIVED';
      
      case TicketStatus.CANCELLED:
        return 'CANCELLED';
      
      default:
        throw new Error(`Unknown ticket status: ${ticketStatus}`);
    }
  }

  /**
   * Gets the display name for EMS status
   */
  static getEMSStatusDisplayName(emsStatus: AssignmentStatus): string {
    switch (emsStatus) {
      case 'EMS_CONTACT':
        return 'EMS Dispatched';
      
      case 'EMS_ARRIVAL':
        return 'EMS Arrived';
      
      case 'DEPARTED':
        return 'En Route';
      
      case 'ARRIVED':
        return 'Arrived at Destination';
      
      case 'CANCELLED':
        return 'Cancelled';
      
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets the color for EMS status display
   */
  static getEMSStatusColor(emsStatus: AssignmentStatus): string {
    switch (emsStatus) {
      case 'EMS_CONTACT':
        return '#ff9800'; // Orange - dispatched
      
      case 'EMS_ARRIVAL':
        return '#2196f3'; // Blue - arrived
      
      case 'DEPARTED':
        return '#9c27b0'; // Purple - in transport
      
      case 'ARRIVED':
        return '#4caf50'; // Green - completed
      
      case 'CANCELLED':
        return '#f44336'; // Red - cancelled
      
      default:
        return '#666666'; // Gray - unknown
    }
  }

  /**
   * Validates if an EMS status transition is allowed
   */
  static isValidEMSStatusTransition(
    currentStatus: AssignmentStatus | null,
    newStatus: AssignmentStatus
  ): boolean {
    // If no current status, any status is valid
    if (!currentStatus) {
      return true;
    }

    // Define allowed transitions
    const allowedTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
      'EMS_CONTACT': [
        'EMS_ARRIVAL',
        'DEPARTED',
        'CANCELLED'
      ],
      'EMS_ARRIVAL': [
        'DEPARTED',
        'CANCELLED'
      ],
      'DEPARTED': [
        'ARRIVED',
        'CANCELLED'
      ],
      'ARRIVED': [], // Terminal state
      'CANCELLED': [], // Terminal state
    };

    return allowedTransitions[currentStatus].includes(newStatus);
  }
}

