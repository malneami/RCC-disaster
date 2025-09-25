import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox as MuiCheckbox,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Divider,
  Stack,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faEye,
  faEyeSlash,
  faPaperPlane,
  faTimes,
  faUser,
  faUsers,
  faBell,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

import { notificationService, User, CreateCaseNoteData } from '../../../services/notificationService';

interface CaseNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCaseNoteData) => Promise<void>;
  patientName: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  patientId: string;
  ticketId?: string;
  loading?: boolean;
}

const CaseNoteModal: React.FC<CaseNoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  patientName,
  caseType,
  caseId,
  patientId,
  ticketId,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    content: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    notifyTeam: true,
    deliveryMethod: 'IN_APP' as 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showRecipients, setShowRecipients] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const usersData = await notificationService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsersError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      return;
    }

    const caseNoteData: CreateCaseNoteData = {
      content: formData.content,
      priority: formData.priority,
      caseType,
      caseId,
      ticketId,
      patientId,
      patientName,
      notifyTeam: formData.notifyTeam,
      recipientUserIds: selectedUsers,
      deliveryMethod: formData.deliveryMethod,
    };

    try {
      await onSubmit(caseNoteData);
      handleClose();
    } catch (err) {
      console.error('Error creating case note:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      content: '',
      priority: 'MEDIUM',
      notifyTeam: true,
      deliveryMethod: 'IN_APP',
    });
    setSelectedUsers([]);
    setShowRecipients(false);
    setUsersError(null);
    onClose();
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

  const theme = useTheme();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <FontAwesomeIcon icon={faExclamationTriangle} />;
      case 'MEDIUM':
        return <FontAwesomeIcon icon={faInfoCircle} />;
      case 'LOW':
        return <FontAwesomeIcon icon={faCheckCircle} />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} />;
    }
  };

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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '700px',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }
      }}
    >
      {/* Enhanced Header */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${getCaseTypeColor(caseType)} 0%, ${alpha(getCaseTypeColor(caseType), 0.8)} 100%)`,
        color: 'white',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 48, 
                height: 48,
                backdropFilter: 'blur(10px)'
              }}>
                <FontAwesomeIcon icon={faComment} size="lg" />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Quick Case Note
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={caseType} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }} 
                  />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Patient: {patientName}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClose} 
              size="small"
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          </Box>
        </Box>
        
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }} />
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Note Content Card */}
          <Card sx={{ 
            border: '2px solid',
            borderColor: formData.content.trim() ? getPriorityColor(formData.priority) : 'divider',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: getPriorityColor(formData.priority),
              boxShadow: `0 8px 25px ${alpha(getPriorityColor(formData.priority), 0.15)}`,
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FontAwesomeIcon icon={faComment} color={getPriorityColor(formData.priority)} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Case Note
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter your case note or pathway update..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Priority and Notification Settings */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon icon={faBell} />
                Notification Settings
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority Level"
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    startAdornment={
                      <Box sx={{ mr: 1, color: getPriorityColor(formData.priority) }}>
                        {getPriorityIcon(formData.priority)}
                      </Box>
                    }
                    sx={{
                      borderRadius: 2,
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }
                    }}
                  >
                    <MenuItem value="LOW">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faCheckCircle} color={theme.palette.success.main} />
                        Low Priority
                      </Box>
                    </MenuItem>
                    <MenuItem value="MEDIUM">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faInfoCircle} color={theme.palette.warning.main} />
                        Medium Priority
                      </Box>
                    </MenuItem>
                    <MenuItem value="HIGH">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} color={theme.palette.error.main} />
                        High Priority
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.notifyTeam}
                      onChange={(e) => handleInputChange('notifyTeam', e.target.checked)}
                      sx={{
                        color: getCaseTypeColor(caseType),
                        '&.Mui-checked': {
                          color: getCaseTypeColor(caseType),
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FontAwesomeIcon icon={faUsers} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Notify Team Members
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>

          {/* Enhanced Recipients Section */}
          {formData.notifyTeam && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faUsers} />
                    Team Recipients
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowRecipients(!showRecipients)}
                      startIcon={<FontAwesomeIcon icon={showRecipients ? faEyeSlash : faEye} />}
                      sx={{ borderRadius: 2 }}
                    >
                      {showRecipients ? 'Hide' : 'View'} Users
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleSelectAll}
                      sx={{ borderRadius: 2 }}
                    >
                      {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  p: 2, 
                  bgcolor: alpha(getCaseTypeColor(caseType), 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(getCaseTypeColor(caseType), 0.2)}`
                }}>
                  <Avatar sx={{ bgcolor: getCaseTypeColor(caseType), width: 40, height: 40 }}>
                    <FontAwesomeIcon icon={faUser} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedUsers.length} of {users.length} users selected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUsers.length === 0 
                        ? 'No recipients selected - note will be saved without notifications'
                        : `Notifications will be sent to ${selectedUsers.length} team member${selectedUsers.length > 1 ? 's' : ''}`
                      }
                    </Typography>
                  </Box>
                </Box>

                {showRecipients && (
                  <Paper sx={{ 
                    mt: 2, 
                    maxHeight: 300, 
                    overflow: 'auto',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    {usersLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : usersError ? (
                      <Alert severity="error" sx={{ m: 2 }}>
                        {usersError}
                      </Alert>
                    ) : (
                      <List sx={{ p: 1 }}>
                        {users.map((user, index) => (
                          <React.Fragment key={user.id}>
                            <ListItem 
                              sx={{ 
                                borderRadius: 2,
                                mb: 0.5,
                                '&:hover': {
                                  bgcolor: alpha(getCaseTypeColor(caseType), 0.05),
                                }
                              }}
                            >
                              <MuiCheckbox
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleUserSelection(user.id)}
                                sx={{
                                  color: getCaseTypeColor(caseType),
                                  '&.Mui-checked': {
                                    color: getCaseTypeColor(caseType),
                                  }
                                }}
                              />
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32, 
                                mr: 2,
                                bgcolor: getRoleColor(user.role) === 'primary' ? theme.palette.primary.main :
                                         getRoleColor(user.role) === 'secondary' ? theme.palette.secondary.main :
                                         getRoleColor(user.role) === 'error' ? theme.palette.error.main :
                                         getRoleColor(user.role) === 'success' ? theme.palette.success.main :
                                         theme.palette.info.main
                              }}>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                  {user.firstName[0]}{user.lastName[0]}
                                </Typography>
                              </Avatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {user.firstName} {user.lastName}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                  </Typography>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={user.role.replace(/_/g, ' ')}
                                  size="small"
                                  color={getRoleColor(user.role) as any}
                                  variant="outlined"
                                  sx={{ borderRadius: 2 }}
                                />
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < users.length - 1 && <Divider sx={{ mx: 2 }} />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.content.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faPaperPlane} />}
          sx={{ 
            borderRadius: 2, 
            px: 3,
            bgcolor: getCaseTypeColor(caseType),
            '&:hover': {
              bgcolor: getCaseTypeColor(caseType),
              filter: 'brightness(0.9)',
            }
          }}
        >
          {loading ? 'Sending...' : 'Send Case Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CaseNoteModal;
