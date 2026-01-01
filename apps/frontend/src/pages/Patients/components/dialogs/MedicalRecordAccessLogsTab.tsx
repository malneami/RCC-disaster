import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import { FilterList, GetApp, Refresh } from '@mui/icons-material';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Pagination from '../../../../components/Common/Pagination';
import { GRADIENT_COLORS } from '../access-logs/AccessLogConstants';
import MedicalRecordAccessLogDetailDialog from './MedicalRecordAccessLogDetailDialog';
import { AccessLogCard, AccessLogEmptyState, AccessLogFilters } from './MedicalRecordAccessLogComponents';

export interface MedicalRecordAccessLog {
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

interface MedicalRecordAccessLogsTabProps {
  entityId: string;
  fetchLogs: (filters: {
    page?: number;
    limit?: number;
    medicalRecordId?: string;
    [key: string]: any;
  }) => Promise<{
    data: MedicalRecordAccessLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>;
  entityLabel?: string;
}

const MedicalRecordAccessLogsTab: React.FC<MedicalRecordAccessLogsTabProps> = ({
  entityId,
  fetchLogs,
  entityLabel,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<MedicalRecordAccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MedicalRecordAccessLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const accessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = { page, limit, medicalRecordId: entityId };
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
      const rows = logs.map((log) => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.user?.role || 'N/A',
        log.accessType,
        log.accessMethod,
        log.ipAddress || 'N/A',
        log.reason || 'N/A',
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical-record-access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    }
  };

  const hasActiveFilters = Boolean(userIdFilter || accessTypeFilter || startDate || endDate);
  const activeFilterCount = [userIdFilter, accessTypeFilter, startDate, endDate].filter(Boolean).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pt: 1 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha('#42a5f5', 0.1)} 0%, ${alpha('#42a5f5', 0.05)} 100%)`,
            borderRadius: '16px',
            border: `1px solid ${alpha('#42a5f5', 0.2)}`,
            padding: '18px 24px',
            marginBottom: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}>
              {entityLabel || 'Medical Record Access Logs'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  background: showFilters ? GRADIENT_COLORS.primary : alpha('#42a5f5', 0.1),
                  color: showFilters ? '#ffffff' : '#42a5f5',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: showFilters ? '0 4px 12px rgba(66, 165, 245, 0.4)' : 'none',
                  '&:hover': {
                    background: GRADIENT_COLORS.primary,
                    color: '#ffffff',
                    boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                  },
                }}
              >
                Filters {hasActiveFilters && `(${activeFilterCount})`}
              </Button>
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={handleExport}
                sx={{
                  background: GRADIENT_COLORS.export,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(38, 166, 154, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e9b8f 0%, #26a69a 100%)',
                    boxShadow: '0 6px 16px rgba(38, 166, 154, 0.5)',
                  },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadLogs}
                sx={{
                  background: GRADIENT_COLORS.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                    boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)',
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {showFilters && (
            <AccessLogFilters
              userIdFilter={userIdFilter}
              setUserIdFilter={setUserIdFilter}
              accessTypeFilter={accessTypeFilter}
              setAccessTypeFilter={setAccessTypeFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              handleResetFilters={handleResetFilters}
              accessTypes={accessTypes}
            />
          )}

          <Typography variant="body2" sx={{ mt: 2, color: '#42a5f5', fontWeight: 600, fontSize: '0.875rem' }}>
            Total: {total} access logs
          </Typography>
        </Box>

        {loading && (!logs || logs.length === 0) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !logs || logs.length === 0 ? (
          <AccessLogEmptyState />
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {logs.map((log, index) => (
                <AccessLogCard
                  key={log.id}
                  log={log}
                  index={index}
                  totalLogs={logs.length}
                  onViewDetails={(log) => {
                    setSelectedLog(log);
                    setDetailDialogOpen(true);
                  }}
                />
              ))}
            </Box>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        <MedicalRecordAccessLogDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          selectedLog={selectedLog}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default MedicalRecordAccessLogsTab;

