import { Ticket } from '../../../services/ticketService';
import { HospitalTicket } from '../../../services/hospitalService';

// Unified ticket interface that combines both types
export interface UnifiedTicket {
  id: string;
  type: 'TRANSFER' | 'HOSPITAL';
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  
  // Transfer ticket specific fields
  ticketNumber?: string;
  patientId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  pathway?: string;
  chiefComplaint?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  isEmergency?: boolean;
  requiresBlood?: boolean;
  requiresSpecialist?: boolean;
  
  // Hospital ticket specific fields
  hospitalId?: string;
  ticketType?: string;
  assignedToId?: string;
  
  // Common patient information
  patient?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mrn?: string;
  };
  
  // Hospital information
  originHospital?: {
    name: string;
    status: string;
  };
  destinationHospital?: {
    name: string;
    status: string;
  };
  
  // User information
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

// Ticket filter options
export interface TicketFilterOptions {
  status?: string[];
  priority?: string[];
  type?: string[];
  pathway?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Ticket sort options
export type TicketSortOption = 
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'priority_desc'
  | 'priority_asc'
  | 'status_asc'
  | 'status_desc';

// Helper function to convert tickets to unified format
export const convertToUnifiedTicket = (ticket: Ticket | HospitalTicket): UnifiedTicket => {
  if ('ticketNumber' in ticket) {
    // This is a transfer ticket
    return {
      id: ticket.id,
      type: 'TRANSFER',
      title: `Transfer: ${ticket.patient?.firstName} ${ticket.patient?.lastName}`,
      description: ticket.chiefComplaint,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      ticketNumber: ticket.ticketNumber,
      patientId: ticket.patientId,
      originHospitalId: ticket.originHospitalId,
      destinationHospitalId: ticket.destinationHospitalId,
      pathway: ticket.pathway,
      chiefComplaint: ticket.chiefComplaint,
      estimatedArrival: ticket.estimatedArrival,
      actualArrival: ticket.actualArrival,
      transportMode: ticket.transportMode,
      emsUnit: ticket.emsUnit,
      isEmergency: ticket.isEmergency,
      requiresBlood: ticket.requiresBlood,
      requiresSpecialist: ticket.requiresSpecialist,
      patient: ticket.patient,
      originHospital: ticket.originHospital,
      destinationHospital: ticket.destinationHospital,
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
    };
  } else {
    // This is a hospital ticket
    return {
      id: ticket.id,
      type: 'HOSPITAL',
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      hospitalId: ticket.hospitalId,
      ticketType: ticket.type,
      assignedToId: ticket.assignedToId,
    };
  }
};
