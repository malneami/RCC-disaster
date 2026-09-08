import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Box,
    Alert,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    LinearProgress,
    Typography,
    Dialog,
    DialogContent,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { Headphones, Assessment, Timeline } from '@mui/icons-material';
import { Recording, recordingsService } from '../../services/recordingsService';
import { userManagementService } from '../../services/userManagementService';
import apiClient from '@/services/apiClient';
import { RecordingsFilters } from './components/RecordingsFilters';
import { RecordingsTable } from './components/RecordingsTable';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import PortalSkeleton, { PortalStep, KPICard } from '../../components/Common/PortalSkeleton';
import { useAuth } from '../../contexts/AuthContext';

const RecordingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Check if user is admin or RCC
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'RCC';

    // Media playback state
    const [playingFile, setPlayingFile] = useState<string | null>(null);
    const [mediaElement, setMediaElement] = useState<HTMLVideoElement | HTMLAudioElement | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // Transcript drawer state
    const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Filter state
    const [statusFilter, setStatusFilter] = useState('');
    const [callerFilter, setCallerFilter] = useState('');
    const [calleeFilter, setCalleeFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');

    // Fetch recordings with pagination and filters
    const { data, isLoading: loading, error: queryError } = useQuery(
        ['recordings', page, rowsPerPage, statusFilter, callerFilter, calleeFilter, searchFilter],
        () => recordingsService.getAll({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
            status: statusFilter || undefined,
            callerId: callerFilter || undefined,
            calleeId: calleeFilter || undefined,
            search: searchFilter || undefined,
        }),
        {
            refetchInterval: 10000,
            keepPreviousData: true,
            onError: (err) => console.error('Failed to fetch recordings:', err)
        }
    );

    const recordings = data?.recordings || [];
    const totalCount = data?.total || 0;

    // Fetch users for filter dropdowns
    const { data: usersData } = useQuery(
        'users-list',
        () => userManagementService.getAllUsers(1, 1000),
        { staleTime: 600000 }
    );
    const users = usersData?.data || [];

    // Fetch transcript for selected recording
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
                queryClient.invalidateQueries(['recordings']);
            },
            onError: (err: any) => {
                console.error('Failed to run transcript:', err);
                alert('Failed to run transcription. Please try again or contact support.');
            }
        }
    );

    // Delete Recording Mutation
    const deleteMutation = useMutation(
        (id: string) => recordingsService.delete(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['recordings']);
            },
            onError: (err: any) => {
                console.error('Failed to delete recording:', err);
                alert('Failed to delete recording. Please try again or contact support.');
            }
        }
    );

    const error = queryError ? 'Failed to load recordings. Please try again.' : null;
    const transcriptError = transcriptQueryError ? 'Failed to load transcript. You may need to run it again.' : null;

    // Cleanup media element on unmount
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

    const fetchRecordings = () => queryClient.invalidateQueries(['recordings']);

    const handlePlay = async (rec: Recording) => {
        const { filename } = rec;
        const isVideo = filename.endsWith('.mp4');

        // Stop if already playing
        if (playingFile === filename && mediaElement) {
            mediaElement.pause();
            mediaElement.src = '';
            if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
            setMediaElement(null);
            setPlayingFile(null);
            setIsVideoPlaying(false);
            return;
        }

        // Clean up previous media element
        if (mediaElement) {
            mediaElement.pause();
            mediaElement.src = '';
            if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
            setMediaElement(null);
            setIsVideoPlaying(false);
        }

        const url = recordingsService.getStreamUrl(filename);

        try {
            const response = await apiClient.get(url, {
                responseType: 'blob',
            });

            const blob = response.data as Blob;
            const blobUrl = URL.createObjectURL(blob);

            // Create element based on type
            const element = document.createElement(isVideo ? 'video' : 'audio');

            if (!isVideo) {
                element.style.display = 'none';
            } else {
                element.style.width = '100%';
                element.style.maxHeight = '70vh';
                element.style.borderRadius = '8px';
                element.style.backgroundColor = '#000';
            }

            document.body.appendChild(element);

            element.src = blobUrl;
            element.preload = 'metadata';
            element.controls = true;

            element.onended = () => {
                setPlayingFile(null);
                setMediaElement(null);
                setIsVideoPlaying(false);
                URL.revokeObjectURL(blobUrl);
                if (element.parentNode) element.parentNode.removeChild(element);
            };

            if (isVideo) {
                setIsVideoPlaying(true);
            }

            await element.play();
            setMediaElement(element);
            setPlayingFile(filename);

        } catch (err: any) {
            console.error('Playback failed:', err);
            alert('Could not play recording: ' + (err.message || 'Check console for details'));
            setIsVideoPlaying(false);
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

    const handleDelete = (rec: Recording) => {
        deleteMutation.mutate(rec.id);
    };

    const closeTranscriptDrawer = () => {
        setSelectedRecording(null);
    };

    const handlePageChange = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Calculate KPI stats
    const completedTranscripts = recordings.filter(r => r.transcriptionStatus === 'COMPLETED').length;
    const pendingTranscripts = recordings.filter(r => r.transcriptionStatus === 'PENDING' || r.transcriptionStatus === 'RUNNING').length;

    // Portal steps
    const portalSteps: PortalStep[] = [
        { label: 'Recordings', description: 'View and manage call recordings', icon: <Headphones /> },
    ];

    // KPI Cards
    const kpiCards: KPICard[] = [
        {
            title: 'Total Recordings',
            value: totalCount,
            icon: <Assessment />,
            color: '#1976d2',
        },
        {
            title: 'Completed Transcripts',
            value: completedTranscripts,
            icon: <Timeline />,
            color: '#2e7d32',
        },
        {
            title: 'Pending Transcripts',
            value: pendingTranscripts,
            icon: <Timeline />,
            color: '#ed6c02',
        },

    ];

    return (
        <>
            <Helmet>
                <title>Call Recordings | MASAR</title>
            </Helmet>

            <PortalSkeleton
                title="Call Recordings"
                subtitle="Manage and transcribe call recordings"
                portalType="patients"
                steps={portalSteps}
                activeStep={0}
                onRefresh={fetchRecordings}
                kpiCards={kpiCards}
            >
                {/* Error Alert */}
                {error && (
                    <Box sx={{ p: 1.5, pb: 0 }}>
                        <Alert severity="error" onClose={() => queryClient.invalidateQueries(['recordings'])} sx={{ mb: 1.5 }}>
                            {error}
                        </Alert>
                    </Box>
                )}

                {/* Search Bar */}
                <Box sx={{ mb: 1.5 }}>
                    <TextField
                        fullWidth
                        placeholder="Search recordings..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchFilter && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchFilter('')}>
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Filters */}
                <Box sx={{ mb: 2 }}>
                    <RecordingsFilters
                        searchFilter={searchFilter}
                        setSearchFilter={setSearchFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        callerFilter={callerFilter}
                        setCallerFilter={setCallerFilter}
                        calleeFilter={calleeFilter}
                        setCalleeFilter={setCalleeFilter}
                        users={users || []}
                    />
                </Box>

                {/* Loading State */}
                {loading && recordings.length === 0 ? (
                    <Box sx={{ width: '100%', mt: 4 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                            Loading recordings...
                        </Typography>
                    </Box>
                ) : recordings.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No recordings found matching your criteria.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Try adjusting your filters or search terms
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {loading && <LinearProgress sx={{ mb: 1 }} />}

                        {/* Recordings Table */}
                        <RecordingsTable
                            recordings={recordings}
                            playingFile={playingFile}
                            onPlay={handlePlay}
                            onDownload={handleDownload}
                            onOpenTranscript={handleOpenTranscript}
                            onDelete={handleDelete}
                            isAdmin={isAdmin}
                        />

                        {/* Pagination */}
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handlePageChange}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[10, 20, 50, 100]}
                            labelRowsPerPage="Rows per page:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                            }
                        />
                    </>
                )}

                {/* Transcript Drawer */}
                <TranscriptDrawer
                    open={!!selectedRecording}
                    onClose={closeTranscriptDrawer}
                    selectedRecording={selectedRecording}
                    transcript={transcript}
                    transcriptLoading={transcriptLoading}
                    transcriptError={transcriptError}
                    onRefresh={() => queryClient.invalidateQueries(['transcript', selectedRecording?.id])}
                    onRunTranscript={handleRunTranscript}
                    isRunning={runMutation.isLoading}
                />

                {/* Video Player Dialog */}
                <Dialog
                    open={isVideoPlaying}
                    onClose={() => {
                        if (mediaElement) {
                            mediaElement.pause();
                            mediaElement.src = '';
                            if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
                        }
                        setIsVideoPlaying(false);
                        setMediaElement(null);
                        setPlayingFile(null);
                    }}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '12px',
                            backgroundColor: '#000',
                            overflow: 'hidden',
                        }
                    }}
                >
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', backgroundColor: '#1A1A1A' }}>
                        <IconButton
                            onClick={() => {
                                if (mediaElement) {
                                    mediaElement.pause();
                                    mediaElement.src = '';
                                    if (mediaElement.parentNode) mediaElement.parentNode.removeChild(mediaElement);
                                }
                                setIsVideoPlaying(false);
                                setMediaElement(null);
                                setPlayingFile(null);
                            }}
                            sx={{ color: '#FFF' }}
                        >
                            <ClearIcon />
                        </IconButton>
                    </Box>
                    <DialogContent sx={{ p: 0, backgroundColor: '#000', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                            id="video-container"
                            ref={(node: any) => {
                                if (node && isVideoPlaying && mediaElement && mediaElement.tagName === 'VIDEO') {
                                    node.innerHTML = '';
                                    node.appendChild(mediaElement);
                                    (mediaElement as HTMLVideoElement).style.display = 'block';
                                    (mediaElement as HTMLVideoElement).style.maxWidth = '100%';
                                }
                            }}
                            sx={{ width: '100%', height: '100%' }}
                        />
                    </DialogContent>
                </Dialog>
            </PortalSkeleton>
        </>
    );
};

export default RecordingsPage;
