import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faPlus,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { Reply, repliesService } from '../../../services/repliesService';
import ReplyItem from './ReplyItem';
import ReplyForm from './ReplyForm';

interface RepliesSectionProps {
  caseNoteId: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  patientId: string;
  patientName: string;
  ticketId?: string;
}

const RepliesSection: React.FC<RepliesSectionProps> = ({
  caseNoteId,
  caseType,
  caseId,
  patientId,
  patientName,
  ticketId,
}) => {
  const theme = useTheme();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingToReply, setReplyingToReply] = useState<string | null>(null);

  useEffect(() => {
    loadReplies();
  }, [caseNoteId]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const repliesData = await repliesService.getRepliesByCaseNote(caseNoteId);
      console.log('Loaded replies:', repliesData);
      console.log('Reply structure:', repliesData.map(r => ({ 
        id: r.id, 
        content: r.content.substring(0, 20) + '...', 
        childCount: r.childReplies?.length || 0,
        children: r.childReplies?.map(c => ({ 
          id: c.id, 
          content: c.content.substring(0, 15) + '...', 
          childCount: c.childReplies?.length || 0 
        })) || []
      })));
      setReplies(repliesData);
    } catch (err) {
      console.error('Error loading replies:', err);
      setError('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyCreated = () => {
    loadReplies();
    setShowReplyForm(false);
    setReplyingToReply(null);
  };

  const handleReplyToReply = (parentReplyId: string) => {
    setReplyingToReply(parentReplyId);
    setShowReplyForm(true);
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyingToReply(null);
  };

  const getCaseTypeColor = (caseType: string) => {
    switch (caseType) {
      case 'STROKE':
        return theme.palette.info.main;
      case 'STEMI':
        return theme.palette.error.main;
      case 'TRAUMA':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const totalReplies = replies.reduce((total, reply) => {
    return total + 1 + (reply.childReplies?.length || 0);
  }, 0);

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header - Professional design */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          p: 1,
          bgcolor: 'transparent',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FontAwesomeIcon 
            icon={faComment} 
            color={getCaseTypeColor(caseType)}
            size="sm"
          />
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            fontSize: '1rem',
            color: theme.palette.text.primary,
          }}>
            Comments
          </Typography>
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '0.8rem',
          }}>
            ({totalReplies})
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={loadReplies}
            disabled={loading}
            sx={{ 
              minWidth: 'auto',
              px: 2,
              py: 0.75,
              fontSize: '0.8rem',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.5),
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
              transition: 'all 0.2s ease',
            }}
          >
            <FontAwesomeIcon icon={faRefresh} size="xs" style={{ marginRight: 6 }} />
            Refresh
          </Button>
          {!showReplyForm && (
            <Button
              size="small"
              variant="contained"
              onClick={() => setShowReplyForm(true)}
              sx={{
                minWidth: 'auto',
                px: 2,
                py: 0.75,
                fontSize: '0.8rem',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${getCaseTypeColor(caseType)}, ${alpha(getCaseTypeColor(caseType), 0.8)})`,
                boxShadow: `0 2px 8px ${alpha(getCaseTypeColor(caseType), 0.3)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${alpha('#ffffff', 0.2)}, ${alpha('#000000', 0.1)})`,
                  borderRadius: 'inherit',
                },
                '&:hover': {
                  background: `linear-gradient(135deg, ${getCaseTypeColor(caseType)}, ${alpha(getCaseTypeColor(caseType), 0.9)})`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(getCaseTypeColor(caseType), 0.4)}`,
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <FontAwesomeIcon icon={faPlus} size="xs" style={{ marginRight: 6 }} />
              Add Comment
            </Button>
          )}
        </Stack>
      </Box>

      {/* Reply Form */}
      {showReplyForm && (
        <Box sx={{ mb: 3 }}>
          <ReplyForm
            caseNoteId={caseNoteId}
            caseType={caseType}
            caseId={caseId}
            patientId={patientId}
            patientName={patientName}
            ticketId={ticketId}
            parentReplyId={replyingToReply || undefined}
            onReplyCreated={handleReplyCreated}
            onCancel={handleCancelReply}
            placeholder={replyingToReply ? "Write a reply..." : "Write a comment..."}
            autoFocus={true}
          />
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          py: 4,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.action.hover, 0.3),
        }}>
          <CircularProgress size={28} sx={{ color: getCaseTypeColor(caseType) }} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Loading comments...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '0.9rem',
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadReplies}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Replies List */}
      {!loading && !error && (
        <>
          {replies.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 4,
                borderRadius: 2,
                border: `2px dashed ${alpha(getCaseTypeColor(caseType), 0.3)}`,
                bgcolor: alpha(getCaseTypeColor(caseType), 0.02),
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  bgcolor: getCaseTypeColor(caseType),
                  opacity: 0.1,
                }
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: alpha(getCaseTypeColor(caseType), 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <FontAwesomeIcon 
                  icon={faComment} 
                  size="2x"
                  color={alpha(getCaseTypeColor(caseType), 0.6)}
                />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                No comments yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, opacity: 0.8 }}>
                Be the first to start the conversation about this case note
              </Typography>
              {!showReplyForm && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setShowReplyForm(true)}
                  sx={{
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: getCaseTypeColor(caseType),
                    boxShadow: `0 2px 8px ${alpha(getCaseTypeColor(caseType), 0.3)}`,
                    '&:hover': {
                      bgcolor: getCaseTypeColor(caseType),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(getCaseTypeColor(caseType), 0.4)}`,
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} size="xs" style={{ marginRight: 6 }} />
                  Start Discussion
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              '& > *:not(:last-child)': { mb: 1.5 },
              '& > *:last-child': { mb: 0 }
            }}>
              {replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onReplyUpdate={loadReplies}
                  onReplyDelete={loadReplies}
                  onReplyToReply={handleReplyToReply}
                />
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default RepliesSection;
