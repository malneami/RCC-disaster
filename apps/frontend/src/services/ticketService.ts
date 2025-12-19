import { apiClient } from './apiClient';
import { autoCaseCreationService } from './autoCaseCreationService';
import { patientService } from './patientService';

export interface Vitals {
  bloodPressure?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}


export interface Diagnostics {
  ecg?: string;
  labResults?: string;
  ctScan?: string;
  otherTests?: string;
}

export interface RequiredResources {
  icu?: boolean;
  ventilator?: boolean;
  cardiology?: boolean;
  neurology?: boolean;
  trauma?: boolean;
  nicu?: boolean;
  picu?: boolean;
}

export interface CreateTicketData {
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  priority: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
  pathway: string;
  triageTime?: string;
  symptomOnsetTime?: string;
  vitals?: Vitals;
  diagnostics?: Diagnostics;
  treatmentPlan?: string;
  emsContactTime?: string;
  transportMode?: string;
  emsUnit?: string;
  notes?: string;
  isEmergency?: boolean;
  requiresBlood?: boolean;
  requiresSpecialist?: boolean;
  requiredResources?: RequiredResources;
  assignedToId?: string;
}

export interface UpdateTicketData {
  destinationHospitalId?: string;
  priority?: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
  pathway?: string;
  triageTime?: string;
  symptomOnsetTime?: string;
  vitals?: Vitals;
  diagnostics?: Diagnostics;
  treatmentPlan?: string;
  emsContactTime?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  notes?: string;
  isEmergency?: boolean;
  requiresBlood?: boolean;
  requiresSpecialist?: boolean;
  requiredResources?: RequiredResources;
  assignedToId?: string;
}

export interface TicketFilter {
  status?: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';
  priority?: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
  pathway?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  emsStatus?: string; 
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  priority: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';
  pathway: string;
  chiefComplaint?: string;
  triageTime?: string;
  symptomOnsetTime?: string;
  symptoms?: string;
  vitals?: string;
  diagnostics?: string;
  treatmentPlan?: string;
  emsContactTime?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  notes?: string;
  emsAssignmentStatus?: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  emsStatusUpdatedAt?: string;
  emsStatusUpdatedBy?: string;
  isEmergency: boolean;
  requiresBlood: boolean;
  requiresSpecialist: boolean;
  requiredResources?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mrn?: string;
  };
  originHospital: {
    name: string;
    status: string;
  };
  destinationHospital?: {
    name: string;
    status: string;
  };
  createdBy: {
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
  emsStatusUpdatedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  acknowledgedBy?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  emsAssignments?: Array<{
    id: string;
    ticketId: string;
    ambulanceId?: string;
    driverId?: string;
    assignedAt: string;
    status: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
    emsContactTime?: string;
    actualArrivalTime?: string;
    journeyStartTime?: string;
    journeyEndTime?: string;
    distanceKm?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    ambulance?: {
      id: string;
      unitNumber: string;
      status: string;
    };
    driver?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
    };
    createdByUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  activities?: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export interface TicketStatistics {
  total: number;
  pending: number;
  assigned: number;
  inTransport: number;
  completed: number;
  cancelled: number;
}

export interface TicketPriorityStats {
  priority: string;
  _count: {
    priority: number;
  };
}

export interface TicketPathwayStats {
  pathway: string;
  _count: {
    pathway: number;
  };
}

export interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

class TicketService {
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const response = await apiClient.post('/tickets', data);
    const ticket = response.data;
    
    // Automatically create trauma, stroke, or STEMI case if pathway supports it
    try {
      if (autoCaseCreationService.supportsAutoCaseCreation(ticket.pathway)) {
        // Get patient data for case creation
        const patient = await patientService.getPatientById(ticket.patientId);
        
        // Create the appropriate case
        const caseResult = await autoCaseCreationService.createCaseFromTicket(
          ticket,
          patient,
          {
            triageTime: data.triageTime,
            symptomOnsetTime: data.symptomOnsetTime
          }
        );
        
        if (caseResult.success) {
          console.log(`✅ Auto-created ${caseResult.caseType} case: ${caseResult.caseId}`);
        } else {
          console.warn(`⚠️ Failed to auto-create case: ${caseResult.error}`);
        }
      }
    } catch (error) {
      // Don't fail ticket creation if case creation fails
      console.error('Error in automatic case creation:', error);
    }
    
    return ticket;
  }

  async getTickets(
    page = 1,
    limit = 10,
    filters?: TicketFilter
  ): Promise<TicketsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    const response = await apiClient.get(`/tickets?${params}`);
    return response.data;
  }

  async getTicket(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  }

  async getTicketById(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  }

  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}`, data);
    return response.data;
  }

  async updateTicketStatus(
    id: string,
    status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  }

  async assignTicket(id: string, assignedToId: string, notes?: string): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}/assign`, {
      assignedToId,
      notes,
    });
    return response.data;
  }

  async getStatistics(): Promise<TicketStatistics> {
    const response = await apiClient.get('/tickets/statistics');
    return response.data;
  }

  async getTicketsByPriority(): Promise<TicketPriorityStats[]> {
    const response = await apiClient.get('/tickets/statistics/priority');
    return response.data;
  }

  async getTicketsByPathway(): Promise<TicketPathwayStats[]> {
    const response = await apiClient.get('/tickets/statistics/pathway');
    return response.data;
  }

  // Update EMS status for a ticket
  async updateEMSStatus(
    ticketId: string, 
    emsStatus: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED',
    notes?: string
  ): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${ticketId}/ems-status`, {
      emsStatus,
      notes,
    });
    return response.data;
  }

  // Acknowledge a critical case ticket
  async acknowledgeTicket(ticketId: string): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${ticketId}/acknowledge`);
    return response.data;
  }
}

export const ticketService = new TicketService();
