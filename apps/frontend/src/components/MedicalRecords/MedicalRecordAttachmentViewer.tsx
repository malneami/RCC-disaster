import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Grid,
} from '@mui/material';
import {
    Download,
    Close,
    Image as ImageIcon,
    PictureAsPdf,
    VideoLibrary,
    InsertDriveFile,
    Delete as DeleteIcon,
    PlayArrow,
    Visibility,
} from '@mui/icons-material';
import { medicalRecordService } from '../../services/medicalRecordService';
import { useSnackbar } from 'notistack';

import { useMutation } from 'react-query';

interface Attachment {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileData?: string;
    uploadedAt?: string;
}

interface MedicalRecordAttachmentViewerProps {
    attachments: Attachment[];
    onDelete?: (attachmentId: string) => void;
    showDelete?: boolean;
}

const MedicalRecordAttachmentViewer: React.FC<MedicalRecordAttachmentViewerProps> = ({
    attachments,
    onDelete,
    showDelete = false,
}) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const { enqueueSnackbar } = useSnackbar();

    const { mutateAsync: downloadAttachment, isLoading: loadingDownload } = useMutation(
        (id: string) => medicalRecordService.getAttachment(id),
        {
            onError: (error) => {
                console.error('Download error:', error);
                enqueueSnackbar('Failed to download attachment', { variant: 'error' });
            }
        }
    );

    const { mutateAsync: deleteAttachmentMutation } = useMutation(
        (id: string) => medicalRecordService.deleteAttachment(id),
        {
            onSuccess: (_, id) => {
                enqueueSnackbar('Attachment deleted successfully', { variant: 'success' });
                onDelete?.(id);
            },
            onError: (error) => {
                console.error('Delete error:', error);
                enqueueSnackbar('Failed to delete attachment', { variant: 'error' });
            }
        }
    );

    const loading = loadingDownload;

    if (attachments.length === 0) {
        return null;
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon sx={{ color: '#4CAF50', fontSize: 28 }} />;
        if (mimeType === 'application/pdf') return <PictureAsPdf sx={{ color: '#F44336', fontSize: 28 }} />;
        if (mimeType.startsWith('video/')) return <VideoLibrary sx={{ color: '#2196F3', fontSize: 28 }} />;
        return <InsertDriveFile sx={{ color: '#9E9E9E', fontSize: 28 }} />;
    };

    const getIconBackground = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'rgba(76, 175, 80, 0.1)';
        if (mimeType === 'application/pdf') return 'rgba(244, 67, 54, 0.1)';
        if (mimeType.startsWith('video/')) return 'rgba(33, 150, 243, 0.1)';
        return 'rgba(158, 158, 158, 0.1)';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDownload = async (attachment: Attachment) => {

        let fileData = attachment.fileData;

        if (!fileData) {
            const fullAttachment = await downloadAttachment(attachment.id);
            fileData = fullAttachment.fileData;
        }

        const byteCharacters = atob(fileData!);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    };

    const handlePreview = async (attachment: Attachment) => {
        try {
            let fullAttachment = attachment;

            if (!attachment.fileData) {
                fullAttachment = await downloadAttachment(attachment.id);
            }

            setPreviewAttachment(fullAttachment);
            setPreviewOpen(true);
        } catch (error) {
            console.error('Preview error:', error);
            enqueueSnackbar('Failed to load attachment preview', { variant: 'error' });
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (!onDelete) return;
        setDeleting(attachmentId);
        try {
            await deleteAttachmentMutation(attachmentId);
        } finally {
            setDeleting(null);
        }
    };

    const getDataUrl = (attachment: Attachment) => {
        if (!attachment.fileData) return '';
        return `data:${attachment.mimeType};base64,${attachment.fileData}`;
    };

    const renderPreviewContent = () => {
        if (!previewAttachment || !previewAttachment.fileData) return null;

        const dataUrl = getDataUrl(previewAttachment);

        if (previewAttachment.mimeType.startsWith('image/')) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <img
                        src={dataUrl}
                        alt={previewAttachment.fileName}
                        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                    />
                </Box>
            );
        }

        if (previewAttachment.mimeType.startsWith('video/')) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <video
                        src={dataUrl}
                        controls
                        autoPlay
                        style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
                    />
                </Box>
            );
        }

        if (previewAttachment.mimeType === 'application/pdf') {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, height: '70vh' }}>
                    <iframe
                        src={dataUrl}
                        title={previewAttachment.fileName}
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                    />
                </Box>
            );
        }

        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography>Preview not available for this file type</Typography>
            </Box>
        );
    };

    return (
        <Box>
            <Grid container spacing={2}>
                {attachments.map((attachment) => (
                    <Grid item xs={12} md={6} key={attachment.id}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                width: '100%',
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2.5,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                transition: 'all 0.25s ease-in-out',
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                                    transform: 'translateY(-2px)',
                                    borderColor: 'primary.main',
                                },
                            }}
                            elevation={0}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2.5,
                                    bgcolor: getIconBackground(attachment.mimeType),
                                    flexShrink: 0,
                                    position: 'relative',
                                }}
                            >
                                {getFileIcon(attachment.mimeType)}
                                {attachment.mimeType.startsWith('video/') && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: -4,
                                            right: -4,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            bgcolor: '#2196F3',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <PlayArrow sx={{ color: 'white', fontSize: 14 }} />
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        fontSize: '0.9rem',
                                        mb: 0.5,
                                    }}
                                >
                                    {attachment.fileName}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}
                                >
                                    {formatFileSize(attachment.fileSize)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => handlePreview(attachment)}
                                    disabled={loading}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1.5,
                                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                                        color: 'primary.main',
                                        '&:hover': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                        },
                                    }}
                                >
                                    {loading ? <CircularProgress size={16} /> : <Visibility sx={{ fontSize: 16 }} />}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDownload(attachment)}
                                    disabled={loading}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1.5,
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                                        },
                                    }}
                                >
                                    <Download sx={{ fontSize: 16 }} />
                                </IconButton>
                                {showDelete && onDelete && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(attachment.id)}
                                        disabled={deleting === attachment.id}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                                            color: 'error.main',
                                            '&:hover': {
                                                bgcolor: 'error.main',
                                                color: 'white',
                                            },
                                        }}
                                    >
                                        {deleting === attachment.id ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        )}
                                    </IconButton>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        py: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {previewAttachment && (
                            <>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: getIconBackground(previewAttachment.mimeType),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {getFileIcon(previewAttachment.mimeType)}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ maxWidth: 400 }}>
                                        {previewAttachment.fileName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatFileSize(previewAttachment.fileSize)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {previewAttachment && (
                            <IconButton
                                onClick={() => handleDownload(previewAttachment)}
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                }}
                            >
                                <Download />
                            </IconButton>
                        )}
                        <IconButton onClick={() => setPreviewOpen(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: 'grey.100' }}>
                    {renderPreviewContent()}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MedicalRecordAttachmentViewer;
