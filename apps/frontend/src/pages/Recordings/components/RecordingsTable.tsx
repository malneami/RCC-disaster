import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Tooltip,
    Box,
    Paper,
    Card,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    alpha,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import DeleteIcon from '@mui/icons-material/Delete';
import { Recording } from '../../../services/recordingsService';

interface RecordingsTableProps {
    recordings: Recording[];
    playingFile: string | null;
    onPlay: (rec: Recording) => void;
    onDownload: (filename: string) => void;
    onOpenTranscript: (rec: Recording) => void;
    onDelete: (rec: Recording) => void;
    isAdmin: boolean;
}

export const RecordingsTable: React.FC<RecordingsTableProps> = ({
    recordings,
    playingFile,
    onPlay,
    onDownload,
    onOpenTranscript,
    onDelete,
    isAdmin,
}) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [recordingToDelete, setRecordingToDelete] = React.useState<Recording | null>(null);

    const handleDeleteClick = (rec: Recording) => {
        setRecordingToDelete(rec);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (recordingToDelete) {
            onDelete(recordingToDelete);
            setDeleteDialogOpen(false);
            setRecordingToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setRecordingToDelete(null);
    };

    return (
        <>
            <Card
                elevation={0}
                sx={{
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
            >
                <TableContainer component={Paper} elevation={0}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Actions
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Type
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Date & Time
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Caller
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Callee(s)
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: '#1A1A1A',
                                        backgroundColor: '#F8F9FA',
                                        borderBottom: '2px solid #E0E0E0',
                                        py: 2,
                                    }}
                                >
                                    Transcription
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recordings.map((rec, index) => (
                                <TableRow
                                    key={rec.id}
                                    onClick={() => onOpenTranscript(rec)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: alpha('#1976D2', 0.04),
                                            transition: 'background-color 0.2s ease',
                                        },
                                        borderBottom: index === recordings.length - 1 ? 'none' : '1px solid #F0F0F0',
                                    }}
                                >
                                    <TableCell sx={{ py: 2 }} onClick={(e) => e.stopPropagation()}>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title={playingFile === rec.filename ? "Pause" : "Play"} arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onPlay(rec)}
                                                    sx={{
                                                        color: playingFile === rec.filename ? '#1976D2' : '#666666',
                                                        backgroundColor: playingFile === rec.filename ? alpha('#1976D2', 0.1) : 'transparent',
                                                        border: `1px solid ${playingFile === rec.filename ? alpha('#1976D2', 0.3) : '#E0E0E0'}`,
                                                        '&:hover': {
                                                            backgroundColor: alpha('#1976D2', 0.15),
                                                            borderColor: '#1976D2',
                                                            color: '#1976D2',
                                                        },
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    {playingFile === rec.filename ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onDownload(rec.filename)}
                                                    sx={{
                                                        color: '#666666',
                                                        border: '1px solid #E0E0E0',
                                                        '&:hover': {
                                                            backgroundColor: alpha('#2E7D32', 0.1),
                                                            borderColor: '#2E7D32',
                                                            color: '#2E7D32',
                                                        },
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Transcript" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onOpenTranscript(rec)}
                                                    sx={{
                                                        color: '#666666',
                                                        border: '1px solid #E0E0E0',
                                                        '&:hover': {
                                                            backgroundColor: alpha('#ED6C02', 0.1),
                                                            borderColor: '#ED6C02',
                                                            color: '#ED6C02',
                                                        },
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <ClosedCaptionIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {isAdmin && (
                                                <Tooltip title="Delete Recording" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(rec)}
                                                        sx={{
                                                            color: '#666666',
                                                            border: '1px solid #E0E0E0',
                                                            '&:hover': {
                                                                backgroundColor: alpha('#D32F2F', 0.1),
                                                                borderColor: '#D32F2F',
                                                                color: '#D32F2F',
                                                            },
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Chip
                                            icon={rec.recordingType === 'VIDEO' ? <VideocamIcon /> : <MicIcon />}
                                            label={rec.recordingType === 'VIDEO' ? 'Video' : 'Audio'}
                                            size="small"
                                            sx={{
                                                backgroundColor: rec.recordingType === 'VIDEO' ? alpha('#1976D2', 0.1) : alpha('#666666', 0.08),
                                                color: rec.recordingType === 'VIDEO' ? '#1976D2' : '#666666',
                                                border: `1px solid ${rec.recordingType === 'VIDEO' ? alpha('#1976D2', 0.3) : alpha('#666666', 0.2)}`,
                                                fontWeight: 500,
                                                '& .MuiChip-icon': {
                                                    color: 'inherit',
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 2, fontSize: '0.875rem', color: '#2C2C2C' }}>
                                        <Box>
                                            <Box sx={{ fontWeight: 500 }}>
                                                {new Date(rec.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Box>
                                            <Box sx={{ fontSize: '0.75rem', color: '#666666', mt: 0.25 }}>
                                                {new Date(rec.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 2, fontSize: '0.875rem', color: '#2C2C2C', fontWeight: 500 }}>
                                        {rec.callerName || <span style={{ color: '#999999', fontStyle: 'italic' }}>Unknown</span>}
                                    </TableCell>
                                    <TableCell sx={{ py: 2, fontSize: '0.875rem', color: '#2C2C2C' }}>
                                        {Array.isArray(rec.calleeNames) && rec.calleeNames.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {rec.calleeNames.map((name, idx) => (
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
                                                ))}
                                            </Box>
                                        ) : (
                                            <span style={{ color: '#999999', fontStyle: 'italic' }}>Unknown</span>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        {rec.transcriptionStatus ? (
                                            <Chip
                                                label={rec.transcriptionStatus}
                                                size="small"
                                                sx={{
                                                    backgroundColor:
                                                        rec.transcriptionStatus === 'COMPLETED' ? alpha('#2E7D32', 0.1) :
                                                            rec.transcriptionStatus === 'RUNNING' ? alpha('#ED6C02', 0.1) :
                                                                rec.transcriptionStatus === 'PENDING' ? alpha('#1976D2', 0.1) :
                                                                    alpha('#D32F2F', 0.1),
                                                    color:
                                                        rec.transcriptionStatus === 'COMPLETED' ? '#2E7D32' :
                                                            rec.transcriptionStatus === 'RUNNING' ? '#ED6C02' :
                                                                rec.transcriptionStatus === 'PENDING' ? '#1976D2' :
                                                                    '#D32F2F',
                                                    border: `1px solid ${rec.transcriptionStatus === 'COMPLETED' ? alpha('#2E7D32', 0.3) :
                                                        rec.transcriptionStatus === 'RUNNING' ? alpha('#ED6C02', 0.3) :
                                                            rec.transcriptionStatus === 'PENDING' ? alpha('#1976D2', 0.3) :
                                                                alpha('#D32F2F', 0.3)
                                                        }`,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label="No Transcript"
                                                size="small"
                                                sx={{
                                                    backgroundColor: alpha('#666666', 0.08),
                                                    color: '#666666',
                                                    border: `1px solid ${alpha('#666666', 0.2)}`,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    pb: 1,
                }}>
                    Delete Recording
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#2C2C2C', mb: 2 }}>
                        Are you sure you want to delete this recording? This action cannot be undone.
                    </DialogContentText>
                    <Box sx={{
                        backgroundColor: '#F8F9FA',
                        borderRadius: '8px',
                        p: 2,
                        border: '1px solid #E0E0E0',
                    }}>
                        <Box sx={{ mb: 1 }}>
                            <strong style={{ color: '#666666', fontSize: '0.875rem' }}>Caller:</strong>{' '}
                            <span style={{ color: '#2C2C2C', fontWeight: 500 }}>{recordingToDelete?.callerName || 'Unknown'}</span>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                            <strong style={{ color: '#666666', fontSize: '0.875rem' }}>Callee(s):</strong>{' '}
                            <span style={{ color: '#2C2C2C', fontWeight: 500 }}>{recordingToDelete?.calleeNames?.join(', ') || 'Unknown'}</span>
                        </Box>
                        <Box>
                            <strong style={{ color: '#666666', fontSize: '0.875rem' }}>Date:</strong>{' '}
                            <span style={{ color: '#2C2C2C', fontWeight: 500 }}>
                                {recordingToDelete ? new Date(recordingToDelete.createdAt).toLocaleString() : ''}
                            </span>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCancelDelete}
                        sx={{
                            color: '#666666',
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': {
                                backgroundColor: alpha('#666666', 0.08),
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        sx={{
                            backgroundColor: '#D32F2F',
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: '#B71C1C',
                                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                            },
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
