import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Fade,
} from '@mui/material';
import { patientService, PatientAccessLog } from '@/services/patientService';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Pagination from '@/components/Common/Pagination';
import { format } from 'date-fns';

import AccessLogHeader from './access-logs/AccessLogHeader';
import AccessLogFilters from './access-logs/AccessLogFilters';
import AccessLogEmptyState from './access-logs/AccessLogEmptyState';
import AccessLogList from './access-logs/AccessLogList';
import AccessLogDetailDialog from './access-logs/AccessLogDetailDialog';


const PatientAccessLogsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<PatientAccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PatientAccessLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const accessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        page,
        limit,
      };
      if (patientIdFilter) filters.patientId = patientIdFilter;
      if (userIdFilter) filters.userId = userIdFilter;
      if (accessTypeFilter) filters.accessType = accessTypeFilter;
      if (startDate) filters.startDate = startDate.toISOString().split('T')[0];
      if (endDate) filters.endDate = endDate.toISOString().split('T')[0];

      const response = await patientService.getAllAccessLogs(filters);
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
    loadLogs();
  }, [page, patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setPatientIdFilter('');
    setUserIdFilter('');
    setAccessTypeFilter('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Timestamp', 'User', 'Role', 'Patient', 'Access Type', 'Method', 'IP Address', 'Reason'];
      const rows = (logs || []).map((log) => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.user?.role || 'N/A',
        log.patient ? `${log.patient.firstName} ${log.patient.lastName}` : 'N/A',
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
      link.download = `patient-access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    }
  };

  const hasActiveFilters = Boolean(patientIdFilter || userIdFilter || accessTypeFilter || startDate || endDate);
  const activeFilterCount = [patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate].filter(Boolean).length;

  if (loading && (!logs || logs.length === 0)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)',
          borderRadius: '16px',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={56}
            thickness={4}
            sx={{
              color: '#42a5f5',
              mb: 2.5,
            }}
          />
          <Box
            sx={{
              color: '#42a5f5',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Loading access logs...
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Fade in={true} timeout={400}>
        <Box sx={{ p: 2 }}>
          <AccessLogHeader
            total={total}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            handleExport={handleExport}
            loadLogs={loadLogs}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
          >
            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  mb: 2,
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {showFilters && (
              <AccessLogFilters
                patientIdFilter={patientIdFilter}
                setPatientIdFilter={setPatientIdFilter}
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
          </AccessLogHeader>

          {!logs || logs.length === 0 ? (
            <AccessLogEmptyState />
          ) : (
            <>
              <AccessLogList
                logs={logs}
                onLogClick={(log) => {
                  setSelectedLog(log);
                  setDetailDialogOpen(true);
                }}
              />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}

          <AccessLogDetailDialog
            open={detailDialogOpen}
            onClose={() => setDetailDialogOpen(false)}
            selectedLog={selectedLog}
          />
        </Box>
      </Fade>
    </LocalizationProvider>
  );
};

export default PatientAccessLogsTab;
