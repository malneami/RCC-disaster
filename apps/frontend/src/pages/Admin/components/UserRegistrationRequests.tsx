import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Visibility, 
  Email,
  Phone,
  Business,
  Schedule,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userRegistrationService, UserRegistrationRequest, RegistrationRequestStats } from '../../../services/userRegistrationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`registration-tabpanel-${index}`}
      aria-labelledby={`registration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserRegistrationRequests: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<UserRegistrationRequest[]>([]);
  const [stats, setStats] = useState<RegistrationRequestStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UserRegistrationRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
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

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      setError(null);

      if (action === 'approve') {
        await userRegistrationService.approveRegistrationRequest(
          selectedRequest.id,
          adminComments || undefined
        );
        
        // Show success message
        enqueueSnackbar('User account created successfully! The user can now login with the password they provided during registration.', { 
          variant: 'success',
          autoHideDuration: 6000 
        });
      } else {
        await userRegistrationService.rejectRegistrationRequest(
          selectedRequest.id,
          adminComments
        );
        enqueueSnackbar('Registration request rejected successfully.', { variant: 'success' });
      }

      setActionDialog(null);
      setSelectedRequest(null);
      setAdminComments('');
      loadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} registration request`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    switch (tabValue) {
      case 0:
        return request.status === 'PENDING';
      case 1:
        return request.status === 'APPROVED';
      case 2:
        return request.status === 'REJECTED';
      default:
        return true;
    }
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
      <Typography variant="h5" component="h1" gutterBottom>
        User Registration Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage pending user registration requests and review access approvals
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={`Pending (${stats.pending})`} 
              icon={<Schedule />}
              iconPosition="start"
            />
            <Tab 
              label={`Approved (${stats.approved})`} 
              icon={<CheckCircle />}
              iconPosition="start"
            />
            <Tab 
              label={`Rejected (${stats.rejected})`} 
              icon={<Cancel />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {request.firstName} {request.lastName}
                        </Typography>
                        {request.phoneNumber && (
                          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                            <Phone sx={{ fontSize: 12, mr: 0.5 }} />
                            {request.phoneNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {request.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleDisplayName(request.requestedRole)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {request.hospital ? (
                        <Box display="flex" alignItems="center">
                          <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2">{request.hospital.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {request.hospital.id}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not specified
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'PENDING' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog('approve');
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog('reject');
                                }}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Approved At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.firstName} {request.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleDisplayName(request.requestedRole)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {request.hospital?.name || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {request.reviewer ? (
                        `${request.reviewer.firstName} ${request.reviewer.lastName}`
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell>
                      {request.reviewedAt ? (
                        <Box>
                          <Typography variant="body2">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(request.reviewedAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => setSelectedRequest(request)}
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
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Rejected By</TableCell>
                  <TableCell>Rejected At</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.firstName} {request.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleDisplayName(request.requestedRole)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {request.hospital?.name || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {request.reviewer ? (
                        `${request.reviewer.firstName} ${request.reviewer.lastName}`
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell>
                      {request.reviewedAt ? (
                        <Box>
                          <Typography variant="body2">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(request.reviewedAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {request.adminComments || 'No reason provided'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => setSelectedRequest(request)}
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
        </TabPanel>
      </Card>

      {/* View Details Dialog */}
      <Dialog 
        open={selectedRequest !== null && actionDialog === null} 
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Registration Request Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Full Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.firstName} {selectedRequest.lastName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {selectedRequest.email}
                    </Typography>
                  </Box>
                </Grid>

                {selectedRequest.phoneNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Phone Number
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {selectedRequest.phoneNumber}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Requested Role
                  </Typography>
                  <Chip 
                    label={getRoleDisplayName(selectedRequest.requestedRole)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip 
                    label={selectedRequest.status} 
                    color={getStatusColor(selectedRequest.status) as any}
                    size="small"
                  />
                </Grid>

                {selectedRequest.hospital && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Hospital
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1">{selectedRequest.hospital.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {selectedRequest.hospital.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Requested Date
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">
                        {new Date(selectedRequest.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {selectedRequest.reviewedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {selectedRequest.status === 'APPROVED' ? 'Approved' : 'Rejected'} Date
                    </Typography>
                    <Box>
                      <Typography variant="body1">
                        {new Date(selectedRequest.reviewedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(selectedRequest.reviewedAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {selectedRequest.reviewer && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {selectedRequest.status === 'APPROVED' ? 'Approved' : 'Rejected'} By
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.reviewer.firstName} {selectedRequest.reviewer.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedRequest.reviewer.email}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.justification && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Justification
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      p: 2, 
                      bgcolor: 'background.default', 
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedRequest.justification}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.adminComments && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Admin Comments
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      p: 2, 
                      bgcolor: selectedRequest.status === 'REJECTED' ? 'error.light' : 'success.light',
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedRequest.adminComments}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRequest(null)}>
            Close
          </Button>
          {selectedRequest?.status === 'PENDING' && (
            <>
              <Button 
                onClick={() => {
                  setActionDialog('approve');
                }}
                color="success"
                variant="contained"
              >
                Approve
              </Button>
              <Button 
                onClick={() => {
                  setActionDialog('reject');
                }}
                color="error"
                variant="contained"
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog 
        open={actionDialog !== null} 
        onClose={() => setActionDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog === 'approve' ? 'Approve Registration Request' : 'Reject Registration Request'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {selectedRequest.firstName} {selectedRequest.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedRequest.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Role:</strong> {getRoleDisplayName(selectedRequest.requestedRole)}
              </Typography>
              {selectedRequest.justification && (
                <Typography variant="body1" gutterBottom>
                  <strong>Justification:</strong> {selectedRequest.justification}
                </Typography>
              )}
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionDialog === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection'}
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
            required={actionDialog === 'reject'}
            helperText={actionDialog === 'approve' ? 'Optional comments for the user' : 'Please provide a reason for rejection'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAction(actionDialog!)}
            color={actionDialog === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionLoading || (actionDialog === 'reject' && !adminComments.trim())}
          >
            {actionLoading ? <CircularProgress size={20} /> : actionDialog === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRegistrationRequests;
