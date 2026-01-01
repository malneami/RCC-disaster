import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supportService, SupportTicket, SupportTicketStatus } from '../../services/supportService';
import { TicketStatusBadge } from './components/TicketStatusBadge';
import { CreateSupportTicketDialog } from './components/CreateSupportTicketDialog';

const statusOptions: { value: SupportTicketStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export const SupportTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.getTickets({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setTickets(response.tickets);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    loadTickets();
  };

  const handleCreateSuccess = () => {
    loadTickets();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && tickets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Support Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Ticket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: <Search />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SupportTicketStatus | '')}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button fullWidth variant="outlined" onClick={handleSearch}>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {tickets.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No tickets found. Create your first support ticket!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={2}>
            {tickets.map((ticket) => (
              <Grid item xs={12} key={ticket.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 },
                  }}
                  onClick={() => navigate(`/support/${ticket.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">{ticket.ticketNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created by {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                        </Typography>
                      </Box>
                      <TicketStatusBadge status={ticket.status} />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {ticket.description.length > 150
                        ? ticket.description.substring(0, 150) + '...'
                        : ticket.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Chip label={ticket.category} size="small" variant="outlined" />
                      {ticket._count && (
                        <>
                          <Chip label={`${ticket._count.messages} messages`} size="small" variant="outlined" />
                          <Chip label={`${ticket._count.attachments} attachments`} size="small" variant="outlined" />
                        </>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDate(ticket.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <CreateSupportTicketDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

