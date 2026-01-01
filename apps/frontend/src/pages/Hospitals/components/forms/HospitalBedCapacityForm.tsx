import React from 'react';
import {
    Grid,
    TextField,
    Paper,
    Typography,
    Box,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';
import { textFieldSx } from './formStyles';

interface HospitalBedCapacityFormProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
    errors: Record<string, string>;
}

export const HospitalBedCapacityForm: React.FC<HospitalBedCapacityFormProps> = ({
    formData,
    onChange,
    errors,
}) => {
    const renderBedSection = (
        title: string,
        totalField: keyof CreateHospitalDto,
        availableField: keyof CreateHospitalDto
    ) => (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                {title}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Total"
                        type="number"
                        value={formData[totalField] ?? 0}
                        onChange={(e) => onChange(totalField, Number(e.target.value))}
                        error={!!errors[totalField as string]}
                        helperText={errors[totalField as string]}
                        size="small"
                        sx={textFieldSx}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Available"
                        type="number"
                        value={formData[availableField] ?? 0}
                        onChange={(e) => onChange(availableField, Number(e.target.value))}
                        error={!!errors[availableField as string]}
                        helperText={errors[availableField as string]}
                        size="small"
                        sx={textFieldSx}
                    />
                </Grid>
            </Grid>
        </Paper>
    );

    return (
        <>
            <Box sx={{ mb: 2 }}>
                {renderBedSection('ICU Beds', 'icuBeds', 'icuBedsAvailable')}
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('PICU Beds', 'picuBeds', 'picuBedsAvailable')}
                </Grid>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('NICU Beds', 'nicuBeds', 'nicuBedsAvailable')}
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('Male Beds', 'maleBeds', 'maleBedsAvailable')}
                </Grid>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('Female Beds', 'femaleBeds', 'femaleBedsAvailable')}
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('Pediatric Beds', 'pediatricBeds', 'pediatricBedsAvailable')}
                </Grid>
                <Grid item xs={12} sm={6}>
                    {renderBedSection('Standard Beds', 'standardBeds', 'standardBedsAvailable')}
                </Grid>
            </Grid>
        </>
    );
};
