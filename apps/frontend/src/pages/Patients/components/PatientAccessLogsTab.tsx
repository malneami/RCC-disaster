import React, { useState, useEffect, useMemo } from 'react';
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
  const [allLogs, setAllLogs] = useState<PatientAccessLog[]>([]); // All logs from server
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PatientAccessLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filters - now used for client-side filtering only
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const accessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];

  // Load ALL logs once on mount
  const loadAllLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load all logs without filters - backend should support high limit or no pagination
      const response = await patientService.getAllAccessLogs({ limit: 1000 });
      setAllLogs(response?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllLogs();
  }, []); // Load once on mount

  // Client-side filtering with useMemo - instant, no API calls
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Patient ID filter - search in patient name/MRN/NationalId/PatientId
      if (patientIdFilter) {
        const patientName = log.patient
          ? `${log.patient.firstName} ${log.patient.lastName}`.toLowerCase()
          : '';
        const patientMrn = log.patient?.mrn?.toLowerCase() || '';
        const patientNationalId = log.patient?.nationalId?.toLowerCase() || '';
        const patientId = log.patientId?.toLowerCase() || '';
        const searchTerm = patientIdFilter.toLowerCase();
        if (
          !patientName.includes(searchTerm) &&
          !patientMrn.includes(searchTerm) &&
          !patientNationalId.includes(searchTerm) &&
          !patientId.includes(searchTerm)
        ) {
          return false;
        }
      }

      // User ID filter - search in user name
      if (userIdFilter) {
        const userName = log.user
          ? `${log.user.firstName} ${log.user.lastName}`.toLowerCase()
          : '';
        const userRole = log.user?.role?.toLowerCase() || '';
        const searchTerm = userIdFilter.toLowerCase();
        if (!userName.includes(searchTerm) && !userRole.includes(searchTerm)) {
          return false;
        }
      }

      // Access type filter - exact match
      if (accessTypeFilter && log.accessType !== accessTypeFilter) {
        return false;
      }

      // Date range filter
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (logDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [allLogs, patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate]);

  // Client-side pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredLogs.slice(startIndex, startIndex + limit);
  }, [filteredLogs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / limit));
  const total = filteredLogs.length;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [patientIdFilter, userIdFilter, accessTypeFilter, startDate, endDate]);

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
      const rows = filteredLogs.map((log) => [
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

  if (loading && allLogs.length === 0) {
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
            loadLogs={loadAllLogs}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
          />

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
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                mb: 2,
              }}
            >
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
            </Box>
          )}

          {paginatedLogs.length === 0 ? (
            <AccessLogEmptyState />
          ) : (
            <>
              <AccessLogList
                logs={paginatedLogs}
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
