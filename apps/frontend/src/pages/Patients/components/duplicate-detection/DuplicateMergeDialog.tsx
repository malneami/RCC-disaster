import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Alert,
    Avatar,
    Button,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { GRADIENT_COLORS } from './DuplicateDetectionConstants';

interface DuplicateMergeDialogProps {
    open: boolean;
    onClose: () => void;
    selectedGroup: DuplicateGroup | null;
    primaryPatientId: string;
    handleMerge: () => void;
    loading: boolean;
    selectedDuplicates: string[];
}

const DuplicateMergeDialog: React.FC<DuplicateMergeDialogProps> = ({
    open,
    onClose,
    selectedGroup,
    primaryPatientId,
    handleMerge,
    loading,
    selectedDuplicates,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                },
            }}
        >
            <Box
                sx={{
                    background: GRADIENT_COLORS.primary,
                    padding: '20px 24px',
                    borderRadius: '16px 16px 0 0',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#ffffff',
                            fontSize: '1.25rem',
                        }}
                    >
                        Merge Duplicate Patients
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#ffffff',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.2)',
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {selectedGroup && (
                    <Box>
                        <Alert
                            severity="warning"
                            sx={{
                                mb: 3,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                            }}
                        >
                            Merging will combine all duplicate records into the primary patient. This action cannot be undone.
                        </Alert>
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                fontWeight: 600,
                                color: '#1a237e',
                                fontSize: '0.9375rem',
                            }}
                        >
                            Primary Patient (will be kept):
                        </Typography>
                        {selectedGroup.patients
                            .filter((p: DuplicateMatch & { patientId: string }) => p.patientId === primaryPatientId)
                            .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                                <Box
                                    key={p.patientId}
                                    sx={{
                                        background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        mb: 2,
                                        border: '2px solid rgba(110, 198, 255, 0.4)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                background: GRADIENT_COLORS.primary,
                                                fontSize: '1.2rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {p.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                                            {p.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5 }}>
                                                {p.patient?.firstName} {p.patient?.lastName}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                                                MRN: {p.patient?.mrn || 'N/A'} | National ID: {p.patient?.nationalId || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                fontWeight: 600,
                                color: '#1a237e',
                                fontSize: '0.9375rem',
                            }}
                        >
                            Duplicates to merge (will be deleted):
                        </Typography>
                        {selectedGroup.patients
                            .filter((p: DuplicateMatch & { patientId: string }) => p.patientId !== primaryPatientId)
                            .map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                                <Box
                                    key={p.patientId}
                                    sx={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        mb: 1.5,
                                        border: '1px solid rgba(110, 198, 255, 0.15)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                background: GRADIENT_COLORS.primary,
                                                fontSize: '1.2rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {p.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                                            {p.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 600, color: '#1a237e', mb: 0.5 }}>
                                                {p.patient?.firstName} {p.patient?.lastName}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                                                MRN: {p.patient?.mrn || 'N/A'} | National ID: {p.patient?.nationalId || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: '#666',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                            background: 'rgba(0, 0, 0, 0.05)',
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleMerge}
                    variant="contained"
                    disabled={loading || !primaryPatientId || selectedDuplicates.length === 0}
                    sx={{
                        background: GRADIENT_COLORS.success,
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(141, 216, 143, 0.35)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #7bc87d 0%, #8dd88f 100%)',
                            boxShadow: '0 6px 16px rgba(141, 216, 143, 0.45)',
                        },
                        '&:disabled': {
                            background: 'rgba(0, 0, 0, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)',
                        },
                    }}
                >
                    Merge Patients
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DuplicateMergeDialog;
