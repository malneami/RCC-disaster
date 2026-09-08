import { apiClient } from './apiClient';

export type DisasterScope = 'INTERNAL' | 'EXTERNAL';

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  RTA_MCI: 'RTA/MCI (Mass Casualty)',
  CODE_YELLOW: 'Code Yellow',
  EARTHQUAKE: 'Earthquake',
  FLOOD: 'Flood',
  FIRE: 'Fire',
  CHEMICAL_SPILL: 'Chemical Spill',
  OUTBREAK: 'Infectious Disease Outbreak',
  INTERNAL_FIRE: 'Fire Incident',
  SMOKE_ELECTRICAL_FAILURE: 'Smoke / Electrical Failure',
  POWER_FAILURE: 'Power Failure',
  WATER_LEAKAGE_FLOODING: 'Water Leakage / Flooding',
  IT_SYSTEM_FAILURE: 'IT System Failure',
};

export function getIncidentTypeLabel(type: string): string {
  return INCIDENT_TYPE_LABELS[type] || type;
}

export type DisasterIncidentType =
  | 'RTA_MCI'
  | 'CODE_YELLOW'
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'FIRE'
  | 'CHEMICAL_SPILL'
  | 'OUTBREAK'
  | 'INTERNAL_FIRE'
  | 'SMOKE_ELECTRICAL_FAILURE'
  | 'POWER_FAILURE'
  | 'WATER_LEAKAGE_FLOODING'
  | 'IT_SYSTEM_FAILURE';

export interface CreateDisasterIncidentPayload {
  disasterScope: DisasterScope;
  incidentType: DisasterIncidentType;
  colorCode?: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
  locationLat: number;
  locationLng: number;
  locationAddress?: string;
  locationDescription?: string;
  estimatedGreen?: number;
  estimatedYellow?: number;
  estimatedRed?: number;
  estimatedBlack?: number;
  estimatedETA?: string;
  notes?: string;
}

export interface DisasterIncident {
  id: string;
  disasterScope?: string;
  incidentType: string;
  colorCode?: string;
  status: string;
  locationLat: number;
  locationLng: number;
  locationAddress?: string;
  locationDescription?: string;
  totalCasualties?: number;
  estimatedGreen?: number;
  estimatedYellow?: number;
  estimatedRed?: number;
  estimatedBlack?: number;
  estimatedETA?: string;
  notes?: string;
  resolvedAt?: string;
  createdBy?: { firstName?: string; lastName?: string; email?: string };
  resolvedBy?: { firstName?: string; lastName?: string };
  ambulanceAssignments?: Array<{
    id: string;
    status: string; // EN_ROUTE | AT_SCENE | PATIENT_LOADED | EN_ROUTE_TO_HOSPITAL | ARRIVED
    triageCategory?: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
    distanceKm?: number;
    assignedAt: string;
    arrivedAt?: string;
    destinationHospital?: { id: string; name: string };
    ambulance?: { id: string; callSign?: string; status?: string; currentLocationLat?: number; currentLocationLng?: number };
    assignedBy?: { firstName?: string; lastName?: string };
  }>;
  announcements?: Array<{
    id: string;
    announcementText: string;
    status: string;
    createdAt: string;
    createdBy?: { firstName?: string; lastName?: string };
  }>;
  auditLogs?: Array<{ action: string; details?: string; createdAt: string; user?: { firstName?: string; lastName?: string } }>;
  createdAt: string;
  updatedAt?: string;
}

