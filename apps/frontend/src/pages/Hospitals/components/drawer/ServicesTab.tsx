import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    Favorite as StemiIcon,
    Psychology as StrokeIcon,
    LocalFireDepartment as TraumaIcon,
    MedicalServices as ThrombolysisIcon,
    Healing as ThrombectomyIcon,
    LocalHospital as StrokeUnitIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';
import { ServiceBadge } from './DrawerComponents';

interface ServicesTabProps {
    hospital: Hospital;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ hospital }) => (
    <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
            Available Services
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            <ServiceBadge active={hospital.hasStemiService} label="STEMI" icon={<StemiIcon sx={{ fontSize: 16 }} />} color="#ef4444" />
            <ServiceBadge active={hospital.hasStrokeService} label="Stroke" icon={<StrokeIcon sx={{ fontSize: 16 }} />} color="#3b82f6" />
            <ServiceBadge active={hospital.hasTraumaService} label="Trauma" icon={<TraumaIcon sx={{ fontSize: 16 }} />} color="#f59e0b" />
            <ServiceBadge active={hospital.hasStrokeUnit} label="Stroke Unit" icon={<StrokeUnitIcon sx={{ fontSize: 16 }} />} color="#8b5cf6" />
            <ServiceBadge active={hospital.hasThrombolysis} label="Thrombolysis" icon={<ThrombolysisIcon sx={{ fontSize: 16 }} />} color="#10b981" />
            <ServiceBadge active={hospital.hasThrombectomy} label="Thrombectomy" icon={<ThrombectomyIcon sx={{ fontSize: 16 }} />} color="#ec4899" />
        </Box>

        {hospital.traumaLevel && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    Trauma Level: <strong>{hospital.traumaLevel}</strong>
                </Typography>
            </Box>
        )}
    </Box>
);
