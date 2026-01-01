import { UnifiedTicket } from '../../types/tickets';

export const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
    case 'EMERGENCY':
      return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' };
    case 'HIGH':
      return { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' };
    case 'MEDIUM':
      return { bg: '#E0F2FE', color: '#0284C7', border: '#7DD3FC' };
    case 'LOW':
      return { bg: '#D1FAE5', color: '#059669', border: '#6EE7B7' };
    default:
      return { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
  }
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'OPEN':
      return { bg: '#FEE2E2', color: '#DC2626' };
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return { bg: '#FEF3C7', color: '#D97706' };
    case 'COMPLETED':
    case 'CLOSED':
    case 'RESOLVED':
      return { bg: '#D1FAE5', color: '#059669' };
    case 'CANCELLED':
      return { bg: '#F1F5F9', color: '#64748B' };
    default:
      return { bg: '#F1F5F9', color: '#64748B' };
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getTimeInfo = (ticket: UnifiedTicket) => {
  if (ticket.type === 'TRANSFER') {
    if (ticket.emsContactTime) {
      return `EMS Contact: ${formatDate(ticket.emsContactTime)}`;
    }
    return `Created: ${formatDate(ticket.createdAt)}`;
  }
  return `Updated: ${formatDate(ticket.updatedAt)}`;
};

export const getLocationInfo = (ticket: UnifiedTicket) => {
  if (ticket.type === 'TRANSFER') {
    const origin = ticket.originHospital?.name || 'Unknown origin';
    const destination = ticket.destinationHospital?.name || 'Unknown destination';
    return `From: ${origin} → To: ${destination}`;
  }
  return ticket.hospitalId ? 'Internal Hospital Ticket' : 'Hospital ticket';
};
