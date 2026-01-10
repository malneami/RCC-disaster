import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    alpha,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    PersonAdd,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userManagementService, CreateUserDto } from '../../../services/userManagementService';
import { hospitalService } from '../../../services/hospitalService';

interface Hospital {
    id: string;
    name: string;
}

interface CreateUserDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const userRoles = [
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

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSuccess }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState<CreateUserDto>({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: '',
        phoneNumber: '',
        hospitalId: '',
    });

    useEffect(() => {
        if (open) {
            loadHospitals();
            // Reset form when dialog opens
            setFormData({
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                role: '',
                phoneNumber: '',
                hospitalId: '',
            });
            setError(null);
        }
    }, [open]);

    const loadHospitals = async () => {
        try {
            const hospitalsList = await hospitalService.getAllHospitals();
            setHospitals(hospitalsList.map(h => ({ id: h.id, name: h.name })));
        } catch (err) {
            console.error('Failed to load hospitals:', err);
        }
    };

    const handleChange = (field: keyof CreateUserDto, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.firstName.trim()) {
            setError('First name is required');
            return false;
        }
        if (!formData.lastName.trim()) {
            setError('Last name is required');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (!formData.role) {
            setError('Role is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            const submitData: CreateUserDto = {
                email: formData.email.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                password: formData.password,
                role: formData.role,
                ...(formData.phoneNumber?.trim() && { phoneNumber: formData.phoneNumber.trim() }),
                ...(formData.hospitalId && { hospitalId: formData.hospitalId }),
            };

            const result = await userManagementService.createUser(submitData);

            enqueueSnackbar(`User ${result.user.firstName} ${result.user.lastName} created successfully!`, {
                variant: 'success',
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create user';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: alpha('#2563eb', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <PersonAdd sx={{ color: '#2563eb' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Create New User
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Add a new user to the system
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                            fullWidth
                            required
                            size="small"
                        />
                        <TextField
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                            fullWidth
                            required
                            size="small"
                        />
                    </Box>

                    <TextField
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        fullWidth
                        required
                        size="small"
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        fullWidth
                        required
                        size="small"
                        helperText="Minimum 8 characters"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="+966501234567"
                    />

                    <FormControl fullWidth size="small" required>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={formData.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                            label="Role"
                        >
                            {userRoles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Hospital (Optional)</InputLabel>
                        <Select
                            value={formData.hospitalId}
                            onChange={(e) => handleChange('hospitalId', e.target.value)}
                            label="Hospital (Optional)"
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {hospitals.map((hospital) => (
                                <MenuItem key={hospital.id} value={hospital.id}>
                                    {hospital.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : <PersonAdd />}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export default CreateUserDialog;