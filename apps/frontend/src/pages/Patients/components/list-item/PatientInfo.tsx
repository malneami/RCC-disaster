import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { Patient } from '../../../../services/patientService';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface PatientInfoProps {
    patient: Patient;
    privacyColors: { bg: string; color: string; border: string };
}

const PatientInfo: React.FC<PatientInfoProps> = ({ patient, privacyColors }) => {
    return (
        <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        fontSize: '1.1875rem',
                        color: '#1a237e',
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {patient.firstName} {patient.middleName && `${patient.middleName} `}
                    {patient.lastName}
                </Typography>
            </Box>

            {/* Secondary Info Row */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                    mt: 1,
                }}
            >
                {/* MRN */}
                {patient.mrn && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#757575',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            MRN:
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: '#424242',
                                fontSize: '0.8125rem',
                            }}
                        >
                            {patient.mrn}
                        </Typography>
                    </Box>
                )}

                {/* National ID */}
                {patient.nationalId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#757575',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            ID:
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: '#424242',
                                fontSize: '0.8125rem',
                            }}
                        >
                            {patient.nationalId}
                        </Typography>
                    </Box>
                )}

                {/* Age/Gender Badge */}
                <Chip
                    icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${formatAgeForDisplay(
                        patient.age,
                        patient.dateOfBirth,
                        patient.ageMonths,
                        patient.ageDays
                    )} • ${patient.gender === 'MALE' ? 'M' : 'F'}`}
                    size="small"
                    sx={{
                        height: '26px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        color: '#1565c0',
                        border: '1px solid rgba(79, 172, 254, 0.3)',
                        boxShadow: '0 2px 4px rgba(79, 172, 254, 0.1)',
                        transition: 'all 0.2s ease',
                        '& .MuiChip-icon': {
                            color: '#1976d2',
                        },
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 3px 6px rgba(79, 172, 254, 0.15)',
                        },
                    }}
                />

                {/* Privacy Level Badge */}
                <Chip
                    label={patient.privacyLevel}
                    size="small"
                    sx={{
                        height: '24px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: privacyColors.bg,
                        color: privacyColors.color,
                        border: `1px solid ${privacyColors.border}`,
                    }}
                />
            </Box>
        </Box>
    );
};

export default PatientInfo;
