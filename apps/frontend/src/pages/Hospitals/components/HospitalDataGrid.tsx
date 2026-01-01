import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Fade,
    alpha,
} from '@mui/material';
import {
    LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../services/hospitalService';
import { HospitalRow } from './grid/HospitalRow';
import { HospitalGridToolbar } from './grid/HospitalGridToolbar';
import { GridStats } from './grid/GridStats';
import { useHospitalGrid } from '../hooks/useHospitalGrid';

interface HospitalDataGridProps {
    hospitals: Hospital[];
    onRowClick?: (hospital: Hospital) => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

const HospitalDataGrid: React.FC<HospitalDataGridProps> = ({
    hospitals,
    onRowClick,
    onUpdateCapacity,
    onViewDashboard,
}) => {
    const {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        filteredHospitals,
        stats
    } = useHospitalGrid(hospitals);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Bar */}
            <HospitalGridToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
            />

            {/* Quick Stats */}
            <GridStats stats={stats} />

            {/* Results Count */}
            {searchQuery && (
                <Fade in>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        تم العثور على <strong>{filteredHospitals.length}</strong> نتيجة
                    </Typography>
                </Fade>
            )}

            {/* Hospital List */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha('#000', 0.1),
                        borderRadius: 3,
                        '&:hover': { backgroundColor: alpha('#000', 0.2) },
                    },
                }}
            >
                {filteredHospitals.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: '16px',
                            border: '2px dashed',
                            borderColor: 'divider',
                        }}
                    >
                        <HospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                            لا توجد نتائج
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            جرب البحث بكلمات مختلفة
                        </Typography>
                    </Paper>
                ) : (
                    filteredHospitals.map((hospital, index) => (
                        <HospitalRow
                            key={hospital.id}
                            hospital={hospital}
                            index={index}
                            onRowClick={onRowClick}
                            onUpdateCapacity={onUpdateCapacity}
                            onViewDashboard={onViewDashboard}
                        />
                    ))
                )}
            </Box>
        </Box>
    );
};

export default HospitalDataGrid;
