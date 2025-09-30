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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Grid,
} from '@mui/material';
import { 
  Refresh, 
  LockReset,
  Edit,
  Email,
  Business,
} from '@mui/icons-material';
import { userManagementService, User, UpdateUserDto } from '../../../services/userManagementService';
import { userRegistrationService, Hospital } from '../../../services/userRegistrationService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetDialog, setResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminComments, setAdminComments] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ user: User } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  
  // Edit user state
  const [editDialog, setEditDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<UpdateUserDto>({});
  const [editLoading, setEditLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const userRoles = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'RCC', label: 'RCC Coordinator' },
    { value: 'EMS', label: 'EMS Operator' },
    { value: 'DATA_COLLECTOR', label: 'Data Collector' },
    { value: 'CATH_LAB_USER', label: 'Cath Lab User' },
  ];

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userManagementService.getAllUsers(page, 10, roleFilter || undefined);
      setUsers(response.data);
      setTotalPages(response.pages);
    } catch (err: any) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsData = await userRegistrationService.getHospitals();
        setHospitals(hospitalsData);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      }
    };

    fetchHospitals();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'RCC':
        return 'primary';
      case 'EMS':
        return 'success';
      case 'DATA_COLLECTOR':
        return 'warning';
      case 'CATH_LAB_USER':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'LOCKED':
        return 'error';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    // Validate password
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setResetLoading(true);
      setError(null);

      const result = await userManagementService.resetUserPassword(
        selectedUser.id,
        newPassword,
        adminComments || undefined
      );
      
      setResetResult(result);
      setResetDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setAdminComments('');
      loadUsers(); // Refresh users list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setResetDialog(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setAdminComments('');
    setError(null);
  };

  const handleCloseResultDialog = () => {
    setResetResult(null);
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setEditData({
      role: user.role,
      hospitalId: user.hospitalId || '',
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;

    try {
      setEditLoading(true);
      setError(null);

      await userManagementService.updateUser(editUser.id, editData);
      
      setEditDialog(false);
      setEditUser(null);
      setEditData({});
      loadUsers(); // Refresh users list
      alert('User updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setEditUser(null);
    setEditData({});
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          User Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadUsers}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage system users, reset passwords, and view user information
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1); // Reset to first page when filtering
              }}
              label="Filter by Role"
            >
              {userRoles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      {user.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status} 
                      color={getStatusColor(user.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.hospital ? (
                      <Box display="flex" alignItems="center">
                        <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">{user.hospital.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.hospital.id}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <Box>
                        <Typography variant="body2">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(user.lastLogin).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Never
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => {
                            setSelectedUser(user);
                            setResetDialog(true);
                          }}
                          disabled={user.status !== 'ACTIVE'}
                        >
                          <LockReset />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog 
        open={resetDialog} 
        onClose={handleCloseResetDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reset Password for {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Role:</strong> {selectedUser.role}
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This will set a new password for the user. The user will be able to login immediately with this password.
              </Alert>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resetLoading}
            helperText="Minimum 8 characters"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={resetLoading}
            helperText="Must match the password above"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Comments (Optional)"
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
            placeholder="Add any notes about why the password was reset..."
            disabled={resetLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog} disabled={resetLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword}
            color="warning"
            variant="contained"
            disabled={resetLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
          >
            {resetLoading ? <CircularProgress size={20} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Result Dialog */}
      <Dialog 
        open={!!resetResult} 
        onClose={handleCloseResultDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Password Reset Successful
        </DialogTitle>
        <DialogContent>
          {resetResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Password has been reset successfully for {resetResult.user.firstName} {resetResult.user.lastName}
              </Alert>
              
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Success:</strong> The user can now login with the new password you set.
                  Make sure to share the new password securely with the user.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit User: {editUser?.firstName} {editUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {editUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {editUser.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Current Role:</strong> {editUser.role}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Current Hospital:</strong> {editUser.hospital?.name || 'Not assigned'}
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editData.firstName || ''}
                onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editData.lastName || ''}
                onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editData.phoneNumber || ''}
                onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editData.role || ''}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  disabled={editLoading}
                  label="Role"
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="RCC">RCC Coordinator</MenuItem>
                  <MenuItem value="EMS">EMS Operator</MenuItem>
                  <MenuItem value="DATA_COLLECTOR">Data Collector</MenuItem>
                  <MenuItem value="CATH_LAB_USER">Cath Lab User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={editData.hospitalId || ''}
                  onChange={(e) => setEditData({...editData, hospitalId: e.target.value})}
                  disabled={editLoading}
                  label="Hospital"
                >
                  <MenuItem value="">
                    <em>No hospital assigned</em>
                  </MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={editLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
