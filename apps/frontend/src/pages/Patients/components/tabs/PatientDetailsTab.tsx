import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Fab } from '@mui/material';
import { Person } from '@mui/icons-material';
import { Patient, PatientWithDetails } from '../../../../services/patientService';

interface PatientDetailsTabProps {
    selectedPatient: Patient | null;
    onViewPatient: (patient: Patient) => void;
}

const PatientDetailsTab: React.FC<PatientDetailsTabProps> = ({
    selectedPatient,
    onViewPatient,
}) => {
    if (!selectedPatient) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    Select a Patient
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Use the Patient Search tab to find and select a patient to view their details.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
                Patient Details: {selectedPatient.firstName} {selectedPatient.lastName}
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Basic Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>MRN:</strong> {selectedPatient.mrn}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>National ID:</strong> {selectedPatient.nationalId}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Gender:</strong> {selectedPatient.gender}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Date of Birth:</strong> {selectedPatient.dateOfBirth ? (() => {
                                        try {
                                            const dob = new Date(selectedPatient.dateOfBirth);
                                            const today = new Date();
                                            const minDate = new Date('1900-01-01');
                                            // Validate date of birth
                                            if (dob > today) {
                                                return `${dob.toLocaleDateString()} (Invalid: Future date)`;
                                            }
                                            if (dob < minDate) {
                                                return `${dob.toLocaleDateString()} (Invalid: Before 1900)`;
                                            }
                                            return dob.toLocaleDateString();
                                        } catch (error) {
                                            return 'Invalid date';
                                        }
                                    })() : 'N/A'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Medical Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2">
                                    <strong>Medical Records:</strong> {(selectedPatient as PatientWithDetails).medicalRecords?.length || 0}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Active Tickets:</strong> {(selectedPatient as PatientWithDetails).tickets?.filter((t: any) => t.status !== 'CLOSED').length || 0}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Blood Type:</strong> {selectedPatient.bloodType || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Allergies:</strong> {selectedPatient.allergies || 'None'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Fab
                    variant="extended"
                    color="primary"
                    onClick={() => onViewPatient(selectedPatient)}
                    sx={{ backgroundColor: '#7b1fa2' }}
                >
                    <Person sx={{ mr: 1 }} />
                    View Full Details
                </Fab>
            </Box>
        </Box>
    );
};

export default PatientDetailsTab;
