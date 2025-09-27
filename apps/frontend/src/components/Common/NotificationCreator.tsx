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
  Box,
  Typography,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';

import { notificationService, User, CreateNotificationData } from '../../services/notificationService';

interface NotificationCreatorProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (notification: any) => void;
  initialData?: Partial<CreateNotificationData>;
}

const NotificationCreator: React.FC<NotificationCreatorProps> = ({
  open,
  onClose,
  onSuccess,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<CreateNotificationData>({
    type: 'CASE_COMMENT',
    priority: 'MEDIUM',
    title: '',
    message: '',
    caseType: 'STEMI',
    caseId: '',
    patientId: '',
    patientName: '',
    recipientUserIds: [],
    deliveryMethod: 'IN_APP',
    ...initialData
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const userList = await notificationService.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (field: keyof CreateNotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!formData.message.trim()) {
        setError('Message is required');
        return;
      }
      if (!formData.caseId.trim()) {
        setError('Case ID is required');
        return;
      }
      if (!formData.patientId.trim()) {
        setError('Patient ID is required');
        return;
      }
      if (!formData.patientName.trim()) {
        setError('Patient name is required');
        return;
      }
      if (formData.recipientUserIds.length === 0) {
        setError('At least one recipient is required');
        return;
      }

      const notification = await notificationService.createNotification(formData);
      
      if (onSuccess) {
        onSuccess(notification);
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setError(err.message || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CASE_COMMENT':
        return <FontAwesomeIcon icon={faBell} color="#2196f3" />;
      case 'CASE_UPDATE':
        return <FontAwesomeIcon icon={faInfoCircle} color="#ff9800" />;
      case 'CASE_ASSIGNMENT':
        return <FontAwesomeIcon icon={faArrowUp} color="#9c27b0" />;
      case 'CASE_COMPLETION':
        return <FontAwesomeIcon icon={faCheckCircle} color="#4caf50" />;
      case 'CASE_ESCALATION':
        return <FontAwesomeIcon icon={faExclamationTriangle} color="#f44336" />;
      default:
        return <FontAwesomeIcon icon={faBell} color="#757575" />;
    }
  };


  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <FontAwesomeIcon icon={faBell} style={{ color: '#1976d2' }} />
        <Typography variant="h6" component="span">
          Create Notification
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Notification Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <MenuItem value="CASE_COMMENT">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon('CASE_COMMENT')}
                    Case Comment
                  </Box>
                </MenuItem>
                <MenuItem value="CASE_UPDATE">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon('CASE_UPDATE')}
                    Case Update
                  </Box>
                </MenuItem>
                <MenuItem value="CASE_ASSIGNMENT">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon('CASE_ASSIGNMENT')}
                    Case Assignment
                  </Box>
                </MenuItem>
                <MenuItem value="CASE_COMPLETION">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon('CASE_COMPLETION')}
                    Case Completion
                  </Box>
                </MenuItem>
                <MenuItem value="CASE_ESCALATION">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon('CASE_ESCALATION')}
                    Case Escalation
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <MenuItem value="LOW">
                  <Chip label="Low" color="info" size="small" />
                </MenuItem>
                <MenuItem value="MEDIUM">
                  <Chip label="Medium" color="warning" size="small" />
                </MenuItem>
                <MenuItem value="HIGH">
                  <Chip label="High" color="error" size="small" />
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Case Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Case Type</InputLabel>
              <Select
                value={formData.caseType}
                label="Case Type"
                onChange={(e) => handleInputChange('caseType', e.target.value)}
              >
                <MenuItem value="STEMI">STEMI</MenuItem>
                <MenuItem value="STROKE">Stroke</MenuItem>
                <MenuItem value="TRAUMA">Trauma</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Delivery Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Delivery Method</InputLabel>
              <Select
                value={formData.deliveryMethod}
                label="Delivery Method"
                onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
              >
                <MenuItem value="IN_APP">In-App Only</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="ALL">All Methods</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter notification title"
              required
            />
          </Grid>

          {/* Message */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter notification message"
              multiline
              rows={3}
              required
            />
          </Grid>

          {/* Case ID */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Case ID"
              value={formData.caseId}
              onChange={(e) => handleInputChange('caseId', e.target.value)}
              placeholder="Enter case ID"
              required
            />
          </Grid>

          {/* Patient ID */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Patient ID"
              value={formData.patientId}
              onChange={(e) => handleInputChange('patientId', e.target.value)}
              placeholder="Enter patient ID"
              required
            />
          </Grid>

          {/* Patient Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Patient Name"
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              placeholder="Enter patient name"
              required
            />
          </Grid>

          {/* Recipients */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              value={users.filter(user => formData.recipientUserIds.includes(user.id))}
              onChange={(_, newValue) => {
                handleInputChange('recipientUserIds', newValue.map(user => user.id));
              }}
              loading={loadingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Recipients"
                  placeholder="Select recipients"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <FontAwesomeIcon 
                        icon={faUser} 
                        style={{ marginRight: '8px', color: '#666' }} 
                      />
                    ),
                    endAdornment: (
                      <>
                        {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: '#666' }} />
                    <Box>
                      <Typography variant="body2">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} • {option.role}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.firstName} ${option.lastName}`}
                    size="small"
                    icon={<FontAwesomeIcon icon={faUser} />}
                  />
                ))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faBell} />}
        >
          {loading ? 'Creating...' : 'Create Notification'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationCreator;
