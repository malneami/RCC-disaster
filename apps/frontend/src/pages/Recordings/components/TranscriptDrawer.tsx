import React from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import { Recording, RecordingTranscript } from '../../../services/recordingsService';

interface TranscriptDrawerProps {
    open: boolean;
    onClose: () => void;
    selectedRecording: Recording | null;
    transcript: RecordingTranscript | null | undefined;
    transcriptLoading: boolean;
    transcriptError: string | null;
    onRefresh: () => void;
    onRunTranscript: () => void;
    isRunning: boolean;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
    open,
    onClose,
    selectedRecording,
    transcript,
    transcriptLoading,
    transcriptError,
    onRefresh,
    onRunTranscript,
    isRunning,
}) => {
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 520, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fafafa' }}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    borderBottom: '1px solid #e0e0e0',
                    bgcolor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        Transcription
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Refresh transcript">
                            <IconButton
                                size="small"
                                onClick={onRefresh}
                                disabled={transcriptLoading || isRunning}
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Run transcription">
                            <IconButton
                                size="small"
                                onClick={onRunTranscript}
                                disabled={transcriptLoading || isRunning}
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                            >
                                {isRunning ? <CircularProgress size={16} /> : <PlayArrowIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Recording Info */}
                <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                    {selectedRecording && (
                        <Box sx={{ p: 2, backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Recording Details
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, color: '#666666' }}>
                                        Caller:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#2C2C2C', fontWeight: 500 }}>
                                        {selectedRecording.callerName || 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, color: '#666666' }}>
                                        Callee(s):
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {Array.isArray(selectedRecording.calleeNames) && selectedRecording.calleeNames.length > 0 ? (
                                            selectedRecording.calleeNames.map((name, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={name}
                                                    size="small"
                                                    sx={{
                                                        height: '22px',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: alpha('#2E7D32', 0.08),
                                                        color: '#2E7D32',
                                                        border: `1px solid ${alpha('#2E7D32', 0.2)}`,
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#999999', fontStyle: 'italic' }}>
                                                Unknown
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, color: '#666666' }}>
                                        Date:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#2C2C2C' }}>
                                        {new Date(selectedRecording.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, color: '#666666' }}>
                                        Type:
                                    </Typography>
                                    <Chip
                                        icon={selectedRecording.recordingType === 'VIDEO' ? <VideocamIcon /> : <MicIcon />}
                                        label={selectedRecording.recordingType === 'VIDEO' ? 'Video' : 'Audio'}
                                        size="small"
                                        sx={{
                                            height: '22px',
                                            backgroundColor: selectedRecording.recordingType === 'VIDEO' ? alpha('#1976D2', 0.1) : alpha('#666666', 0.08),
                                            color: selectedRecording.recordingType === 'VIDEO' ? '#1976D2' : '#666666',
                                            border: `1px solid ${selectedRecording.recordingType === 'VIDEO' ? alpha('#1976D2', 0.3) : alpha('#666666', 0.2)}`,
                                            fontWeight: 500,
                                            '& .MuiChip-icon': {
                                                color: 'inherit',
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Transcript Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                    {transcriptLoading && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={32} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="textSecondary">
                                Loading transcript...
                            </Typography>
                        </Box>
                    )}

                    {transcriptError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {transcriptError}
                        </Alert>
                    )}

                    {!transcriptLoading && !transcriptError && !transcript && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <ClosedCaptionIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                            <Typography variant="body1" color="textSecondary" gutterBottom>
                                No transcript available
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Click the play button above to start transcription
                            </Typography>
                        </Box>
                    )}

                    {transcript && (
                        <Box>
                            {/* Status Badge */}
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                    Status:
                                </Typography>
                                <Chip
                                    label={transcript.status}
                                    size="small"
                                    color={
                                        transcript.status === 'COMPLETED' ? 'success' :
                                            transcript.status === 'RUNNING' ? 'warning' :
                                                transcript.status === 'FAILED' ? 'error' : 'default'
                                    }
                                    icon={(transcript.status === 'RUNNING' || transcript.status === 'PENDING') ?
                                        <CircularProgress size={12} color="inherit" /> : undefined
                                    }
                                />
                            </Box>

                            {/* Full Text Display */}
                            {transcript.fullText ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            lineHeight: 1.8,
                                            color: '#2c2c2c',
                                            fontSize: '15px',
                                            fontWeight: 400,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {transcript.fullText}
                                    </Typography>
                                </Paper>
                            ) : (
                                <Box sx={{
                                    p: 3,
                                    bgcolor: 'white',
                                    borderRadius: 2,
                                    border: '1px dashed #ccc',
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Transcription in progress...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};
