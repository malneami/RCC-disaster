import { TimelineEvent } from '../../../components/Common/TimelineView';
import { PatientWithDetails } from '../../../services/patientService';

export const convertPatientsToTimelineEvents = (patients: PatientWithDetails[]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  
  patients.forEach(patient => {
    // Patient creation
    if (patient.createdAt) {
      events.push({
        id: `${patient.id}-created`,
        timestamp: patient.createdAt,
        title: `Patient Created - ${patient.firstName} ${patient.lastName}`,
        description: `New patient record created`,
        type: 'other',
        status: 'completed',
        user: {
          name: patient.createdBy?.firstName ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : 'System',
          role: 'Data Collector',
        },
        details: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientNationalId: patient.nationalId,
          patientMRN: patient.mrn,
          patientGender: patient.gender,
          patientDOB: patient.dateOfBirth,
        },
      });
    }

    // Patient updates
    if (patient.updatedAt && patient.updatedAt !== patient.createdAt) {
      events.push({
        id: `${patient.id}-updated`,
        timestamp: patient.updatedAt,
        title: `Patient Updated - ${patient.firstName} ${patient.lastName}`,
        description: `Patient information updated`,
        type: 'other',
        status: 'completed',
        details: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientNationalId: patient.nationalId,
          patientMRN: patient.mrn,
        },
      });
    }

    // Medical records
    if (patient.medicalRecords && patient.medicalRecords.length > 0) {
      patient.medicalRecords.forEach((record: any, index: number) => {
        events.push({
          id: `${patient.id}-record-${index}`,
          timestamp: record.createdAt || patient.createdAt,
          title: `Medical Record - ${record.title || 'Untitled'}`,
          description: `Medical record created for ${patient.firstName} ${patient.lastName}`,
          type: 'other',
          status: 'completed',
          details: {
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientNationalId: patient.nationalId,
            recordTitle: record.title,
            recordType: record.recordType,
          },
        });
      });
    }

    // Tickets
    if (patient.tickets && patient.tickets.length > 0) {
      patient.tickets.forEach((ticket: any, index: number) => {
        events.push({
          id: `${patient.id}-ticket-${index}`,
          timestamp: ticket.createdAt || patient.createdAt,
          title: `Ticket Created - ${ticket.chiefComplaint || 'Untitled'}`,
          description: `Ticket created for ${patient.firstName} ${patient.lastName}`,
          type: 'other',
          status: ticket.status === 'COMPLETED' ? 'completed' : 'in-progress',
          details: {
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientNationalId: patient.nationalId,
            ticketTitle: ticket.chiefComplaint,
            ticketStatus: ticket.status,
            ticketPriority: ticket.priority,
          },
        });
      });
    }
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};
