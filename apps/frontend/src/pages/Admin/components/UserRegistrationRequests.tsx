import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Visibility,
  Email,
  Business,
  Refresh,
  ContentCopy,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userRegistrationService, UserRegistrationRequest, RegistrationRequestStats } from '../../../services/userRegistrationService';
import AdminStatsGrid from './AdminStatsGrid';
import UserDetailDrawer from './UserDetailDrawer';



const UserRegistrationRequests: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<UserRegistrationRequest[]>([]);
  const [stats, setStats] = useState<RegistrationRequestStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UserRegistrationRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        userRegistrationService.getAllRegistrationRequests(),
        userRegistrationService.getRegistrationRequestStats(),
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (err: any) {
      setError('Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: alpha('#ef4444', 0.1), color: '#ef4444' };
      case 'RCC':
        return { bg: alpha('#2563eb', 0.1), color: '#2563eb' };
      case 'EMS':
        return { bg: alpha('#10b981', 0.1), color: '#10b981' };
      default:
        return { bg: alpha('#64748b', 0.1), color: '#64748b' };
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'RCC':
        return 'RCC Coordinator';
      case 'EMS':
        return 'EMS Operator';
      case 'DATA_COLLECTOR':
        return 'Data Collector';
      case 'CATH_LAB_USER':
        return 'Cath Lab User';
      case 'HOSPITAL_USER':
        return 'Hospital User';
      default:
        return role;
    }
  };

  const handleOpenDrawer = (request: UserRegistrationRequest) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  const filteredRequests = requests.filter(request => {
    const matchesTab = (tabValue === 0 && request.status === 'PENDING') ||
      (tabValue === 1 && request.status === 'APPROVED') ||
      (tabValue === 2 && request.status === 'REJECTED');

    const firstName = request.firstName || '';
    const lastName = request.lastName || '';
    const email = request.email || '';
    const id = request.id || '';
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch = firstName.toLowerCase().includes(query) ||
      lastName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      id.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Access Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage new account registrations and security clearances.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={loadData}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Verify Pending
        </Button>
      </Box>

      <AdminStatsGrid
        stats={{
          totalUsers: stats.total,
          pendingRequests: stats.pending,
          activeAdmins: 0 // Not directly available here, but kept for layout consistency
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        alignItems: 'center'
      }}>
        <TextField
          placeholder="Search by name, email or ID..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.default'
            }
          }}
          InputProps={{
            startAdornment: <Refresh sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
          }}
        />
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ minHeight: 40, '& .MuiTab-root': { py: 1, minHeight: 40, fontWeight: 600 } }}>
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Approved (${stats.approved})`} />
          <Tab label={`Rejected (${stats.rejected})`} />
        </Tabs>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: 'none' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: alpha('#f8fafc', 0.5) }}>
              <TableRow>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>REQUESTER Details</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>REQUESTED ROLE</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>HOSPITAL</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>REQUESTED AT</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  hover
                  onClick={() => handleOpenDrawer(request)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: alpha('#2563eb', 0.04) + ' !important' }
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(request.id);
                        enqueueSnackbar('Full Request ID copied to clipboard', { variant: 'info' });
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {request.id.slice(0, 8)}...
                      <ContentCopy sx={{ fontSize: 12 }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: alpha('#f59e0b', 0.1),
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {(request.firstName?.[0] || '?')}{(request.lastName?.[0] || '')}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {request.firstName} {request.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 12 }} /> {request.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-flex',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      ...getRoleBadgeStyles(request.requestedRole)
                    }}>
                      {getRoleDisplayName(request.requestedRole)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getStatusColor(request.status) }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {request.status}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {request.hospital ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {request.hospital.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>Not specified</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500, display: 'block' }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(request); }}>
                      <Visibility sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body2" color="text.secondary">No requests found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <UserDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        registrationRequest={selectedRequest}
        onUpdateSuccess={loadData}
      />
    </Box>
  );
};

export default UserRegistrationRequests;
