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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  LinearProgress,

  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  alpha,
} from '@mui/material';
import {
  Refresh,
  Edit,
  Email,
  Business,
  ContentCopy,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userManagementService, User } from '../../../services/userManagementService';
import { userRegistrationService } from '../../../services/userRegistrationService';
import AdminStatsGrid from './AdminStatsGrid';
import UserDetailDrawer from './UserDetailDrawer';

const UserManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete user state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ message: string; user: User } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeAdmins: 0
  });

  const userRoles = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'RCC', label: 'RCC Coordinator' },
    { value: 'EMS', label: 'EMS Operator' },
    { value: 'DATA_COLLECTOR', label: 'Data Collector' },
    { value: 'CATH_LAB_USER', label: 'Cath Lab User' },
    { value: 'HOSPITAL_USER', label: 'Hospital User' },
    { value: 'ED_NURSE', label: 'ED Nurse' },
    { value: 'UNIT_NURSE', label: 'Unit Nurse' },
    { value: 'BED_COORDINATOR', label: 'Bed Coordinator' },
  ];

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [response, requests] = await Promise.all([
        userManagementService.getAllUsers(page, 10, roleFilter || undefined, searchQuery || undefined),
        userRegistrationService.getAllRegistrationRequests()
      ]);
      setUsers(response.data);
      setTotalPages(response.pages);

      // Calculate basic stats for the dashboard
      const total = response.total; // Assuming total comes from metadata
      const pending = requests.filter(r => r.status === 'PENDING').length;
      const admins = response.data.filter(u => u.role === 'ADMIN').length; // This is naive, ideally from backend

      setStats({
        totalUsers: total || response.data.length,
        pendingRequests: pending,
        activeAdmins: admins
      });
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, roleFilter, searchQuery]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'INACTIVE':
        return '#64748b';
      case 'LOCKED':
        return '#ef4444';
      case 'SUSPENDED':
        return '#f59e0b';
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

  const handleOpenDrawer = (user: User) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };



  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      setError(null);

      const result = await userManagementService.deleteUser(userToDelete.id);

      setDeleteResult(result);
      setDeleteDialog(false);
      setUserToDelete(null);
      loadUsers(); // Refresh users list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
    setUserToDelete(null);
    setError(null);
  };

  const handleCloseDeleteResult = () => {
    setDeleteResult(null);
  };

  // if (loading) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            User Management Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control center for system access, security roles, and user accounts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={loadUsers}
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
          Sync Data
        </Button>
      </Box>

      <AdminStatsGrid stats={stats} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Control Bar */}
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
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>All Roles</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            label="All Roles"
            sx={{ borderRadius: 2, bgcolor: 'background.default' }}
          >
            {userRoles.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: 'none' }}>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: alpha('#f8fafc', 0.5) }}>
              <TableRow>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>USER DETAILS</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>ROLE</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>HOSPITAL</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>LAST ACCESS</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => handleOpenDrawer(user)}
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
                        navigator.clipboard.writeText(user.id);
                        enqueueSnackbar('Full ID copied to clipboard', { variant: 'info' });
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
                      {user.id.slice(0, 8)}...
                      <ContentCopy sx={{ fontSize: 12 }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: alpha('#2563eb', 0.1),
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '')}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 12 }} /> {user.email}
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
                      ...getRoleBadgeStyles(user.role)
                    }}>
                      {user.role}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getStatusColor(user.status) }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user.status}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {user.hospital ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {user.hospital.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500, display: 'block' }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </Typography>
                    {user.lastLogin && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(user); }}>
                      <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
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

      <UserDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={selectedUser}
        onUpdateSuccess={loadUsers}
      />

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete User: {userToDelete?.firstName} {userToDelete?.lastName}
        </DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {userToDelete.firstName} {userToDelete.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {userToDelete.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Role:</strong> {userToDelete.role}
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Soft Delete:</strong> The user will be deactivated but their data will be preserved in the database for audit purposes.
                </Typography>
                <Typography variant="body2">
                  This will:
                </Typography>
                <ul>
                  <li>Set the user status to INACTIVE</li>
                  <li>Remove access to all system features</li>
                  <li>Prevent future login attempts</li>
                  <li>Preserve user data for audit trails</li>
                  <li>Hide user from active user lists</li>
                </ul>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                  Note: Users with active assignments or pending tickets cannot be deleted.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Result Dialog */}
      <Dialog
        open={!!deleteResult}
        onClose={handleCloseDeleteResult}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          User Deleted Successfully
        </DialogTitle>
        <DialogContent>
          {deleteResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                {deleteResult.message}
              </Alert>

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Success:</strong> The user has been deactivated (soft deleted).
                  The user will no longer be able to access any system features, but their data is preserved for audit purposes.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteResult} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
