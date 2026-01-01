import React from 'react';
import { Box, Alert, CircularProgress, Grid } from '@mui/material';
import { UnifiedTicket } from '../types/tickets';
import TicketCard from './TicketCard';
import { Ticket } from '../../../services/ticketService';
import { HospitalTicket } from '../../../services/hospitalService';
import { useTicketManager } from '../hooks/useTicketManager';
import { TicketStats } from './tickets/TicketStats';
import { TicketFilters } from './tickets/TicketFilters';

interface RelatedTicketsManagerProps {
  hospitalTickets: HospitalTicket[];
  transferTickets: Ticket[];
  onRefresh?: () => void;
  onViewTicket?: (ticket: UnifiedTicket) => void;
  onEditTicket?: (ticket: UnifiedTicket) => void;
  isLoading?: boolean;
}

const RelatedTicketsManager: React.FC<RelatedTicketsManagerProps> = ({
  hospitalTickets,
  transferTickets,
  onRefresh,
  onViewTicket,
  onEditTicket,
  isLoading = false,
}) => {
  const {
    viewMode,
    setViewMode,
    filters,
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
  } = useTicketManager(hospitalTickets, transferTickets);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TicketStats stats={stats} />

      <TicketFilters
        filters={filters}
        sortBy={sortBy}
        viewMode={viewMode}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onSortChange={setSortBy}
        onViewModeChange={setViewMode}
        onRefresh={onRefresh}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        pathwayOptions={pathwayOptions}
        filterMenuAnchor={filterMenuAnchor}
        sortMenuAnchor={sortMenuAnchor}
        onFilterMenuOpen={(e) => setFilterMenuAnchor(e.currentTarget)}
        onFilterMenuClose={() => setFilterMenuAnchor(null)}
        onSortMenuOpen={(e) => setSortMenuAnchor(e.currentTarget)}
        onSortMenuClose={() => setSortMenuAnchor(null)}
      />

      {/* Tickets Display */}
      {filteredAndSortedTickets.length === 0 ? (
        <Alert severity="info">
          {unifiedTickets.length === 0
            ? 'No tickets found for this hospital.'
            : 'No tickets match the current filters.'
          }
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredAndSortedTickets.map((ticket) => (
            <Grid item xs={12} sm={6} md={viewMode === 'grid' ? 4 : 12} key={ticket.id}>
              <TicketCard
                ticket={ticket}
                onView={onViewTicket}
                onEdit={onEditTicket}
                showActions={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RelatedTicketsManager;
