import React from 'react';
import { Box, Typography } from '@mui/material';
import { Hospital } from '../../../../services/hospitalService';
import { BedRow } from './DrawerComponents';

interface CapacityTabProps {
    hospital: Hospital;
}

export const CapacityTab: React.FC<CapacityTabProps> = ({ hospital }) => (
    <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
            Bed Capacity Breakdown
        </Typography>
        <Box sx={{ backgroundColor: '#f8fafc', borderRadius: 2, p: 2 }}>
            <BedRow label="ICU Beds" available={hospital.icuBedsAvailable} total={hospital.icuBeds} color="#ef4444" />
            <BedRow label="PICU Beds" available={hospital.picuBedsAvailable} total={hospital.picuBeds} color="#f59e0b" />
            {hospital.nicuBeds > 0 && (
                <BedRow label="NICU Beds" available={hospital.nicuBedsAvailable} total={hospital.nicuBeds} color="#3b82f6" />
            )}
            <BedRow label="Male Ward" available={hospital.maleBedsAvailable} total={hospital.maleBeds} color="#8b5cf6" />
            <BedRow label="Female Ward" available={hospital.femaleBedsAvailable} total={hospital.femaleBeds} color="#ec4899" />
            <BedRow label="Pediatric" available={hospital.pediatricBedsAvailable} total={hospital.pediatricBeds} color="#14b8a6" />
            <BedRow label="Standard" available={hospital.standardBedsAvailable} total={hospital.standardBeds} color="#64748b" />
        </Box>
    </Box>
);
