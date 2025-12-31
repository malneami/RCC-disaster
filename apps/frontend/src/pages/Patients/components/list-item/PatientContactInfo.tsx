import React from 'react';
import { Box, Typography } from '@mui/material';
import { Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { Patient } from '../../../../services/patientService';

interface PatientContactInfoProps {
    patient: Patient;
}

const PatientContactInfo: React.FC<PatientContactInfoProps> = ({ patient }) => {
    return (
        <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Contact Info Row */}
            {(patient.phoneNumber || patient.email) && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mt: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    {patient.phoneNumber && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#616161',
                            }}
                        >
                            <PhoneIcon sx={{ fontSize: '14px' }} />
                            <Typography
                                variant="caption"
                                sx={{ fontSize: '0.75rem', color: '#616161' }}
                            >
                                {patient.phoneNumber}
                            </Typography>
                        </Box>
                    )}
                    {patient.email && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#616161',
                            }}
                        >
                            <EmailIcon sx={{ fontSize: '14px' }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.75rem',
                                    color: '#616161',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '200px',
                                }}
                            >
                                {patient.email}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Last Accessed */}
            {patient.lastAccessedAt && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 1,
                        color: '#9e9e9e',
                        fontSize: '0.7rem',
                    }}
                >
                    Last accessed: {format(new Date(patient.lastAccessedAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
            )}
        </Box>
    );
};

export default PatientContactInfo;
