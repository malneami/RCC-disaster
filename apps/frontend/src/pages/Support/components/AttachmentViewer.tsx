import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Download, Image as ImageIcon, PictureAsPdf, VideoLibrary, InsertDriveFile } from '@mui/icons-material';
import { SupportAttachment } from '../../../services/supportService';

interface AttachmentViewerProps {
  attachments: SupportAttachment[];
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments }) => {
  if (attachments.length === 0) {
    return null;
  }

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

  const handleDownload = (attachment: SupportAttachment) => {
    const byteCharacters = atob(attachment.fileData);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {attachments.map((attachment) => (
          <Paper
            key={attachment.id}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 240,
              maxWidth: 340,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.25s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                transform: 'translateY(-3px)',
                borderColor: 'primary.main',
                '& .download-btn': {
                  transform: 'scale(1.05)',
                },
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
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              {getFileIcon(attachment.mimeType)}
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
                  lineHeight: 1.4,
                }}
              >
                {attachment.fileName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {formatFileSize(attachment.fileSize)}
              </Typography>
            </Box>
            <IconButton
              className="download-btn"
              size="small"
              onClick={() => handleDownload(attachment)}
              sx={{
                minWidth: 36,
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)',
                transition: 'all 0.2s ease-in-out',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};