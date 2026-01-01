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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Search, Reply } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supportService, SupportTicket, SupportTicketStatus, SupportStatistics } from '../../services/supportService';
import { TicketStatusBadge } from './components/TicketStatusBadge';

const statusOptions: { value: SupportTicketStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export const SupportPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statistics, setStatistics] = useState<SupportStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.getAllTickets({
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

  const loadStatistics = async () => {
    try {
      const stats = await supportService.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadStatistics();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
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
      <Typography variant="h4" sx={{ mb: 3 }}>Support Panel</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{statistics.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tickets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error">
                  {statistics.open}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {statistics.inProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {statistics.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
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

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Messages</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No tickets found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ cursor: 'pointer', color: 'primary.main' }}
                      onClick={() => navigate(`/support-panel/${ticket.id}`)}
                    >
                      {ticket.ticketNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip label={ticket.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>{ticket._count?.messages || 0}</TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Reply />}
                      onClick={() => navigate(`/support-panel/${ticket.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};

