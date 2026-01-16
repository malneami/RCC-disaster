import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Alert,
    IconButton,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    alpha,
} from '@mui/material';
import { useMutation } from 'react-query';
import { apiClient } from '../../services/apiClient';
import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    PictureAsPdf,
    VideoLibrary,
    InsertDriveFile,
    Visibility,
    Close as CloseIcon,
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';

interface FileAttachment {
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileData: string;
    file?: File; // Raw file for FormData upload
}

interface AttachmentUploadProps {
    medicalRecordId?: string;
    onUploadSuccess?: (attachment: any) => void;
    onFileSelect?: (file: FileAttachment) => void;
    onFileRemove?: (index: number) => void;
    selectedFiles?: FileAttachment[];
    maxSize?: number;
    maxFiles?: number;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
    medicalRecordId,
    onUploadSuccess,
    onFileSelect,
    onFileRemove,
    selectedFiles = [],
    maxSize = 50 * 1024 * 1024, // 50MB
    maxFiles = 10,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [localUploading, setLocalUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { enqueueSnackbar } = useSnackbar();

    const { mutateAsync: uploadFile, isLoading: isMutating } = useMutation(
        async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.post(
                `/medical-records/${medicalRecordId}/attachments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        },
        {
            onSuccess: (data) => {
                enqueueSnackbar('Attachment uploaded successfully', { variant: 'success' });
                onUploadSuccess?.(data);
            },
            onError: (err: any) => {
                console.error('Upload error:', err);
                const msg = err.response?.data?.message || 'Failed to upload attachment';
                setError(msg);
                enqueueSnackbar(msg, { variant: 'error' });
            },
        }
    );

    const uploading = localUploading || isMutating;

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon sx={{ color: '#4CAF50', fontSize: 24 }} />;
        if (mimeType === 'application/pdf') return <PictureAsPdf sx={{ color: '#F44336', fontSize: 24 }} />;
        if (mimeType.startsWith('video/')) return <VideoLibrary sx={{ color: '#2196F3', fontSize: 24 }} />;
        return <InsertDriveFile sx={{ color: '#9E9E9E', fontSize: 24 }} />;
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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragOver(true);
        } else if (e.type === 'dragleave') {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, [selectedFiles, maxFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handlePreview = (file: FileAttachment) => {
        setPreviewFile(file);
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setPreviewFile(null);
    };

    const handleFiles = async (files: File[]) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'video/mp4', 'video/quicktime', 'video/webm'
        ];

        for (const file of files) {
            if (selectedFiles.length >= maxFiles) {
                enqueueSnackbar(`Maximum ${maxFiles} files allowed`, { variant: 'warning' });
                break;
            }

            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                setError(`Invalid file type: ${file.name}. Only Images, PDFs, and Videos are allowed.`);
                continue;
            }

            // Validate size
            if (file.size > maxSize) {
                setError(`File ${file.name} exceeds ${formatFileSize(maxSize)} limit.`);
                continue;
            }

            setError(null);

            if (medicalRecordId) {
                await uploadFile(file);

            } else if (onFileSelect) {
                setLocalUploading(true);
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    onFileSelect({
                        fileName: file.name,
                        mimeType: file.type,
                        fileSize: file.size,
                        fileData: base64,
                        file: file, // Store raw file for FormData upload
                    });
                    setLocalUploading(false);
                };
                reader.onerror = () => {
                    setError('Failed to read file');
                    setLocalUploading(false);
                };
                reader.readAsDataURL(file);
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Box>
            <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,video/*"
                id="medical-attachment-upload"
            />
            <Paper
                component="label"
                htmlFor="medical-attachment-upload"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                    p: 3,
                    borderColor: isDragOver ? 'primary.main' : 'divider',
                    bgcolor: isDragOver ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '2px dashed',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                }}
                elevation={0}
            >
                {uploading ? (
                    <Box sx={{ py: 2 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Uploading...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                bgcolor: isDragOver ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                mb: 2,
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >
                            <CloudUploadIcon
                                sx={{
                                    fontSize: 36,
                                    color: isDragOver ? 'primary.main' : 'primary.light',
                                    transition: 'all 0.3s ease-in-out',
                                }}
                            />
                        </Box>
                        <Typography variant="h6" gutterBottom fontWeight="600" color="text.primary">
                            {isDragOver ? 'Drop files here' : 'Upload Attachments'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Drag and drop files here, or click to browse
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                            <Chip
                                label="Images"
                                size="small"
                                icon={<ImageIcon sx={{ fontSize: 16 }} />}
                                sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            <Chip
                                label="PDF"
                                size="small"
                                icon={<PictureAsPdf sx={{ fontSize: 16 }} />}
                                sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            <Chip
                                label="Video"
                                size="small"
                                icon={<VideoLibrary sx={{ fontSize: 16 }} />}
                                sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            <Chip
                                label={`Max ${formatFileSize(maxSize)}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(0,0,0,0.06)', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                        </Box>
                    </>
                )}
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                            Selected Files
                        </Typography>
                        <Chip
                            label={`${selectedFiles.length}/${maxFiles}`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                        />
                    </Box>
                    <Grid container spacing={2}>
                        {selectedFiles.map((file, index) => (
                            <Grid item xs={12} md={6} key={index}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 3,
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        height: '100%',
                                    }}
                                    elevation={0}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 44,
                                            height: 44,
                                            borderRadius: 2,
                                            bgcolor: getIconBackground(file.mimeType),
                                            flexShrink: 0,
                                        }}
                                    >
                                        {getFileIcon(file.mimeType)}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                                        >
                                            {file.fileName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="500">
                                            {formatFileSize(file.fileSize)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePreview(file);
                                            }}
                                            sx={{
                                                color: 'primary.main',
                                                bgcolor: 'rgba(33, 150, 243, 0.08)',
                                                width: 36,
                                                height: 36,
                                                '&:hover': {
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    transform: 'scale(1.1)',
                                                },
                                                transition: 'all 0.2s ease-in-out',
                                            }}
                                        >
                                            <Visibility sx={{ fontSize: 20 }} />
                                        </IconButton>
                                        {onFileRemove && (
                                            <IconButton
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onFileRemove(index);
                                                }}
                                                sx={{
                                                    color: 'error.main',
                                                    bgcolor: 'rgba(244, 67, 54, 0.08)',
                                                    width: 36,
                                                    height: 36,
                                                    '&:hover': {
                                                        bgcolor: 'error.main',
                                                        color: 'white',
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s ease-in-out',
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={handleClosePreview}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '90%' }}>
                        {previewFile?.fileName}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={handleClosePreview}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                    {previewFile && (
                        <>
                            {previewFile.mimeType.startsWith('image/') && (
                                <img
                                    src={`data:${previewFile.mimeType};base64,${previewFile.fileData}`}
                                    alt={previewFile.fileName}
                                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                                />
                            )}
                            {previewFile.mimeType === 'application/pdf' && (
                                <iframe
                                    src={`data:${previewFile.mimeType};base64,${previewFile.fileData}`}
                                    title={previewFile.fileName}
                                    style={{ width: '100%', height: '80vh', border: 'none' }}
                                />
                            )}
                            {previewFile.mimeType.startsWith('video/') && (
                                <video
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '80vh' }}
                                >
                                    <source src={`data:${previewFile.mimeType};base64,${previewFile.fileData}`} type={previewFile.mimeType} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AttachmentUpload;
