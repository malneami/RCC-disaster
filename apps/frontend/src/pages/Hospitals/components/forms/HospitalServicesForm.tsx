import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { CreateHospitalDto } from '../../../../services/hospitalService';

interface HospitalServicesFormProps {
    formData: CreateHospitalDto;
    onChange: (field: keyof CreateHospitalDto, value: any) => void;
}

export const HospitalServicesForm: React.FC<HospitalServicesFormProps> = ({
    formData,
    onChange,
}) => {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!formData.hasStemiService}
                                onChange={(e) => onChange('hasStemiService', e.target.checked)}
                                color="error"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                ❤️ STEMI Service
                            </Typography>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!formData.hasStrokeService}
                                onChange={(e) => onChange('hasStrokeService', e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                🧠 Stroke Service
                            </Typography>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!formData.hasTraumaService}
                                onChange={(e) => onChange('hasTraumaService', e.target.checked)}
                                color="warning"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                🚑 Trauma Service
                            </Typography>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!formData.hasStrokeUnit}
                                onChange={(e) => onChange('hasStrokeUnit', e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Stroke Unit
                            </Typography>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!formData.hasCardiologyCenter}
                                onChange={(e) => onChange('hasCardiologyCenter', e.target.checked)}
                                color="error"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Cardiology Center
                            </Typography>
                        }
                    />
                </Grid>
            </Grid>
        </Paper>
    );
};
