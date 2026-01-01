import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';
import { textFieldSx } from './formStyles';

interface HospitalBasicInfoFormProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
    errors: Record<string, string>;
}

export const HospitalBasicInfoForm: React.FC<HospitalBasicInfoFormProps> = ({
    formData,
    onChange,
    errors,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Hospital Name"
                    value={formData.name || ''}
                    onChange={(e) => onChange('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    sx={textFieldSx}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Address"
                    value={formData.address || ''}
                    onChange={(e) => onChange('address', e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                    sx={textFieldSx}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={textFieldSx}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={formData.status || 'AVAILABLE'}
                        onChange={(e) => onChange('status', e.target.value)}
                        label="Status"
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="AVAILABLE">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                                Available
                            </Box>
                        </MenuItem>
                        <MenuItem value="ACTIVE">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                                Active
                            </Box>
                        </MenuItem>
                        <MenuItem value="LIMITED">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                Limited
                            </Box>
                        </MenuItem>
                        <MenuItem value="CRITICAL">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                Critical
                            </Box>
                        </MenuItem>
                        <MenuItem value="OFFLINE">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.500' }} />
                                Offline
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={textFieldSx}>
                    <InputLabel>Cluster</InputLabel>
                    <Select
                        value={formData.cluster || 'Jazan'}
                        onChange={(e) => onChange('cluster', e.target.value)}
                        label="Cluster"
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="Jazan">Jazan</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
};
