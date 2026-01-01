import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip } from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile, Image as ImageIcon, PictureAsPdf, VideoLibrary } from '@mui/icons-material';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  maxFiles?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  maxFiles = 5,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType + '/');
        }
        return file.type === type;
      });

      if (!isValidType) {
        alert(`File ${file.name} is not an allowed type. Allowed types: images, videos, PDFs`);
        continue;
      }

      validFiles.push(file);
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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

  return (
    <Box>
      <input
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <Paper
        component="label"
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 0.5,
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 3,
        }}
        elevation={0}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: dragActive ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <CloudUpload 
            sx={{ 
              fontSize: 40, 
              color: dragActive ? 'primary.main' : 'primary.light',
              transition: 'all 0.3s ease-in-out',
            }} 
          />
        </Box>
        <Typography variant="h6" gutterBottom fontWeight="600" color="text.primary">
          {dragActive ? 'Drop files here' : 'Upload Files'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Drag and drop files here, or click to browse
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip 
            label={`Max ${maxSize / 1024 / 1024}MB`} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.06)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }} 
          />
          <Chip 
            label={`Up to ${maxFiles} files`} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.06)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }} 
          />
        </Box>
      </Paper>

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {selectedFiles.map((file, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateX(4px)',
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
                    bgcolor: getIconBackground(file.type),
                    flexShrink: 0,
                  }}
                >
                  {getFileIcon(file.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => removeFile(index)}
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
                  <Delete sx={{ fontSize: 20 }} />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};