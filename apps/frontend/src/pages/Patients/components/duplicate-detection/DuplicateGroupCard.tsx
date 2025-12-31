import React from 'react';
import { Box, Grid, Typography, Chip, Tooltip, IconButton, Avatar } from '@mui/material';
import { Visibility, Merge, Cancel, Badge, Phone, CalendarToday } from '@mui/icons-material';
import { format } from 'date-fns';
import { DuplicateGroup, DuplicateMatch } from '@/services/patientService';
import { GRADIENT_COLORS, getConfidenceGradient, getConfidenceColor } from './DuplicateDetectionConstants';

interface DuplicateGroupCardProps {
    group: DuplicateGroup;
    openMergeDialog: (group: DuplicateGroup) => void;
    openComparisonDialog: (group: DuplicateGroup) => void;
    handleIgnore: (patientIds: string[]) => void;
}

const DuplicateGroupCard: React.FC<DuplicateGroupCardProps> = ({
    group,
    openMergeDialog,
    openComparisonDialog,
    handleIgnore,
}) => {
    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
            }}
        >
            {/* Group Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: '#1a237e',
                            fontSize: '1.125rem',
                        }}
                    >
                        Duplicate Group ({group.patients.length} patients)
                    </Typography>
                    <Chip
                        label={`${(group.totalConfidence * 100).toFixed(0)}% Confidence`}
                        sx={{
                            background: getConfidenceGradient(group.totalConfidence),
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '28px',
                            boxShadow: `0 2px 8px ${getConfidenceColor(group.totalConfidence)}40`,
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Comparison" arrow>
                        <IconButton
                            size="small"
                            onClick={() => openComparisonDialog(group)}
                            sx={{
                                color: '#6ec6ff',
                                background: 'rgba(110, 198, 255, 0.1)',
                                '&:hover': {
                                    background: 'rgba(110, 198, 255, 0.2)',
                                    transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Merge Duplicates" arrow>
                        <IconButton
                            size="small"
                            onClick={() => openMergeDialog(group)}
                            sx={{
                                color: '#8dd88f',
                                background: 'rgba(141, 216, 143, 0.1)',
                                '&:hover': {
                                    background: 'rgba(141, 216, 143, 0.2)',
                                    transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Merge fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Ignore" arrow>
                        <IconButton
                            size="small"
                            onClick={() =>
                                handleIgnore(group.patients.map((p: DuplicateMatch & { patientId: string }) => p.patientId))
                            }
                            sx={{
                                color: '#ff9a9a',
                                background: 'rgba(255, 154, 154, 0.1)',
                                '&:hover': {
                                    background: 'rgba(255, 154, 154, 0.2)',
                                    transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Cancel fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Patient Cards */}
            <Grid container spacing={2}>
                {group.patients.map((match: DuplicateMatch & { patientId: string; patient?: any }) => {
                    const isPrimary = match.patientId === group.primaryPatientId;
                    return (
                        <Grid item xs={12} md={6} key={match.patientId}>
                            <Box
                                sx={{
                                    background: isPrimary
                                        ? 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)'
                                        : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: isPrimary
                                        ? '2px solid rgba(110, 198, 255, 0.4)'
                                        : '1px solid rgba(110, 198, 255, 0.15)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    },
                                }}
                            >
                                {isPrimary && (
                                    <Chip
                                        label="Primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            background: GRADIENT_COLORS.primary,
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                            height: '22px',
                                        }}
                                    />
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            background: GRADIENT_COLORS.primary,
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {match.patient?.firstName?.charAt(0)?.toUpperCase() || 'P'}
                                        {match.patient?.lastName?.charAt(0)?.toUpperCase() || ''}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                color: '#1a237e',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {match.patient?.firstName} {match.patient?.lastName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#666',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            Confidence: {(match.confidence * 100).toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {match.patient?.mrn && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Badge sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                                MRN: {match.patient.mrn}
                                            </Typography>
                                        </Box>
                                    )}
                                    {match.patient?.nationalId && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Badge sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                                ID: {match.patient.nationalId}
                                            </Typography>
                                        </Box>
                                    )}
                                    {match.patient?.phoneNumber && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Phone sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                                {match.patient.phoneNumber}
                                            </Typography>
                                        </Box>
                                    )}
                                    {match.patient?.createdAt && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarToday sx={{ fontSize: '14px', color: '#6ec6ff' }} />
                                            <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem' }}>
                                                {format(new Date(match.patient.createdAt), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(110, 198, 255, 0.15)' }}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                        <Chip
                                            label={match.matchReason}
                                            size="small"
                                            sx={{
                                                background: getConfidenceGradient(match.confidence),
                                                color: '#ffffff',
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: '20px',
                                            }}
                                        />
                                    </Box>
                                    {match.matchedFields.length > 0 && (
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {match.matchedFields.map((field: string) => (
                                                <Chip
                                                    key={field}
                                                    label={field}
                                                    size="small"
                                                    sx={{
                                                        background: 'rgba(110, 198, 255, 0.1)',
                                                        color: '#6ec6ff',
                                                        fontSize: '0.65rem',
                                                        height: '18px',
                                                        border: '1px solid rgba(110, 198, 255, 0.2)',
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

export default DuplicateGroupCard;
