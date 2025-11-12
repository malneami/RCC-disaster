import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Warning,
  Download,
  Search,
  FilterList,
  GetApp,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Pagination from './Pagination';

export interface AccessLog {
  id: string;
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
}

interface AccessLogsTabProps {
  entityId: string;
  entityType: 'ticket' | 'medical-record';
  fetchLogs: (filters: {
    page?: number;
    limit?: number;
    [key: string]: any;
  }) => Promise<{
    data: AccessLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>;
  entityLabel?: string;
}

const AccessLogsTab: React.FC<AccessLogsTabProps> = ({
  entityId,
  entityType,
  fetchLogs,
  entityLabel,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const accessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        page,
        limit,
        [entityType === 'ticket' ? 'ticketId' : 'medicalRecordId']: entityId,
      };
      if (userIdFilter) filters.userId = userIdFilter;
      if (accessTypeFilter) filters.accessType = accessTypeFilter;
      if (startDate) filters.startDate = startDate.toISOString().split('T')[0];
      if (endDate) filters.endDate = endDate.toISOString().split('T')[0];

      const response = await fetchLogs(filters);
      setLogs(response?.data || []);
      setTotal(response?.total || 0);
      setTotalPages(response?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      loadLogs();
    }
  }, [page, entityId, userIdFilter, accessTypeFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setUserIdFilter('');
    setAccessTypeFilter('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const headers = ['Timestamp', 'User', 'Role', 'Access Type', 'Method', 'IP Address', 'Reason'];
      const rows = (logs || []).map((log) => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.user?.role || 'N/A',
        log.accessType,
        log.accessMethod,
        log.ipAddress || 'N/A',
        log.reason || 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}-access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    }
  };

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'VIEW':
        return <Visibility fontSize="small" />;
      case 'CREATE':
      case 'UPDATE':
        return <Edit fontSize="small" />;
      case 'DELETE':
        return <Warning fontSize="small" />;
      case 'EXPORT':
        return <Download fontSize="small" />;
      case 'SEARCH':
        return <Search fontSize="small" />;
      default:
        return <Visibility fontSize="small" />;
    }
  };

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'VIEW':
        return 'info';
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'error';
      case 'EXPORT':
        return 'primary';
      case 'SEARCH':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              {entityLabel || `${entityType === 'ticket' ? 'Ticket' : 'Medical Record'} Access Logs`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              <Button variant="outlined" startIcon={<GetApp />} onClick={handleExport}>
                Export Excel
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={loadLogs}>
                Refresh
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Access Type"
                  value={accessTypeFilter}
                  onChange={(e) => setAccessTypeFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  {accessTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          )}

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Total: {total} access logs
          </Typography>
        </Paper>

        {/* Table */}
        {loading && (!logs || logs.length === 0) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !logs || logs.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Access Logs Found
                </Typography>
                <Typography color="textSecondary">
                  There are no access logs matching your filters.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Access Type</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(logs || []).map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                      <TableCell>
                        {log.user ? (
                          <Box>
                            <Typography variant="body2">
                              {log.user.firstName} {log.user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.user.email}
                            </Typography>
                            <Chip label={log.user.role} size="small" sx={{ mt: 0.5 }} />
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getAccessTypeIcon(log.accessType)}
                          label={log.accessType}
                          color={getAccessTypeColor(log.accessType) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.accessMethod}</TableCell>
                      <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                      <TableCell>
                        {log.reason ? (
                          <Tooltip title={log.reason}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {log.reason}
                            </Typography>
                          </Tooltip>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Access Log Details</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Access Type
                  </Typography>
                  <Chip
                    icon={getAccessTypeIcon(selectedLog.accessType)}
                    label={selectedLog.accessType}
                    color={getAccessTypeColor(selectedLog.accessType) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})`
                      : 'N/A'}
                  </Typography>
                  {selectedLog.user && (
                    <Chip label={selectedLog.user.role} size="small" sx={{ mt: 0.5 }} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Access Method
                  </Typography>
                  <Typography variant="body1">{selectedLog.accessMethod}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1">{selectedLog.ipAddress || 'N/A'}</Typography>
                </Grid>
                {selectedLog.userAgent && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      User Agent
                    </Typography>
                    <Typography variant="body2">{selectedLog.userAgent}</Typography>
                  </Grid>
                )}
                {selectedLog.reason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Reason
                    </Typography>
                    <Typography variant="body1">{selectedLog.reason}</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AccessLogsTab;

