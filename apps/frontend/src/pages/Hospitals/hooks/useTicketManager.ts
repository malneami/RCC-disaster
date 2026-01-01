import { useState, useMemo } from 'react';
import { TicketFilterOptions, TicketSortOption, convertToUnifiedTicket } from '../types/tickets';
import { Ticket } from '../../../services/ticketService';
import { HospitalTicket } from '../../../services/hospitalService';

export const useTicketManager = (
  hospitalTickets: HospitalTicket[],
  transferTickets: Ticket[]
) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<TicketFilterOptions>({});
  const [sortBy, setSortBy] = useState<TicketSortOption>('createdAt_desc');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Convert all tickets to unified format
  const unifiedTickets = useMemo(() => {
    const hospitalUnified = hospitalTickets.map(convertToUnifiedTicket);
    const transferUnified = transferTickets.map(convertToUnifiedTicket);
    return [...hospitalUnified, ...transferUnified];
  }, [hospitalTickets, transferTickets]);

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = unifiedTickets;

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(ticket => filters.status!.includes(ticket.status));
    }
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(ticket => filters.priority!.includes(ticket.priority));
    }
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(ticket => filters.type!.includes(ticket.type));
    }
    if (filters.pathway && filters.pathway.length > 0) {
      filtered = filtered.filter(ticket =>
        ticket.pathway && filters.pathway!.includes(ticket.pathway)
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        (ticket.patient && `${ticket.patient.firstName} ${ticket.patient.lastName}`.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority_desc':
          const priorityOrder = { 'EMERGENCY': 5, 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'priority_asc':
          const priorityOrderAsc = { 'EMERGENCY': 5, 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrderAsc[a.priority as keyof typeof priorityOrderAsc] || 0) -
            (priorityOrderAsc[b.priority as keyof typeof priorityOrderAsc] || 0);
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [unifiedTickets, filters, sortBy]);

  // Get unique filter options
  const statusOptions = useMemo(() => {
    const statuses = new Set(unifiedTickets.map(t => t.status));
    return Array.from(statuses).sort();
  }, [unifiedTickets]);

  const priorityOptions = useMemo(() => {
    const priorities = new Set(unifiedTickets.map(t => t.priority));
    return Array.from(priorities).sort();
  }, [unifiedTickets]);

  const pathwayOptions = useMemo(() => {
    const pathways = new Set(unifiedTickets.map(t => t.pathway).filter((p): p is string => !!p));
    return Array.from(pathways).sort();
  }, [unifiedTickets]);

  const handleFilterChange = (key: keyof TicketFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getTicketStats = () => {
    const total = unifiedTickets.length;
    const open = unifiedTickets.filter(t => ['PENDING', 'OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
    const completed = unifiedTickets.filter(t => ['COMPLETED', 'CLOSED', 'RESOLVED'].includes(t.status)).length;
    const transfer = unifiedTickets.filter(t => t.type === 'TRANSFER').length;
    const hospital = unifiedTickets.filter(t => t.type === 'HOSPITAL').length;

    return { total, open, completed, transfer, hospital };
  };

  const stats = getTicketStats();

  return {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    filterMenuAnchor,
    setFilterMenuAnchor,
    sortMenuAnchor,
    setSortMenuAnchor,
    unifiedTickets,
    filteredAndSortedTickets,
    statusOptions,
    priorityOptions,
    pathwayOptions,
    handleFilterChange,
    clearFilters,
    stats,
  };
};
