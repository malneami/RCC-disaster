
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    CircularProgress,
    Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { medicalRecordService } from '../../services/medicalRecordService';

interface AttachmentViewerProps {
    attachmentId: string | null;
    open: boolean;
    onClose: () => void;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
    attachmentId,
    open,
    onClose,
}) => {
    const { data: fileData, isLoading: loading, error: queryError } = useQuery(
        ['attachment', attachmentId],
        () => medicalRecordService.getAttachment(attachmentId!),
        {
            enabled: !!open && !!attachmentId,
            onError: (err) => console.error('Fetch error:', err),
            retry: false,
        }
    );

    const error = queryError ? 'Failed to load attachment.' : null;

    const renderContent = () => {
        if (!fileData) return null;

        const { fileData: data, mimeType, fileName } = fileData;

        const src = `data:${mimeType};base64,${data}`;

        if (mimeType.startsWith('image/')) {
            return (
                <img
                    src={src}
                    alt={fileName}
                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
            );
        }

        if (mimeType === 'application/pdf') {
            return (
                <iframe
                    src={src + '#toolbar=0'}
                    title={fileName}
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                />
            );
        }

        if (mimeType.startsWith('video/')) {
            return (
                <video
                    controls
                    disablePictureInPicture
                    controlsList="nodownload"
                    style={{ maxWidth: '100%', maxHeight: '80vh' }}
                >
                    <source src={src} type={mimeType} />
                    Your browser does not support the video tag.
                </video>
            );
        }

        return <Typography>Unsupported file format for preview.</Typography>;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>
                    {fileData?.fileName || 'Attachment'}
                </Typography>
                <Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', p: 1 }}>
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    renderContent()
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AttachmentViewer;
