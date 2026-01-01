import React from 'react';
import {
    Grid,
    TextField,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';
import { textFieldSx } from './formStyles';

interface HospitalContactFormProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
    errors: Record<string, string>;
}

export const HospitalContactForm: React.FC<HospitalContactFormProps> = ({
    formData,
    onChange,
    errors,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Contact Phone"
                    value={formData.contactPhone || ''}
                    onChange={(e) => onChange('contactPhone', e.target.value)}
                    placeholder="+966 50 123 4567"
                    sx={textFieldSx}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Contact Email"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => onChange('contactEmail', e.target.value)}
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail}
                    sx={textFieldSx}
                />
            </Grid>
        </Grid>
    );
};
