import React from 'react';
import {
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';
import { textFieldSx } from './formStyles';

interface HospitalAdditionalSettingsProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
    onOpenTraumaLevel: () => void;
    traumaLevelRef: React.RefObject<HTMLDivElement>;
}

export const HospitalAdditionalSettings: React.FC<HospitalAdditionalSettingsProps> = ({
    formData,
    onChange,
    onOpenTraumaLevel,
    traumaLevelRef,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={textFieldSx} ref={traumaLevelRef}>
                    <InputLabel>Trauma Level</InputLabel>
                    <Select
                        value={formData.traumaLevel || 'NONE'}
                        onChange={(e) => onChange('traumaLevel', e.target.value)}
                        label="Trauma Level"
                        onOpen={onOpenTraumaLevel}
                        sx={{ borderRadius: 2 }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    maxHeight: 120,
                                    mt: 0.5,
                                },
                            },
                        }}
                    >
                        <MenuItem value="NONE">None</MenuItem>
                        <MenuItem value="LEVEL_1">Level 1</MenuItem>
                        <MenuItem value="LEVEL_2">Level 2</MenuItem>
                        <MenuItem value="LEVEL_3">Level 3</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
};
