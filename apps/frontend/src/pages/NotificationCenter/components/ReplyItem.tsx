import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisV,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Reply, repliesService } from '../../../services/repliesService';
import { useAuth } from '../../../contexts/AuthContext';
import ReplyForm from './ReplyForm';

interface ReplyItemProps {
  reply: Reply;
  onReplyUpdate?: () => void;
  onReplyDelete?: () => void;
  onReplyToReply?: (parentReplyId: string) => void;
  level?: number;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  onReplyUpdate,
  onReplyDelete,
  onReplyToReply,
  level = 0,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isOwner = user?.id === reply.createdBy.id;
  const maxLevel = 5; // Increased maximum nesting level
  const canReply = level < maxLevel;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return theme.palette.error.main;
      case 'MEDIUM':
        return theme.palette.warning.main;
      case 'LOW':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'RCC':
        return 'primary';
      case 'EMS':
        return 'secondary';
      case 'DATA_COLLECTOR':
        return 'info';
      case 'CATH_LAB_USER':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditContent(reply.content);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await repliesService.deleteReply(reply.id);
      onReplyDelete?.();
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setIsDeleting(false);
      handleMenuClose();
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) {
      return;
    }

    setIsEditing(true);
    try {
      await repliesService.updateReply(reply.id, { content: editContent });
      setEditDialogOpen(false);
      onReplyUpdate?.();
    } catch (error) {
      console.error('Error updating reply:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleReplyToReply = () => {
    setShowReplyForm(true);
  };

  const handleReplyCreated = () => {
    setShowReplyForm(false);
    // Force refresh of replies with longer delay
    setTimeout(() => {
      onReplyUpdate?.();
    }, 500);
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <Box
        sx={{
          ml: level * 3,
          mb: level === 0 ? 2 : 1,
          position: 'relative',
        }}
      >
        {/* Connection line for nested replies */}
        {level > 0 && (
          <Box
            sx={{
              position: 'absolute',
              left: -20,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 1,
            }}
          />
        )}

        <Box
          sx={{
            bgcolor: 'transparent',
            transition: 'all 0.2s ease',
            p: 0,
            position: 'relative',
            borderLeft: `4px solid ${getPriorityColor(reply.priority)}`,
            pl: 2,
          }}
        >

          {/* Header - Professional layout */}
          <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: getRoleColor(reply.createdBy.role) === 'primary' ? '#6366f1' :
                         getRoleColor(reply.createdBy.role) === 'secondary' ? '#8b5cf6' :
                         getRoleColor(reply.createdBy.role) === 'error' ? '#ef4444' :
                         getRoleColor(reply.createdBy.role) === 'success' ? '#10b981' :
                         '#06b6d4',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {reply.createdBy.firstName?.[0]}{reply.createdBy.lastName?.[0]}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Name and metadata row */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  {reply.createdBy.firstName} {reply.createdBy.lastName}
                </Typography>
                
                {/* Role badge - simple */}
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: getRoleColor(reply.createdBy.role) === 'primary' ? '#6366f1' :
                             getRoleColor(reply.createdBy.role) === 'secondary' ? '#8b5cf6' :
                             getRoleColor(reply.createdBy.role) === 'error' ? '#ef4444' :
                             getRoleColor(reply.createdBy.role) === 'success' ? '#10b981' :
                             '#06b6d4',
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    color: '#ffffff',
                  }}>
                    {reply.createdBy.role.replace(/_/g, ' ')}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {formatDate(reply.createdAt)}
                </Typography>
                
                {reply.isEdited && (
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontSize: '0.8rem', 
                    fontStyle: 'italic',
                    opacity: 0.7,
                  }}>
                    edited
                  </Typography>
                )}
              </Stack>

              {/* Content */}
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.5,
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  mb: 1,
                  color: theme.palette.text.primary,
                }}
              >
                {reply.content}
              </Typography>

              {/* Actions - Simple */}
              <Stack direction="row" alignItems="center" spacing={1}>
                {canReply && (
                  <Button
                    size="small"
                    onClick={handleReplyToReply}
                    sx={{
                      minWidth: 'auto',
                      px: 1,
                      py: 0.25,
                      fontSize: '0.75rem',
                      color: theme.palette.primary.main,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Reply
                  </Button>
                )}

                {reply.childReplies && reply.childReplies.length > 0 && (
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.action.hover, 0.5),
                  }}>
                    {reply.childReplies.length} repl{reply.childReplies.length === 1 ? 'y' : 'ies'}
                  </Typography>
                )}

                {isOwner && (
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    disabled={isDeleting}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      ml: 'auto',
                      opacity: 0.6,
                      '&:hover': { 
                        opacity: 1,
                        bgcolor: alpha(theme.palette.action.hover, 0.5),
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} size="xs" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Inline Reply Form */}
          {showReplyForm && (
            <Box sx={{ mt: 2, ml: 0.5 }}>
              <ReplyForm
                caseNoteId={reply.caseNoteId}
                caseType={reply.caseType}
                caseId={reply.caseId}
                patientId={reply.patientId}
                patientName={reply.patientName}
                parentReplyId={reply.id}
                onReplyCreated={handleReplyCreated}
                onCancel={handleCancelReply}
                placeholder={`Reply to ${reply.createdBy.firstName} ${reply.createdBy.lastName}...`}
                autoFocus={true}
              />
            </Box>
          )}

          {/* Nested Replies - Clean spacing */}
          {reply.childReplies && reply.childReplies.length > 0 && (
            <Box sx={{ mt: 1.5, pl: 0.5 }}>
              {reply.childReplies.map((childReply) => (
                <ReplyItem
                  key={childReply.id}
                  reply={childReply}
                  onReplyUpdate={onReplyUpdate}
                  onReplyDelete={onReplyDelete}
                  onReplyToReply={onReplyToReply}
                  level={level + 1}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <FontAwesomeIcon icon={faEdit} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={isDeleting}>
          <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Reply</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Enter your reply..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={!editContent.trim() || isEditing}
          >
            {isEditing ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReplyItem;
