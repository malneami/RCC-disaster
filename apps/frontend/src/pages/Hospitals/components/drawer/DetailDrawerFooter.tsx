import React from 'react';
import { Box, Button, useTheme } from '@mui/material';
import {
    Edit as EditIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';

interface DetailDrawerFooterProps {
    hospital: Hospital;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

export const DetailDrawerFooter: React.FC<DetailDrawerFooterProps> = ({
    hospital,
    onUpdateCapacity,
    onViewDashboard,
}) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: '#f8fafc',
                display: 'flex',
                gap: 1.5,
                mt: 'auto',
            }}
        >
            <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => onUpdateCapacity(hospital)}
                fullWidth
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
                Update Capacity
            </Button>
            <Button
                variant="outlined"
                startIcon={<DashboardIcon />}
                onClick={() => onViewDashboard(hospital.id)}
                fullWidth
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
                Dashboard
            </Button>
        </Box>
    );
};
