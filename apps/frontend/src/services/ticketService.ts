import { apiClient } from './apiClient';
import { autoCaseCreationService } from './autoCaseCreationService';
import { patientService } from './patientService';
import { bedService } from '../pages/Beds/services/bedService';
import { BedAssignmentFormData } from '../pages/Trauma/types/traumaTypes';

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

export interface ObMaternalData {
  gestationalAgeWeeks: number;
  gravida?: number;
  para?: number;
  abortions?: number;
  activationLevel: 'MATERNAL_RED' | 'MATERNAL_ORANGE';
  expectedDeliveryMode?: 'VAGINAL' | 'CESAREAN' | 'PENDING';
  ambulanceType?: 'BLS' | 'ALS' | 'AIR';
}

export interface NeurosurgicalData {
  /** Clinical neuro color — independent of ticket Priority */
  severity: 'RED' | 'ORANGE';
}

export interface CreateTicketData {
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  priority: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
  pathway: string;
  obMaternalData?: ObMaternalData;
  neurosurgicalData?: NeurosurgicalData;
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
  bedAssignment?: BedAssignmentFormData;
}

export interface UpdateTicketData {
  originHospitalId?: string;
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
  bedAssignment?: BedAssignmentFormData;
  neurosurgicalData?: NeurosurgicalData;
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
  traumaCases?: Array<{
    id: string;
    patientId: string;
    originHospitalId: string;
    destinationHospitalId?: string;
    currentStatus: string;
    createdAt: string;
    updatedAt: string;
    ticketId: string;
    assignedBed?: {
      id: string;
      bedNumber: string;
      status: string;
      location?: string;
      isOperational: boolean;
      unit: {
        id: string;
        name: string;
        bedType: string;
      };
      hospital: {
        id: string;
        name: string;
      };
      currentPatient?: {
        id: string;
        name: string;
        nationalId?: string;
        age?: number;
        gender?: string;
        mrn?: string;
      };
    } | null;
  }>;
  strokeCases?: Array<{
    id: string;
    patientId: string;
    originHospitalId: string;
    destinationHospitalId?: string;
    currentStatus: string;
    createdAt: string;
    updatedAt: string;
    ticketId: string;
    assignedBed?: {
      id: string;
      bedNumber: string;
      status: string;
      location?: string;
      isOperational: boolean;
      unit: {
        id: string;
        name: string;
        bedType: string;
      };
      hospital: {
        id: string;
        name: string;
      };
      currentPatient?: {
        id: string;
        name: string;
        nationalId?: string;
        age?: number;
        gender?: string;
        mrn?: string;
      };
    } | null;
  }>;
  stemiCases?: Array<{
    id: string;
    patientId: string;
    originHospitalId: string;
    destinationHospitalId?: string;
    currentStatus: string;
    createdAt: string;
    updatedAt: string;
    ticketId: string;
    assignedBed?: {
      id: string;
      bedNumber: string;
      status: string;
      location?: string;
      isOperational: boolean;
      unit: {
        id: string;
        name: string;
        bedType: string;
      };
      hospital: {
        id: string;
        name: string;
      };
      currentPatient?: {
        id: string;
        name: string;
        nationalId?: string;
        age?: number;
        gender?: string;
        mrn?: string;
      };
    } | null;
  }>;
  neurosurgicalCases?: Array<{
    id: string;
    status: string;
    severity: string;
    activatedAt: string;
    createdAt: string;
    ticketId: string;
  }>;
  patientBeds?: Array<{
    id: string;
    bedNumber: string;
    status: string;
    location?: string;
    isOperational: boolean;
    unit: {
      id: string;
      name: string;
      bedType: string;
    };
    hospital: {
      id: string;
      name: string;
    };
    currentPatient?: {
      id: string;
      name: string;
      nationalId?: string;
      age?: number;
      gender?: string;
      mrn?: string;
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

export interface TicketAccessLog {
  id: string;
  ticketId: string;
  userId: string;
  accessType: string;
  accessMethod: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  ticket?: {
    id: string;
    ticketNumber: string;
    patientId: string;
    priority: string;
    status: string;
    pathway: string;
  };
}

class TicketService {
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const { obMaternalData, bedAssignment, neurosurgicalData, ...rest } = data;

    // Never send empty strings for date fields — Nest IsDateString rejects ""
    const ticketPayload: Record<string, unknown> = { ...rest };
    for (const key of ['emsContactTime', 'triageTime', 'symptomOnsetTime']) {
      const v = ticketPayload[key];
      if (v === '' || v === null || v === undefined) {
        delete ticketPayload[key];
      }
    }
    // bedAssignment / neurosurgicalData applied client-side after create

    const response = await apiClient.post('/tickets', ticketPayload);
    const ticket = response.data;
    
    let caseId: string | undefined;
    let caseType: 'TRAUMA' | 'STROKE' | 'STEMI' | undefined;
    
    // Automatically create trauma, stroke, STEMI, or neurosurgical case if pathway supports it
    try {
      if (autoCaseCreationService.supportsAutoCaseCreation(ticket.pathway)) {
        // Get patient data for case creation
        const patient = await patientService.getPatientById(ticket.patientId);
        
        // Create the appropriate case (without bed assignment - we'll handle that separately)
        const caseResult = await autoCaseCreationService.createCaseFromTicket(
          ticket,
          patient,
          {
            triageTime: data.triageTime,
            symptomOnsetTime: data.symptomOnsetTime
          },
          undefined,
          neurosurgicalData
            ? { severity: neurosurgicalData.severity }
            : undefined,
        );
        
        if (caseResult.success) {
          console.log(`✅ Auto-created ${caseResult.caseType} case: ${caseResult.caseId}`);
          caseId = caseResult.caseId;
          const caseTypeMap: Record<string, 'TRAUMA' | 'STROKE' | 'STEMI'> = {
            'trauma': 'TRAUMA',
            'stroke': 'STROKE',
            'stemi': 'STEMI',
          };
          caseType = caseResult.caseType ? caseTypeMap[caseResult.caseType] : undefined;
        } else {
          console.warn(`⚠️ Failed to auto-create case: ${caseResult.error}`);
        }
      }
    } catch (error) {
      // Don't fail ticket creation if case creation fails
      console.error('Error in automatic case creation:', error);
    }

    // Create OB Maternal Transfer when pathway is MATERNAL
    if (ticket.pathway === 'MATERNAL' && obMaternalData) {
      try {
        const { obMaternalTransferService } = await import('./obMaternalTransferService');
        await obMaternalTransferService.create({
          ticketId: ticket.id,
          patientId: ticket.patientId,
          referringFacilityId: ticket.originHospitalId,
          gestationalAgeWeeks: obMaternalData.gestationalAgeWeeks,
          gravida: obMaternalData.gravida,
          para: obMaternalData.para,
          activationLevel: obMaternalData.activationLevel,
          expectedDeliveryMode: obMaternalData.expectedDeliveryMode || 'PENDING',
          ambulanceType: obMaternalData.ambulanceType || 'ALS',
          destinationHospitalId: ticket.destinationHospitalId,
        });
        console.log('✅ Auto-created OB Maternal Transfer for ticket:', ticket.id);
      } catch (obError) {
        console.error('Error creating OB Maternal Transfer:', obError);
      }
    }
    
    if (bedAssignment && bedAssignment.bedId && ticket.patientId) {
      try {
        await bedService.assignBed(bedAssignment.bedId, {
          patientId: ticket.patientId,
          caseId: caseId,
          caseType: caseType,
          arrivalDate: bedAssignment.arrivalDate,
        });
        window.dispatchEvent(new CustomEvent('hospital-capacity-changed'));
      } catch (bedError: any) {
        console.error('Error assigning bed after ticket creation:', bedError);
        console.warn(`⚠️ Bed assignment failed: ${bedError?.response?.data?.message || bedError?.message || 'Unknown error'}`);
      }
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
    const { neurosurgicalData, bedAssignment, ...rest } = data;

    const ticketPayload: Record<string, unknown> = { ...rest };
    for (const key of ['emsContactTime', 'triageTime', 'symptomOnsetTime', 'actualArrival']) {
      const v = ticketPayload[key];
      if (v === '' || v === null || v === undefined) {
        delete ticketPayload[key];
      }
    }

    const response = await apiClient.put(`/tickets/${id}`, ticketPayload);
    const ticket = response.data as Ticket;

    // Sync clinical neuro severity onto NeurosurgicalCase (not ticket Priority)
    if (ticket.pathway === 'NEUROSURGICAL' && neurosurgicalData?.severity) {
      try {
        const { neurosurgicalService } = await import('./neurosurgicalService');
        const listed = await neurosurgicalService.list({ ticketId: id, limit: 1 });
        const existing = listed.items[0];
        if (existing) {
          if (existing.severity !== neurosurgicalData.severity) {
            await neurosurgicalService.update(existing.id, {
              severity: neurosurgicalData.severity,
              severityOverrideReason: 'Updated from ticket edit',
            });
          }
        } else {
          await neurosurgicalService.activateFromTicket(id, {
            triggerReason: 'OTHER',
            triggerReasonOther: 'Activated from ticket pathway',
            severity: neurosurgicalData.severity,
            severityOverrideReason: 'Selected at ticket edit',
          });
        }
      } catch (neuroError) {
        console.error('Error syncing neurosurgical severity on ticket update:', neuroError);
      }
    }

    // bedAssignment handled by caller (TicketViewPage) after update
    void bedAssignment;

    return ticket;
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

  async getStatistics(filters?: TicketFilter): Promise<TicketStatistics> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.pathway) params.append('pathway', filters.pathway);
      if (filters.originHospitalId) params.append('originHospitalId', filters.originHospitalId);
      if (filters.destinationHospitalId) params.append('destinationHospitalId', filters.destinationHospitalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.emsStatus) params.append('emsStatus', filters.emsStatus);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/tickets/statistics?${queryString}` : '/tickets/statistics';
    const response = await apiClient.get(url);
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

  async getRCCIncomingCases(): Promise<Ticket[]> {
    const response = await apiClient.get('/tickets/rcc/incoming-cases');
    return response.data;
  }

  async getAccessLogs(filters?: {
    page?: number;
    limit?: number;
    ticketId?: string;
    userId?: string;
    accessType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: TicketAccessLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.ticketId) params.append('ticketId', filters.ticketId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.accessType) params.append('accessType', filters.accessType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/tickets/access-logs?${params}`);
    return response.data;
  }

  async deleteTicket(id: string): Promise<{
    success: boolean;
    message: string;
    deletedTicket: Ticket;
    deletedEMSAssignments: number;
  }> {
    const response = await apiClient.delete(`/tickets/${id}`);
    return response.data;
  }
}

export const ticketService = new TicketService();
