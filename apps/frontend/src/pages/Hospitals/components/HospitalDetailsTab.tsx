import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faExclamationTriangle, faMedkit } from '@fortawesome/free-solid-svg-icons';
import { Hospital } from '../../../services/hospitalService';
import { shadows, spacing } from '../styles/hospitalDashboardTokens';
import HospitalCoordinatesEditor from './HospitalCoordinatesEditor';

interface HospitalDetailsTabProps {
    hospital: Hospital;
    onHospitalUpdate: (updatedHospital: Hospital) => void;
}

export const HospitalDetailsTab: React.FC<HospitalDetailsTabProps> = ({
    hospital,
    onHospitalUpdate,
}) => {
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 600,
                    color: '#0F172A',
                    mb: 3,
                }}
            >
                Hospital Details
            </Typography>

            <HospitalCoordinatesEditor
                hospital={hospital}
                onHospitalUpdate={onHospitalUpdate}
            />

            <Grid container spacing={3}>
                {/* Contact Information Card */}
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={0}
                        sx={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: spacing.borderRadius.lg,
                            boxShadow: shadows.elevated,
                            border: '1px solid rgba(0, 0, 0, 0.04)',
                            p: 3,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '10px',
                                    backgroundColor: alpha('#0284C7', 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2,
                                }}
                            >
                                <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#0284C7', fontSize: 20 }} />
                            </Box>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700, color: '#0F172A' }}
                            >
                                Contact Information
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Phone */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    backgroundColor: '#F0F9FF',
                                    borderRadius: '12px',
                                    border: '1px solid #E0F2FE',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '8px',
                                        backgroundColor: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2,
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#10B981', fontSize: 16 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Phone</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                        {hospital.contactPhone || 'Not provided'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Email */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    backgroundColor: '#F0FDF4',
                                    borderRadius: '12px',
                                    border: '1px solid #D1FAE5',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '8px',
                                        backgroundColor: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2,
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <FontAwesomeIcon icon={faMedkit} style={{ color: '#0284C7', fontSize: 16 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Email</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                        {hospital.contactEmail || 'Not provided'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Emergency Dept */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    backgroundColor: hospital.emergencyDeptStatus === 'available' ? '#F0FDF4' : '#FEF2F2',
                                    borderRadius: '12px',
                                    border: `1px solid ${hospital.emergencyDeptStatus === 'available' ? '#D1FAE5' : '#FECACA'}`,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                    Emergency Dept: {hospital.emergencyDeptStatus}
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
