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
    Chip,
    Checkbox,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { GRADIENT_COLORS } from './DuplicateDetectionConstants';

interface DuplicateMergeDialogProps {
    open: boolean;
    onClose: () => void;
    selectedGroup: DuplicateGroup | null;
    primaryPatientId: string;
    handleMerge: (primaryId: string, duplicateIds: string[]) => void;
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
    const [selectedPrimaryId, setSelectedPrimaryId] = React.useState<string>(primaryPatientId);
    const [selectedMergeIds, setSelectedMergeIds] = React.useState<string[]>([]);

    // Sync state when props change
    React.useEffect(() => {
        if (open) {
            setSelectedPrimaryId(primaryPatientId);
            // Default: Select all duplicates passed from parent (which usually excludes primary)
            setSelectedMergeIds(selectedDuplicates);
        }
    }, [open, primaryPatientId, selectedDuplicates]);

    const handlePrimaryChange = (newPrimaryId: string) => {
        const oldPrimaryId = selectedPrimaryId;
        setSelectedPrimaryId(newPrimaryId);

        // When primary changes:
        // 1. Remove new primary from merge list (if present)
        // 2. Add old primary to merge list (it becomes a duplicate)
        setSelectedMergeIds(prev => {
            const newIds = prev.filter(id => id !== newPrimaryId);
            if (oldPrimaryId && oldPrimaryId !== newPrimaryId && !newIds.includes(oldPrimaryId)) {
                newIds.push(oldPrimaryId);
            }
            return newIds;
        });
    };

    const handleToggleMerge = (patientId: string) => {
        if (patientId === selectedPrimaryId) return; // Cannot toggle primary

        setSelectedMergeIds(prev => {
            if (prev.includes(patientId)) {
                return prev.filter(id => id !== patientId);
            } else {
                return [...prev, patientId];
            }
        });
    };

    const handleMergeClick = () => {
        handleMerge(selectedPrimaryId, selectedMergeIds);
    };

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
                            Select the <strong>Primary Record</strong> to keep, and check the <strong>Duplicate Records</strong> to merge into it.
                            Unchecked records will remain as independent patients (false positives).
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
                            Select Primary & Duplicates:
                        </Typography>

                        {selectedGroup.patients.map((p: DuplicateMatch & { patientId: string; patient?: any }) => {
                            const isSelectedPrimary = p.patientId === selectedPrimaryId;
                            const isCheckedForMerge = selectedMergeIds.includes(p.patientId);

                            return (
                                <Box
                                    key={p.patientId}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2,
                                    }}
                                >
                                    {/* Selection Controls */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1,
                                            mr: 1
                                        }}
                                    >
                                        <Box
                                            onClick={() => handlePrimaryChange(p.patientId)}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                border: isSelectedPrimary ? '6px solid #2196f3' : '2px solid #bdbdbd',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: '#2196f3' },
                                                mb: 0.5
                                            }}
                                            title="Set as Primary"
                                        />
                                        <Checkbox
                                            checked={isCheckedForMerge}
                                            onChange={() => handleToggleMerge(p.patientId)}
                                            disabled={isSelectedPrimary}
                                            sx={{
                                                p: 0,
                                                color: isSelectedPrimary ? 'transparent' : '#bdbdbd',
                                                '&.Mui-checked': { color: '#ef5350' },
                                            }}
                                            title={isSelectedPrimary ? "Primary record cannot be merged" : "Merge this record"}
                                        />
                                    </Box>

                                    {/* Patient Card */}
                                    <Box
                                        onClick={() => !isSelectedPrimary && handleToggleMerge(p.patientId)}
                                        sx={{
                                            flex: 1,
                                            cursor: !isSelectedPrimary ? 'pointer' : 'default',
                                            background: isSelectedPrimary
                                                ? 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)'
                                                : (isCheckedForMerge
                                                    ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' // Reddish for "will be deleted/merged"
                                                    : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'),
                                            borderRadius: '12px',
                                            padding: '16px',
                                            border: isSelectedPrimary
                                                ? '2px solid #2196f3'
                                                : (isCheckedForMerge ? '1px solid #ef5350' : '1px solid rgba(0,0,0,0.12)'),
                                            transition: 'all 0.2s',
                                            opacity: (!isSelectedPrimary && !isCheckedForMerge) ? 0.7 : 1, // Dim if ignored
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    background: isSelectedPrimary ? GRADIENT_COLORS.primary : (isCheckedForMerge ? '#ef5350' : '#bdbdbd'),
                                                    fontSize: '1.2rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {p.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                                                {p.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ fontWeight: 600, color: '#1a237e' }}>
                                                        {p.patient?.firstName} {p.patient?.lastName}
                                                    </Typography>
                                                    {isSelectedPrimary && (
                                                        <Chip label="Primary (To Keep)" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                    )}
                                                    {isCheckedForMerge && (
                                                        <Chip label="Duplicate (To Merge)" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                    )}
                                                    {!isSelectedPrimary && !isCheckedForMerge && (
                                                        <Chip label="Ignored" size="small" sx={{ height: 20, fontSize: '0.7rem', opacity: 0.7 }} />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem', mt: 0.5 }}>
                                                    MRN: {p.patient?.mrn || 'N/A'} | National ID: {p.patient?.nationalId || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                                                    {p.patient?.createdAt ? `Created: ${new Date(p.patient.createdAt).toLocaleDateString()}` : ''} ({Math.round(p.confidence * 100)}% Match)
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
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
                    onClick={handleMergeClick}
                    variant="contained"
                    disabled={loading || !selectedPrimaryId || selectedMergeIds.length === 0}
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
                    Merge {selectedMergeIds.length} Record{selectedMergeIds.length !== 1 ? 's' : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DuplicateMergeDialog;
