import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Send, ArrowBack, AttachFile, Close } from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supportService, SupportTicketWithDetails, SupportMessage, SupportTicketStatus } from '../../services/supportService';
import { MessageBubble } from './components/MessageBubble';
import { AttachmentViewer } from './components/AttachmentViewer';
import { TicketStatusBadge } from './components/TicketStatusBadge';
import { FileUploader } from './components/FileUploader';
import { useAuth } from '../../contexts/AuthContext';

export const SupportTicketChatPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSupportPanel = location.pathname.startsWith('/support-panel');
  const isSupportRole = user?.role === 'SUPPORT';
  const [ticket, setTicket] = useState<SupportTicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isNearBottom = (): boolean => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const loadTicket = async () => {
    if (!ticketId) return;
    try {
      const data = isSupportRole 
        ? await supportService.getTicketAdmin(ticketId)
        : await supportService.getTicket(ticketId);
      
      // Check if there are new messages
      const currentMessageCount = data.messages.length;
      const hasNewMessages = currentMessageCount > lastMessageCountRef.current;
      
      setTicket(data);
      setError(null);
      
      // Only scroll if there are new messages and user is near bottom
      if (hasNewMessages && isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100);
      }
      
      lastMessageCountRef.current = currentMessageCount;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      lastMessageCountRef.current = 0; // Reset when ticket changes
      loadTicket();
    }
  }, [ticketId, isSupportRole]);

  // Scroll to bottom only when user sends a message
  useEffect(() => {
    if (ticket?.messages && ticket.messages.length > 0 && !loading) {
      // Only scroll on initial load or when user sends a message
      // The loadTicket function handles auto-refresh scrolling
      if (lastMessageCountRef.current === 0) {
        setTimeout(() => scrollToBottom(), 100);
        lastMessageCountRef.current = ticket.messages.length;
      }
    }
  }, [ticket?.messages?.length, loading]);

  useEffect(() => {
    if (ticketId) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadTicket();
      }, 20000);

      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
        }
      };
    }
  }, [ticketId]);

  const handleSendMessage = async () => {
    if (!ticketId || (!message.trim() && files.length === 0)) return;

    setSending(true);
    try {
      const messageContent = message.trim() || (files.length > 0 ? '📎 Attachment' : '');
      const sentMessage = isSupportRole
        ? await supportService.replyToTicket(ticketId, messageContent)
        : await supportService.sendMessage(ticketId, messageContent);
      const messageId = sentMessage.id;
      setMessage('');

      if (files.length > 0) {
        await Promise.all(
          files.map((file) => {
            return supportService.uploadMessageAttachment(ticketId, messageId, file);
          })
        );
        setFiles([]);
        setShowFileUploader(false);
      }

      await loadTicket();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (newStatus: SupportTicketStatus) => {
    if (!ticketId || !isSupportRole) return;
    try {
      await supportService.updateTicketStatus(ticketId, newStatus);
      await loadTicket();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/support')}>
          Back to Tickets
        </Button>
      </Box>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 70px)',
        position: 'fixed',
        top: 70,
        left: { xs: 0, sm: '280px' },
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        margin: 0,
        // padding: { xs: 1, sm: 2, md: 3 },
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <Paper 
        sx={{ 
          p: 2, 
          borderRadius: 0, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(isSupportPanel ? '/support-panel' : '/support')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700" sx={{ color: 'text.primary', mb: 0.5 }}>
                {ticket.ticketNumber}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Created by {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">•</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(ticket.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            {isSupportRole ? (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={ticket.status}
                  label="Status"
                  onChange={(e) => handleStatusUpdate(e.target.value as SupportTicketStatus)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                  }}
                >
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TicketStatusBadge status={ticket.status} />
            )}
          </Box>
          <Box 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'rgba(25, 118, 210, 0.04)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(25, 118, 210, 0.1)',
            }}
          >
            <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
              {ticket.description}
            </Typography>
            <Chip 
              label={ticket.category} 
              size="small" 
              sx={{ 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 600,
                fontSize: '0.75rem',
              }} 
            />
          </Box>
          {ticket.attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <AttachmentViewer attachments={ticket.attachments} />
            </Box>
          )}
        </Paper>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          p: 2,
          bgcolor: 'background.default',
          flex: 1,
        }}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {ticket.messages.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 8,
              minHeight: '400px',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Send sx={{ fontSize: 56, color: 'primary.main', opacity: 0.6 }} />
            </Box>
            <Typography variant="h6" color="text.primary" align="center" sx={{ mb: 1, fontWeight: 600 }}>
              No messages yet
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Start the conversation by typing your message below
            </Typography>
          </Box>
        ) : (
          <>
            {ticket.messages.map((msg: SupportMessage) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                senderType={msg.senderType}
                sender={msg.sender}
                createdAt={msg.createdAt}
                attachments={msg.attachments}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      <Paper 
        sx={{ 
          p: 2.5, 
          borderRadius: 0, 
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {files.length > 0 && (
          <Box 
            sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: 'rgba(25, 118, 210, 0.06)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(25, 118, 210, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" fontWeight="700" color="primary.main" sx={{ fontSize: '0.8rem' }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => {
                  setFiles([]);
                  setShowFileUploader(false);
                }}
                sx={{ 
                  p: 0.5,
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.75,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <AttachFile sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      maxWidth: 150, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newFiles = files.filter((_, i) => i !== index);
                      setFiles(newFiles);
                    }}
                    sx={{ 
                      p: 0.25, 
                      ml: 0.5,
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'error.dark',
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {showFileUploader && files.length === 0 && (
          <Box sx={{ mb: 2 }}>
            <FileUploader
              onFilesSelected={(selectedFiles) => {
                setFiles(selectedFiles);
                setShowFileUploader(false);
              }}
              maxSize={10 * 1024 * 1024}
              maxFiles={5}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <IconButton 
            onClick={() => setShowFileUploader(!showFileUploader)} 
            disabled={sending}
            sx={{
              bgcolor: files.length > 0 || showFileUploader ? 'primary.main' : 'rgba(0,0,0,0.04)',
              color: files.length > 0 || showFileUploader ? 'primary.contrastText' : 'text.secondary',
              width: 48,
              height: 48,
              boxShadow: files.length > 0 || showFileUploader ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none',
              '&:hover': {
                bgcolor: files.length > 0 || showFileUploader ? 'primary.dark' : 'rgba(0,0,0,0.08)',
                boxShadow: files.length > 0 || showFileUploader ? '0 4px 12px rgba(25, 118, 210, 0.4)' : 'none',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={files.length > 0 ? "Add a message (optional)..." : "Type your message here..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  borderColor: 'primary.main',
                  bgcolor: 'background.paper',
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                },
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                px: 2,
                fontSize: '0.95rem',
                '&::placeholder': {
                  opacity: 0.6,
                  color: 'text.secondary',
                },
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={sending ? null : <Send />}
            onClick={handleSendMessage}
            disabled={sending || (!message.trim() && files.length === 0)}
            sx={{ 
              minWidth: 110,
              height: 48,
              px: 3,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : 'Send'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};