import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { MessageSenderType } from '../../../services/supportService';
import { AttachmentViewer } from './AttachmentViewer';

interface MessageBubbleProps {
  content: string;
  senderType: MessageSenderType;
  sender: {
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileData: string;
    uploadedAt: string;
    uploadedBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  senderType,
  sender,
  createdAt,
  attachments = [],
}) => {
  const isSupport = senderType === 'SUPPORT';
  const senderName = `${sender.firstName} ${sender.lastName}`;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isSupport ? 'flex-start' : 'flex-end',
        mb: 2.5,
        animation: 'fadeIn 0.3s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        paddingLeft:1.5,
        paddingRight:1.5,

      }}
    >
      <Box
        sx={{
          maxWidth: '75%',
          display: 'flex',
          flexDirection: isSupport ? 'row' : 'row-reverse',
          gap: 1.5,
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: isSupport ? 'primary.main' : 'secondary.main',
            width: 40,
            height: 40,
            fontSize: '0.95rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        >
          {sender.firstName[0]}{sender.lastName[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.75,
              flexDirection: isSupport ? 'row' : 'row-reverse',
            }}
          >
            <Typography 
              variant="caption" 
              fontWeight="600"
              sx={{ 
                color: 'text.primary',
                fontSize: '0.8rem',
              }}
            >
              {senderName}
            </Typography>
            {isSupport && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.7rem' }}>
                  Support
                </Typography>
              </Box>
            )}
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              {new Date(createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: isSupport 
                ? 'rgba(25, 118, 210, 0.08)' 
                : 'rgba(156, 39, 176, 0.08)',
              border: '1px solid',
              borderColor: isSupport 
                ? 'rgba(25, 118, 210, 0.2)' 
                : 'rgba(156, 39, 176, 0.2)',
              borderRadius: isSupport ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
              maxWidth: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            {content && content !== '📎 Attachment' && (
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  mb: attachments.length > 0 ? 1.5 : 0,
                  color: 'text.primary',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                }}
              >
                {content}
              </Typography>
            )}
            {attachments.length > 0 && (
              <Box sx={{ mt: content && content !== '📎 Attachment' ? 1.5 : 0 }}>
                <AttachmentViewer attachments={attachments as any} />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};