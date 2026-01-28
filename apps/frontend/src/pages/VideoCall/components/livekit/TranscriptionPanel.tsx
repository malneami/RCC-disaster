import React, { useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Tooltip,
    Switch,
    FormControlLabel,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
// import { useTranscription, TranscriptionSegment } from '../../contexts/TranscriptionContext';
import { useTranscription, TranscriptionSegment } from '@/contexts/TranscriptionContext';

interface TranscriptionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isEnabled: boolean;
    onToggleTranscription: (enabled: boolean) => void;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
    isOpen,
    onClose,
    isEnabled,
    onToggleTranscription,
}) => {
    const { transcriptions, clearTranscriptions } = useTranscription();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new transcriptions arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcriptions]);

    if (!isOpen) return null;

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#202124',
                borderRadius: '8px 0 0 8px',
                zIndex: 10,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: '1px solid #3c4043',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClosedCaptionIcon sx={{ color: '#e8eaed' }} />
                    <Typography sx={{ color: '#e8eaed', fontWeight: 600 }}>
                        Live Transcription
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: '#e8eaed',
                        '&:hover': { bgcolor: '#3c4043' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Controls */}
            <Box sx={{ p: 2, borderBottom: '1px solid #3c4043' }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isEnabled}
                            onChange={(e) => onToggleTranscription(e.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <Typography sx={{ color: '#e8eaed', fontSize: '14px' }}>
                            Enable Transcription
                        </Typography>
                    }
                />
                {transcriptions.length > 0 && (
                    <>
                        <Divider sx={{ my: 1, bgcolor: '#3c4043' }} />
                        <Tooltip title="Clear all transcriptions">
                            <IconButton
                                onClick={clearTranscriptions}
                                size="small"
                                sx={{
                                    color: '#e8eaed',
                                    '&:hover': { bgcolor: '#3c4043' },
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                                <Typography sx={{ ml: 1, fontSize: '12px' }}>Clear</Typography>
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>

            {/* Transcription List */}
            <Box
                ref={scrollRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#5f6368',
                        borderRadius: '3px',
                    },
                }}
            >
                {!isEnabled && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#9aa0a6',
                            textAlign: 'center',
                            px: 3,
                        }}
                    >
                        <ClosedCaptionIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2">
                            Enable transcription to see live captions
                        </Typography>
                    </Box>
                )}

                {isEnabled && transcriptions.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#9aa0a6',
                        }}
                    >
                        <Typography variant="body2">Waiting for speech...</Typography>
                    </Box>
                )}

                {transcriptions.map((segment: TranscriptionSegment) => (
                    <Box
                        key={segment.id}
                        sx={{
                            p: 1.5,
                            bgcolor: segment.isFinal ? '#3c4043' : '#2d2f33',
                            borderRadius: '8px',
                            borderLeft: segment.isFinal ? '3px solid #1967d2' : '3px solid #5f6368',
                            opacity: segment.isFinal ? 1 : 0.7,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                            }}
                        >
                            <Typography
                                sx={{
                                    color: '#1967d2',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                }}
                            >
                                {segment.participantName}
                            </Typography>
                            <Typography
                                sx={{
                                    color: '#9aa0a6',
                                    fontSize: '10px',
                                }}
                            >
                                {formatTimestamp(segment.timestamp)}
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                color: '#e8eaed',
                                fontSize: '13px',
                                lineHeight: 1.5,
                            }}
                        >
                            {segment.text}
                        </Typography>
                        {segment.confidence !== undefined && (
                            <Typography
                                sx={{
                                    color: '#9aa0a6',
                                    fontSize: '10px',
                                    mt: 0.5,
                                }}
                            >
                                Confidence: {(segment.confidence * 100).toFixed(0)}%
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};