import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { CreateReplyData, repliesService } from '../../../services/repliesService';

interface ReplyFormProps {
  caseNoteId: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  patientId: string;
  patientName: string;
  ticketId?: string;
  parentReplyId?: string;
  onReplyCreated?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
  caseNoteId,
  caseType,
  caseId,
  patientId,
  patientName,
  ticketId,
  parentReplyId,
  onReplyCreated,
  onCancel,
  placeholder = "Write a reply...",
  autoFocus = false,
}) => {
  const { user } = useAuth();
  
  // Debug user data to see what we're getting
  console.log('ReplyForm user data:', user);
  
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const replyData: CreateReplyData = {
        content: content.trim(),
        priority,
        caseNoteId,
        parentReplyId,
        caseType,
        caseId,
        patientId,
        patientName,
        ticketId,
      };

      await repliesService.createReply(replyData);
      setContent('');
      setPriority('MEDIUM');
      onReplyCreated?.();
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ mt: 1, ml: 2 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: user?.role === 'ADMIN' ? '#ef4444' :
                     user?.role === 'RCC' ? '#8b5cf6' :
                     user?.role === 'DOCTOR' ? '#10b981' :
                     user?.role === 'NURSE' ? '#06b6d4' :
                     '#6366f1',
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'A'}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoFocus={autoFocus}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                fontSize: '0.85rem',
              }
            }}
          />
          
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                displayEmpty
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="LOW" sx={{ fontSize: '0.75rem' }}>Low</MenuItem>
                <MenuItem value="MEDIUM" sx={{ fontSize: '0.75rem' }}>Medium</MenuItem>
                <MenuItem value="HIGH" sx={{ fontSize: '0.75rem' }}>High</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={0.5}>
              {onCancel && (
                <Button
                  size="small"
                  onClick={onCancel}
                  sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="small"
                onClick={handleSubmit}
                variant="contained"
                disabled={!content.trim() || isSubmitting}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={10} sx={{ mr: 0.5 }} />
                    Sending...
                  </>
                ) : (
                  'Reply'
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default ReplyForm;