export const disasterService = {
  async resolveMapUrl(url: string): Promise<{ lat: number; lng: number }> {
    const { data } = await apiClient.get('/disasters/resolve-map-url', {
      params: { url },
    });
    return data;
  },

  async createIncident(payload: CreateDisasterIncidentPayload) {
    const { data } = await apiClient.post('/disasters/incidents', payload);
    return data;
  },

  async getActiveIncidents(): Promise<DisasterIncident[]> {
    const { data } = await apiClient.get('/disasters/incidents/active');
    return data;
  },

  async getIncident(id: string) {
    const { data } = await apiClient.get(`/disasters/incidents/${id}`);
    return data;
  },

  async assignAmbulance(
    incidentId: string,
    ambulanceId: string,
    triageCategory?: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK'
  ) {
    const { data } = await apiClient.post(`/disasters/incidents/${incidentId}/assign-ambulance`, {
      ambulanceId,
      ...(triageCategory && { triageCategory }),
    });
    return data;
  },

  async resolveIncident(incidentId: string) {
    const { data } = await apiClient.patch(`/disasters/incidents/${incidentId}/resolve`);
    return data;
  },

  async createAnnouncement(incidentId: string, targetHospitalIds: string[]) {
    const { data } = await apiClient.post('/disasters/announcements', {
      incidentId,
      targetHospitalIds,
    });
    return data;
  },

  async approveAnnouncement(announcementId: string) {
    const { data } = await apiClient.patch(`/disasters/announcements/${announcementId}/approve`);
    return data;
  },

  async markAmbulanceArrived(incidentId: string, assignmentId: string) {
    const { data } = await apiClient.patch(`/disasters/incidents/${incidentId}/assignments/${assignmentId}/arrived`);
    return data;
  },

  async setAssignmentDestination(incidentId: string, assignmentId: string, destinationHospitalId: string) {
    const { data } = await apiClient.patch(
      `/disasters/incidents/${incidentId}/assignments/${assignmentId}/destination`,
      { destinationHospitalId }
    );
    return data;
  },

  async updateAssignmentTriageCategory(
    incidentId: string,
    assignmentId: string,
    triageCategory: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK'
  ) {
    const { data } = await apiClient.patch(
      `/disasters/incidents/${incidentId}/assignments/${assignmentId}/triage-category`,
      { triageCategory }
    );
    return data;
  },

  async bulkSetDestinationByCategory(
    incidentId: string,
    triageCategory: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK',
    hospitalId: string
  ) {
    const { data } = await apiClient.post(
      `/disasters/incidents/${incidentId}/assignments/bulk-destination`,
      { triageCategory, hospitalId }
    );
    return data;
  },

  async markPatientLoaded(incidentId: string, assignmentId: string) {
    const { data } = await apiClient.patch(
      `/disasters/incidents/${incidentId}/assignments/${assignmentId}/patient-loaded`
    );
    return data;
  },

  async markDepartedToHospital(incidentId: string, assignmentId: string) {
    const { data } = await apiClient.patch(
      `/disasters/incidents/${incidentId}/assignments/${assignmentId}/departed`
    );
    return data;
  },

  async getMessages(incidentId: string) {
    const { data } = await apiClient.get(`/disasters/incidents/${incidentId}/messages`);
    return data;
  },

  async createMessage(incidentId: string, content: string) {
    const { data } = await apiClient.post(`/disasters/incidents/${incidentId}/messages`, {
      content,
    });
    return data;
  },

  // Command Room
  async getCommandRoom(incidentId: string): Promise<CommandRoom | null> {
    const { data } = await apiClient.get(`/disasters/incidents/${incidentId}/command-room`);
    // Nest/axios can yield "" or other non-objects when the service returns null
    if (!data || typeof data !== 'object' || Array.isArray(data) || !(data as CommandRoom).id) {
      return null;
    }
    return data as CommandRoom;
  },

  async getSituationalAwareness(incidentId: string) {
    const { data } = await apiClient.get(`/disasters/incidents/${incidentId}/command-room/situational-awareness`);
    return data;
  },

  async getOperationalActions(incidentId: string) {
    const { data } = await apiClient.get(
      `/disasters/incidents/${incidentId}/command-room/operational-actions`
    );
    return data;
  },

  async getCommandRoomVideoToken(incidentId: string) {
    const { data } = await apiClient.post(
      `/disasters/incidents/${incidentId}/command-room/video-token`
    );
    return data;
  },

  async activateCommandRoom(incidentId: string) {
    const { data } = await apiClient.post(`/disasters/incidents/${incidentId}/command-room/activate`);
    return data;
  },

  async assignCommandRole(incidentId: string, userId: string, role: CommandRole) {
    const { data } = await apiClient.post(`/disasters/incidents/${incidentId}/command-room/assign-role`, {
      userId,
      role,
    });
    return data;
  },

  async escalateCommandRoom(incidentId: string, escalationLevel: EscalationLevel) {
    const { data } = await apiClient.patch(`/disasters/incidents/${incidentId}/command-room/escalate`, {
      escalationLevel,
    });
    return data;
  },

  async logCommandDecision(incidentId: string, action: DecisionAction, details?: Record<string, unknown>) {
    const { data } = await apiClient.post(`/disasters/incidents/${incidentId}/command-room/decisions`, {
      action,
      ...(details && { details }),
    });
    return data;
  },

  async closeCommandRoom(incidentId: string) {
    const { data } = await apiClient.patch(`/disasters/incidents/${incidentId}/command-room/close`);
    return data;
  },
};

export type CommandRole =
  | 'COMMANDER'
  | 'OPERATIONS_LEAD'
  | 'EMS_COORDINATOR'
  | 'HOSPITAL_COORDINATION_LEAD'
  | 'SITUATION_ANALYST'
  | 'RECORDER';

export type DisasterCommandRole = CommandRole;

export type EscalationLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export type DecisionAction =
  | 'ACTIVATED'
  | 'ESCALATED'
  | 'TEAM_ASSIGNED'
  | 'CLOSED'
  | 'CUSTOM';

export type DisasterCommandDecisionAction = DecisionAction;

export interface CommandRoom {
  id: string;
  disasterIncidentId: string;
  escalationLevel: EscalationLevel;
  activatedById: string;
  activatedAt: string;
  closedById?: string;
  closedAt?: string;
  activatedBy?: { id: string; firstName?: string; lastName?: string };
  closedBy?: { firstName?: string; lastName?: string };
  roleAssignments?: Array<{
    id: string;
    role: CommandRole;
    userId: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    };
    assignedBy?: { firstName?: string; lastName?: string };
    assignedAt: string;
  }>;
  decisionLogs?: Array<{
    id: string;
    action: DecisionAction;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: { firstName?: string; lastName?: string };
  }>;
}
