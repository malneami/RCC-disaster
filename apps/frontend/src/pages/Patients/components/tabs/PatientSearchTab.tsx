import React from 'react';
import { Box, Typography } from '@mui/material';
import PortalPatientSearch from '../../../../components/Common/PortalPatientSearch';
import ModernPatientList from '../ModernPatientList';
import { Patient, PatientWithDetails } from '../../../../services/patientService';

interface PatientSearchTabProps {
    onPatientSelect: (patient: Patient) => void;
    onViewDuplicate: (patient: Patient) => void;
    onViewPatient: (patient: Patient) => void;
    onEditPatient: (patient: Patient) => void;
    patients: PatientWithDetails[];
}

const PatientSearchTab: React.FC<PatientSearchTabProps> = ({
    onPatientSelect,
    onViewDuplicate,
    onViewPatient,
    onEditPatient,
    patients,
}) => {
    return (
        <Box>
            <PortalPatientSearch
                placeholder="Search by patient name, MRN, or National ID..."
                onPatientSelect={onPatientSelect}
                portalType="patients"
                showDuplicates={true}
                onViewDuplicate={onViewDuplicate}
            />

            {/* Recent Patients */}
            <Box sx={{ mt: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        mb: 3,
                        fontWeight: 600,
                        color: '#1a237e',
                    }}
                >
                    Recent Patients
                </Typography>
                <ModernPatientList
                    patients={patients.slice(0, 10)}
                    loading={false}
                    emptyMessage="No recent patients found"
                    onViewPatient={onViewPatient}
                    onEditPatient={onEditPatient}
                    onExportPatient={(patient: Patient) => {
                        // Export functionality can be added here if needed
                        console.log('Export patient:', patient);
                    }}
                />
            </Box>
        </Box>
    );
};

export default PatientSearchTab;
