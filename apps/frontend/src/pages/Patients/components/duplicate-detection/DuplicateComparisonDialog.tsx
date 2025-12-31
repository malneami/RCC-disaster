import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Grid,
    Button,
    Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { format } from 'date-fns';
import { DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { GRADIENT_COLORS } from './DuplicateDetectionConstants';

interface DuplicateComparisonDialogProps {
    open: boolean;
    onClose: () => void;
    selectedGroup: DuplicateGroup | null;
}

const DuplicateComparisonDialog: React.FC<DuplicateComparisonDialogProps> = ({
    open,
    onClose,
    selectedGroup,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
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
                        Patient Comparison
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
                    <Grid container spacing={2}>
                        {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => (
                            <Grid item xs={12} md={6} key={p.patientId}>
                                <Box
                                    sx={{
                                        background:
                                            p.patientId === selectedGroup.primaryPatientId
                                                ? 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)'
                                                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border:
                                            p.patientId === selectedGroup.primaryPatientId
                                                ? '2px solid rgba(110, 198, 255, 0.4)'
                                                : '1px solid rgba(110, 198, 255, 0.15)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: '#1a237e',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {p.patient?.firstName} {p.patient?.lastName}
                                        </Typography>
                                        {p.patientId === selectedGroup.primaryPatientId && (
                                            <Chip
                                                label="Primary"
                                                size="small"
                                                sx={{
                                                    background: GRADIENT_COLORS.primary,
                                                    color: '#ffffff',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                                MRN
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                                                {p.patient?.mrn || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                                National ID
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                                                {p.patient?.nationalId || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                                Phone
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                                                {p.patient?.phoneNumber || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                                Created
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                                                {p.patient?.createdAt
                                                    ? format(new Date(p.patient.createdAt), 'MMM dd, yyyy')
                                                    : 'N/A'}
                                            </Typography>
                                        </Box>
                                        {p.patient?.createdBy && (
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                                    Created By
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#424242', mt: 0.5 }}>
                                                    {p.patient.createdBy.firstName} {p.patient.createdBy.lastName}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        background: GRADIENT_COLORS.primary,
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(110, 198, 255, 0.35)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4db8ff 0%, #6ec6ff 100%)',
                            boxShadow: '0 6px 16px rgba(110, 198, 255, 0.45)',
                        },
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DuplicateComparisonDialog;
