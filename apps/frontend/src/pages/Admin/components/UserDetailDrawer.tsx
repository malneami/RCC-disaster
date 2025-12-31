import React, { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Divider,
    Stack,
    alpha,
    CircularProgress,
} from '@mui/material';
import {
    Close,
    Person,
    Email,
    Phone,

    VpnKey,
    Block,
    CheckCircle,
    Cancel,
    Fingerprint,
    ContentCopy,
} from '@mui/icons-material';
import { User, userManagementService } from '../../../services/userManagementService';
import { UserRegistrationRequest, userRegistrationService } from '../../../services/userRegistrationService';
import { hospitalService, Hospital } from '../../../services/hospitalService';
import { useSnackbar } from 'notistack';

interface UserDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    user?: User | null;
    registrationRequest?: UserRegistrationRequest | null;
    onUpdateSuccess: () => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
    open,
    onClose,
    user,
    registrationRequest,
    onUpdateSuccess,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [hospitalsLoading, setHospitalsLoading] = useState(false);

    // States for user management
    const [role, setRole] = useState('');
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

    // States for registration requests
    const [adminComments, setAdminComments] = useState('');

    const isRequest = !!registrationRequest;
    const displayName = isRequest
        ? `${registrationRequest?.firstName} ${registrationRequest?.lastName}`
        : `${user?.firstName} ${user?.lastName}`;

    useEffect(() => {
        if (open) {
            loadHospitals();
            if (user) {
                setRole(user.role);
                // Find hospital if current user has one
                if (user.hospitalId) {
                    // We'll set this once hospitals are loaded
                }
            } else if (registrationRequest) {
                setRole(registrationRequest.requestedRole);
                setAdminComments('');
            }
        }
    }, [open, user, registrationRequest]);

    useEffect(() => {
        if (hospitals.length > 0) {
            if (user?.hospitalId) {
                const h = hospitals.find(h => h.id === user.hospitalId);
                setSelectedHospital(h || null);
            } else if (registrationRequest?.hospitalId) {
                const h = hospitals.find(h => h.id === registrationRequest.hospitalId);
                setSelectedHospital(h || null);
            } else {
                setSelectedHospital(null);
            }
        }
    }, [hospitals, user, registrationRequest]);

    const loadHospitals = async () => {
        try {
            setHospitalsLoading(true);
            const data = await hospitalService.getAllHospitals();
            setHospitals(data);
        } catch (error) {
            console.error('Failed to load hospitals:', error);
        } finally {
            setHospitalsLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!user) return;
        try {
            setLoading(true);
            await userManagementService.updateUser(user.id, {
                role,
                hospitalId: selectedHospital?.id || null as any,
            });
            enqueueSnackbar('User updated successfully', { variant: 'success' });
            onUpdateSuccess();
            onClose();
        } catch (error) {
            enqueueSnackbar('Failed to update user', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async () => {
        if (!registrationRequest) return;
        try {
            setLoading(true);
            await userRegistrationService.approveRegistrationRequest(registrationRequest.id, adminComments);
            enqueueSnackbar('Request approved successfully', { variant: 'success' });
            onUpdateSuccess();
            onClose();
        } catch (error) {
            enqueueSnackbar('Failed to approve request', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRejectRequest = async () => {
        if (!registrationRequest || !adminComments.trim()) {
            enqueueSnackbar('Please provide a reason for rejection', { variant: 'warning' });
            return;
        }
        try {
            setLoading(true);
            await userRegistrationService.rejectRegistrationRequest(registrationRequest.id, adminComments);
            enqueueSnackbar('Request rejected', { variant: 'info' });
            onUpdateSuccess();
            onClose();
        } catch (error) {
            enqueueSnackbar('Failed to reject request', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;
        // For simplicity in this UI refactor, we'll prompt or use a default
        // Ideally, this should open a small confirmation
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;

        try {
            setLoading(true);
            await userManagementService.resetUserPassword(user.id, newPassword);
            enqueueSnackbar('Password reset successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to reset password', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 480 },
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '-8px 0 24px -12px rgba(0,0,0,0.15)',
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: alpha('#2563eb', 0.1),
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Person />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                                {displayName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {isRequest ? 'Registration Request' : `User ID: ${user?.id.slice(0, 8)}...`}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
                        <Close sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                    <Stack spacing={4}>
                        {/* Information Grid */}
                        <Box>
                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block' }}>
                                Contact Information
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Email sx={{ color: 'text.disabled', fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Email Address</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{isRequest ? registrationRequest?.email : user?.email}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Phone sx={{ color: 'text.disabled', fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{isRequest ? (registrationRequest?.phoneNumber || 'N/A') : (user?.phoneNumber || 'N/A')}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Fingerprint sx={{ color: 'text.disabled', fontSize: 20 }} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Full System ID (UUID)</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontFamily: 'monospace',
                                                    color: 'primary.main',
                                                    bgcolor: alpha('#2563eb', 0.05),
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    wordBreak: 'break-all',
                                                    userSelect: 'all'
                                                }}
                                            >
                                                {isRequest ? registrationRequest?.id : user?.id}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const id = isRequest ? registrationRequest?.id : user?.id;
                                                    if (id) {
                                                        navigator.clipboard.writeText(id);
                                                        enqueueSnackbar('Full ID copied to clipboard', { variant: 'info' });
                                                    }
                                                }}
                                                sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
                                            >
                                                <ContentCopy sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Management Section */}
                        <Box>
                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block' }}>
                                Account Settings
                            </Typography>
                            <Stack spacing={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>System Role</InputLabel>
                                    <Select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        label="System Role"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="ADMIN">Administrator</MenuItem>
                                        <MenuItem value="RCC">RCC Coordinator</MenuItem>
                                        <MenuItem value="EMS">EMS Operator</MenuItem>
                                        <MenuItem value="DATA_COLLECTOR">Data Collector</MenuItem>
                                        <MenuItem value="HOSPITAL_USER">Hospital User</MenuItem>
                                    </Select>
                                </FormControl>

                                <Autocomplete
                                    options={hospitals}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedHospital}
                                    onChange={(_, newValue) => setSelectedHospital(newValue)}
                                    loading={hospitalsLoading}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Assigned Hospital"
                                            size="small"
                                            variant="outlined"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {isRequest && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                                        Registration Details
                                    </Typography>
                                    <Box sx={{ p: 2, bgcolor: alpha('#f59e0b', 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha('#f59e0b', 0.1) }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#b45309', mb: 1 }}>Justification:</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                                            "{registrationRequest?.justification || 'No justification provided'}"
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Admin Comments"
                                        placeholder="Provide context for approval/rejection..."
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        sx={{ mt: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>
                            </>
                        )}

                        {!isRequest && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block' }}>
                                        Security & Safety
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            fullWidth
                                            startIcon={<VpnKey />}
                                            onClick={handleResetPassword}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Reset Password
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            fullWidth
                                            startIcon={<Block />}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Deactivate
                                        </Button>
                                    </Stack>
                                </Box>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* Footer Actions */}
                <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                    {isRequest ? (
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                startIcon={<CheckCircle />}
                                onClick={handleApproveRequest}
                                disabled={loading}
                                sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                                Approve Account
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                fullWidth
                                startIcon={<Cancel />}
                                onClick={handleRejectRequest}
                                disabled={loading}
                                sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                                Reject
                            </Button>
                        </Stack>
                    ) : (
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleUpdateUser}
                            disabled={loading}
                            sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default UserDetailDrawer;
