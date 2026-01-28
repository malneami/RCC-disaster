import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    Tooltip,
    Drawer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import { Recording, recordingsService } from '../../services/recordingsService';
import apiClient from '@/services/apiClient';

const RecordingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [playingFile, setPlayingFile] = useState<string | null>(null);
    const [mediaElement, setMediaElement] = useState<HTMLVideoElement | HTMLAudioElement | null>(null);
    const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

    const { data: recordings = [], isLoading: loading, error: queryError } = useQuery(
        'recordings',
        recordingsService.getAll,
        {
            refetchInterval: 10000, 
            onError: (err) => console.error('Failed to fetch recordings:', err)
        }
    );

    const { data: transcript, isLoading: transcriptLoading, error: transcriptQueryError } = useQuery(
        ['transcript', selectedRecording?.id],
        () => recordingsService.getTranscript(selectedRecording!.id),
        {
            enabled: !!selectedRecording,
            refetchInterval: (data) => {
                if (data && (data.status === 'RUNNING' || data.status === 'PENDING')) {
                    return 3000;
                }
                return false;
            }
        }
    );

    // Run Transcription Mutation
    const runMutation = useMutation(
        (id: string) => recordingsService.runTranscript(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['transcript', selectedRecording?.id]);
                queryClient.invalidateQueries('recordings');
            },
            onError: (err: any) => {
                console.error('Failed to run transcript:', err);
                alert('Failed to run transcription. Please try again or contact support.');
            }
        }
    );

    const error = queryError ? 'Failed to load recordings. Please try again.' : null;
    const transcriptError = transcriptQueryError ? 'Failed to load transcript. You may need to run it again.' : null;

    useEffect(() => {
        return () => {
            if (mediaElement) {
                mediaElement.pause();
                mediaElement.src = '';
                if (mediaElement.parentNode) {
                    mediaElement.parentNode.removeChild(mediaElement);
                }
            }
        };
    }, [mediaElement]);

    const fetchRecordings = () => queryClient.invalidateQueries('recordings');

    const handlePlay = async (rec: Recording) => {
        const { filename } = rec;
        if (playingFile === filename && mediaElement) {
            mediaElement.pause();
            mediaElement.src = '';
            if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
            setMediaElement(null);
            setPlayingFile(null);
            return;
        }

        // Clean up previous
        if (mediaElement) {
            mediaElement.pause();
            mediaElement.src = '';
            if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
            setMediaElement(null);
        }

        const url = recordingsService.getStreamUrl(filename);

        try {
            const response = await apiClient.get(url, {
                responseType: 'blob',
            });

            const blob = response.data as Blob;
            const blobUrl = URL.createObjectURL(blob);

            // Create audio element
            const element = document.createElement('audio');
            element.style.display = 'none';
            document.body.appendChild(element);

            element.src = blobUrl;
            element.preload = 'metadata';
            element.controls = true;


            element.onended = () => {
                setPlayingFile(null);
                setMediaElement(null);
                URL.revokeObjectURL(blobUrl);
                if (element.parentNode) element.parentNode.removeChild(element);
            };

            await element.play();
            setMediaElement(element);
            setPlayingFile(filename);

        } catch (err: any) {
            console.error('Playback failed:', err);
            alert('Could not play recording: ' + (err.message || 'Check console for details'));
            if (mediaElement) {
                mediaElement.pause();
                if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
                setMediaElement(null);
            }
        }
    };
    const handleDownload = (filename: string) => {
        const url = recordingsService.getDownloadUrl(filename);
        window.open(url, '_blank');
    };

    const handleOpenTranscript = (rec: Recording) => {
        setSelectedRecording(rec);
    };

    const handleRunTranscript = () => {
        if (!selectedRecording) return;
        runMutation.mutate(selectedRecording.id);
    };

    const closeTranscriptDrawer = () => {
        setSelectedRecording(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Call Recordings
                </Typography>
                <IconButton onClick={fetchRecordings} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : recordings.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="textSecondary">No recordings found.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Actions</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Caller</TableCell>
                                <TableCell>Callee(s)</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recordings.map((rec) => (
                                <TableRow key={rec.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title={playingFile === rec.filename ? "Pause" : "Play"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handlePlay(rec)}
                                                    color={playingFile === rec.filename ? "primary" : "default"}
                                                >
                                                    {playingFile === rec.filename ? <PauseIcon /> : <PlayArrowIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDownload(rec.filename)}
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View transcript">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenTranscript(rec)}
                                                >
                                                    <ClosedCaptionIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={rec.recordingType === 'VIDEO' ? <VideocamIcon /> : <MicIcon />}
                                            label={rec.recordingType === 'VIDEO' ? 'Video' : 'Audio'}
                                            size="small"
                                            color={rec.recordingType === 'VIDEO' ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(rec.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{rec.callerName || 'Unknown'}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            if (Array.isArray(rec.calleeNames) && rec.calleeNames.length > 0) {
                                                return rec.calleeNames.join(', ');
                                            }
                                            return 'Unknown';
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {rec.transcriptionStatus && (
                                            <Chip
                                                label={rec.transcriptionStatus}
                                                size="small"
                                                color={
                                                    rec.transcriptionStatus === 'COMPLETED' ? 'success' :
                                                        rec.transcriptionStatus === 'RUNNING' || rec.transcriptionStatus === 'PENDING' ? 'warning' :
                                                            rec.transcriptionStatus === 'FAILED' ? 'error' : 'default'
                                                }
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Drawer
                anchor="right"
                open={!!selectedRecording}
                onClose={closeTranscriptDrawer}
            >
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
                                    onClick={() => queryClient.invalidateQueries(['transcript', selectedRecording?.id])}
                                    disabled={transcriptLoading || runMutation.isLoading}
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
                                    onClick={handleRunTranscript}
                                    disabled={transcriptLoading || runMutation.isLoading}
                                    sx={{
                                        bgcolor: '#f5f5f5',
                                        '&:hover': { bgcolor: '#e0e0e0' }
                                    }}
                                >
                                    {runMutation.isLoading ? <CircularProgress size={16} /> : <PlayArrowIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Recording Info */}
                    <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                        {selectedRecording && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#666', minWidth: 60 }}>
                                        Date:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {new Date(selectedRecording.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#666', minWidth: 60 }}>
                                        Caller:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {selectedRecording.callerName || 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#666', minWidth: 60 }}>
                                        Type:
                                    </Typography>
                                    <Chip
                                        icon={selectedRecording.recordingType === 'VIDEO' ? <VideocamIcon /> : <MicIcon />}
                                        label={selectedRecording.recordingType === 'VIDEO' ? 'Video' : 'Audio'}
                                        size="small"
                                        sx={{ height: 24 }}
                                    />
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
        </Box>
    );
};

export default RecordingsPage;
