import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import {
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';

interface ContactTabProps {
    hospital: Hospital;
}

export const ContactTab: React.FC<ContactTabProps> = ({ hospital }) => (
    <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
            Contact Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {hospital.address && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#3b82f6', 0.1) }}>
                        <LocationIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                            Address
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem' }}>
                            {hospital.address}
                        </Typography>
                    </Box>
                </Box>
            )}

            {hospital.contactPhone && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#10b981', 0.1) }}>
                        <PhoneIcon sx={{ fontSize: 18, color: '#10b981' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                            Phone
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem' }}>
                            {hospital.contactPhone}
                        </Typography>
                    </Box>
                </Box>
            )}

            {hospital.contactEmail && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#8b5cf6', 0.1) }}>
                        <EmailIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                            Email
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem' }}>
                            {hospital.contactEmail}
                        </Typography>
                    </Box>
                </Box>
            )}

            {!hospital.address && !hospital.contactPhone && !hospital.contactEmail && (
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                    No contact information available
                </Typography>
            )}
        </Box>
    </Box>
);
