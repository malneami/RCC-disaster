import React from 'react';
import {
    Grid,
    TextField,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';
import { textFieldSx } from './formStyles';

interface HospitalLocationFormProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
    errors: Record<string, string>;
}

export const HospitalLocationForm: React.FC<HospitalLocationFormProps> = ({
    formData,
    onChange,
    errors,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={formData.latitude ?? ''}
                    onChange={(e) => onChange('latitude', e.target.value === '' ? undefined : Number(e.target.value))}
                    error={!!errors.latitude}
                    helperText={errors.latitude || 'Range: -90 to 90'}
                    sx={textFieldSx}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={formData.longitude ?? ''}
                    onChange={(e) => onChange('longitude', e.target.value === '' ? undefined : Number(e.target.value))}
                    error={!!errors.longitude}
                    helperText={errors.longitude || 'Range: -180 to 180'}
                    sx={textFieldSx}
                />
            </Grid>
        </Grid>
    );
};
