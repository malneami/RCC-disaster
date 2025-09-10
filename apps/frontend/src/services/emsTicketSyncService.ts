import { ticketService } from './ticketService';

// Mapping between EMS assignment status and ticket status
export const EMS_TICKET_STATUS_MAPPING = {
  'EMS_CONTACT': 'ASSIGNED',
  'EMS_ARRIVAL': 'IN_TRANSPORT', 
  'DEPARTED': 'IN_TRANSPORT',
  'ARRIVED': 'COMPLETED',
  'CANCELLED': 'CANCELLED',
} as const;

export type EMSAssignmentStatus = keyof typeof EMS_TICKET_STATUS_MAPPING;
export type TicketStatus = typeof EMS_TICKET_STATUS_MAPPING[EMSAssignmentStatus];

export interface EMSStatusUpdate {
  assignmentId: string;
  ticketId: string;
  emsStatus: EMSAssignmentStatus;
  ticketStatus: TicketStatus;
  notes?: string;
  timestamp?: string;
}

class EMSTicketSyncService {
  /**
   * Updates ticket status when EMS assignment status changes
   */
  async syncTicketStatusFromEMS(
    ticketId: string, 
    emsStatus: EMSAssignmentStatus, 
    notes?: string
  ): Promise<void> {
    try {
      const ticketStatus = EMS_TICKET_STATUS_MAPPING[emsStatus];
      
      if (!ticketStatus) {
        console.warn(`No ticket status mapping found for EMS status: ${emsStatus}`);
        return;
      }

      // Update the ticket status
      await ticketService.updateTicketStatus(ticketId, ticketStatus, notes);
      
      console.log(`Ticket ${ticketId} status updated to ${ticketStatus} from EMS status ${emsStatus}`);
    } catch (error) {
      console.error('Error syncing ticket status from EMS:', error);
      throw error;
    }
  }

  /**
   * Updates EMS assignment status when ticket status changes
   */
  async syncEMSStatusFromTicket(
    assignmentId: string,
    ticketStatus: TicketStatus,
  ): Promise<void> {
    try {
      // Find the corresponding EMS status
      const emsStatus = Object.entries(EMS_TICKET_STATUS_MAPPING)
        .find(([_, ticketStatusValue]) => ticketStatusValue === ticketStatus)?.[0] as EMSAssignmentStatus;

      if (!emsStatus) {
        console.warn(`No EMS status mapping found for ticket status: ${ticketStatus}`);
        return;
      }

      // This would typically call an EMS service to update the assignment
      // For now, we'll just log the action
      console.log(`EMS assignment ${assignmentId} should be updated to ${emsStatus} from ticket status ${ticketStatus}`);
      
      // TODO: Implement EMS assignment update when EMS service is available
      // await emsService.updateAssignmentStatus(assignmentId, emsStatus, notes);
    } catch (error) {
      console.error('Error syncing EMS status from ticket:', error);
      throw error;
    }
  }

  /**
   * Gets the corresponding ticket status for an EMS status
   */
  getTicketStatusForEMS(emsStatus: EMSAssignmentStatus): TicketStatus {
    return EMS_TICKET_STATUS_MAPPING[emsStatus];
  }

  /**
   * Gets the corresponding EMS status for a ticket status
   */
  getEMSStatusForTicket(ticketStatus: TicketStatus): EMSAssignmentStatus | null {
    const entry = Object.entries(EMS_TICKET_STATUS_MAPPING)
      .find(([_, ticketStatusValue]) => ticketStatusValue === ticketStatus);
    return entry ? entry[0] as EMSAssignmentStatus : null;
  }

  /**
   * Checks if a status change should trigger synchronization
   */
  shouldSyncStatus(emsStatus: EMSAssignmentStatus, ticketStatus: TicketStatus): boolean {
    const expectedTicketStatus = this.getTicketStatusForEMS(emsStatus);
    return expectedTicketStatus !== ticketStatus;
  }
}

export const emsTicketSyncService = new EMSTicketSyncService();
