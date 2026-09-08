import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  TextField,
  MenuItem,
  CardContent,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import { mcpAuditService, EventFilters, AuditEvent, getDimensionLabel, getSeverityColor } from '../../services/mcpAuditService';
import { format } from 'date-fns';

const AuditEventsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<EventFilters>({});

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await mcpAuditService.listEvents({
        ...filters,
        page: page + 1,
        pageSize,
      });
      setEvents(data.events);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to load events', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, pageSize, filters]);

  return (
    <>
      <Helmet>
        <title>Audit Events - RCC</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
          Audit Events
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Start Date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Severity"
                select
                value={filters.severity || 'ALL'}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value === 'ALL' ? undefined : e.target.value })}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All Severities</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </TextField>
              <TextField
                label="Entity Type"
                value={filters.entityType || ''}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                size="small"
                placeholder="e.g., PATIENT, TICKET"
                sx={{ minWidth: 180 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dimension</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>MCP Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No events found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Chip label={getDimensionLabel(event.dimension)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {event.entityType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.entityId.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.severity}
                          size="small"
                          sx={{
                            bgcolor: getSeverityColor(event.severity) + '20',
                            color: getSeverityColor(event.severity),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(event.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {event.mcpSubmitted ? (
                          <Chip label="Yes" size="small" color="success" />
                        ) : (
                          <Chip label="No" size="small" color="default" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </Card>
      </Box>
    </>
  );
};

export default AuditEventsPage;
