import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  useTheme,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faHospital,
  faClock,
  faEdit,
  faUserCircle,
  faSave,
  faTimes,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useSnackbar } from 'notistack';

interface ProfileFieldProps {
  icon: any;
  label: string;
  value: string | React.ReactNode;
}

interface ProfileFieldEditProps {
  icon: any;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ icon, label, value }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2.5,
        p: 2.5,
        borderRadius: 3,
        backgroundColor: theme.palette.grey[50],
        border: `1px solid ${theme.palette.grey[200]}`,
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1976d2',
          color: 'white',
          flexShrink: 0,
          boxShadow: `0 2px 8px rgba(25, 118, 210, 0.3)`,
        }}
      >
        <FontAwesomeIcon icon={icon} size="lg" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </Typography>
        <Box sx={{ wordBreak: 'break-word' }}>
          {typeof value === 'string' ? (
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '1rem',
              }}
            >
              {value}
            </Typography>
          ) : (
            value
          )}
        </Box>
      </Box>
    </Box>
  );
};

const ProfileFieldEdit: React.FC<ProfileFieldEditProps> = ({ icon, label, value, onChange, error }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2.5,
        p: 2.5,
        borderRadius: 3,
        backgroundColor: theme.palette.grey[50],
        border: `1px solid ${error ? theme.palette.error.main : theme.palette.grey[200]}`,
        transition: 'all 0.3s ease-in-out',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1976d2',
          color: 'white',
          flexShrink: 0,
          boxShadow: `0 2px 8px rgba(25, 118, 210, 0.3)`,
        }}
      >
        <FontAwesomeIcon icon={icon} size="lg" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </Typography>
        <TextField
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [lastLogin, setLastLogin] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }>({});

  // Get last login from localStorage
  useEffect(() => {
    try {
      const savedLastLogin = localStorage.getItem('lastLoginTime');
      if (savedLastLogin) {
        setLastLogin(new Date(savedLastLogin));
      }
    } catch (error) {
      console.error('Error loading last login time:', error);
    }
  }, []);

  // Format role for display (replace underscores with spaces and capitalize)
  const formatRole = (role: string) => {
    if (!role) return 'N/A';
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format full name
  const fullName = user && user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.firstName || user?.email || 'N/A';

  // Get department/hospital name
  const department = user?.hospital?.name || 'N/A';

  // Format last login date and time
  const formatLastLogin = (): React.ReactNode => {
    if (!lastLogin) {
      return (
        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Never
        </Typography>
      );
    }
    const now = new Date();
    const diffInMs = now.getTime() - lastLogin.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    const dateStr = lastLogin.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = lastLogin.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let relativeTime = '';
    if (diffInMins < 1) {
      relativeTime = 'Just now';
    } else if (diffInMins < 60) {
      relativeTime = `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      relativeTime = `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      relativeTime = `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      relativeTime = dateStr;
    }

    return (
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
          {dateStr} at {timeStr}
        </Typography>
        <Chip
          label={relativeTime}
          size="small"
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            fontSize: '0.7rem',
            height: '20px',
          }}
        />
      </Box>
    );
  };

  // Initialize edit form data when entering edit mode
  useEffect(() => {
    if (isEditMode && user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
      setFormErrors({});
    }
  }, [isEditMode, user]);

  const validateForm = (): boolean => {
    const errors: { firstName?: string; lastName?: string; phoneNumber?: string } = {};

    if (!editFormData.firstName || editFormData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!editFormData.lastName || editFormData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    });
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm() || !user) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        phoneNumber: editFormData.phoneNumber?.trim(),
      });

      updateUser(updatedUser);
      setIsEditMode(false);
      enqueueSnackbar('Profile updated successfully!', {
        variant: 'success',
        autoHideDuration: 4000,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state if user is not available
  if (!user) {
    return (
      <>
        <Helmet>
          <title>User Profile - RCC Healthcare Platform</title>
        </Helmet>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FontAwesomeIcon
              icon={faUserCircle}
              size="2x"
              color="#1976d2"
            />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Profile
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Loading user data...
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Profile - RCC Healthcare Platform</title>
      </Helmet>

      <Box>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <FontAwesomeIcon
              icon={faUserCircle}
              size="2x"
              color="#1976d2"
              style={{ marginTop: '4px' }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              Profile
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
            Manage your account settings and preferences
          </Typography>
        </Box>

        {/* Profile Card */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                height: '100%',
                border: `1px solid ${theme.palette.grey[200]}`,
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Profile Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    mb: 4,
                    flexWrap: 'wrap',
                    pb: 3,
                    borderBottom: `2px solid ${theme.palette.grey[100]}`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#1976d2',
                      fontSize: '2.5rem',
                      fontWeight: 600,
                      boxShadow: `0 4px 12px rgba(25, 118, 210, 0.3)`,
                      border: `4px solid ${theme.palette.background.paper}`,
                    }}
                  >
                    {(isEditMode ? editFormData.firstName : user.firstName)?.charAt(0) || user.email?.charAt(0) || 'U'}
                    {(isEditMode ? editFormData.lastName : user.lastName)?.charAt(0) || ''}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        color: 'text.primary',
                        fontSize: { xs: '1.5rem', sm: '1.75rem' },
                      }}
                    >
                      {isEditMode
                        ? `${editFormData.firstName || ''} ${editFormData.lastName || ''}`.trim() || 'Edit Profile'
                        : fullName
                      }
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.95rem' }}
                    >
                      {user.email}
                    </Typography>
                    {user.role && !isEditMode && (
                      <Chip
                        label={formatRole(user.role)}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: theme.palette.primary.light,
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {isEditMode ? (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<FontAwesomeIcon icon={faTimes} />}
                          onClick={handleCancel}
                          disabled={isSaving}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: theme.palette.grey[400],
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: theme.palette.grey[600],
                              bgcolor: theme.palette.grey[50],
                            },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faSave} />}
                          onClick={handleSave}
                          disabled={isSaving}
                          sx={{
                            bgcolor: '#1976d2',
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': {
                              bgcolor: '#1565c0',
                            },
                          }}
                        >
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<FontAwesomeIcon icon={faEdit} />}
                        onClick={handleEditProfile}
                        sx={{
                          bgcolor: '#1976d2',
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: '#1565c0',
                          },
                        }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Profile Fields */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {isEditMode ? (
                    <>
                      <Grid item xs={12} sm={6}>
                        <ProfileFieldEdit
                          icon={faUser}
                          label="First Name"
                          value={editFormData.firstName}
                          onChange={(value: string) => setEditFormData({ ...editFormData, firstName: value })}
                          error={formErrors.firstName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileFieldEdit
                          icon={faUser}
                          label="Last Name"
                          value={editFormData.lastName}
                          onChange={(value: string) => setEditFormData({ ...editFormData, lastName: value })}
                          error={formErrors.lastName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileFieldEdit
                          icon={faPhone}
                          label="Phone Number"
                          value={editFormData.phoneNumber || ''}
                          onChange={(value: string) => setEditFormData({ ...editFormData, phoneNumber: value })}
                          error={formErrors.phoneNumber}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} sm={6}>
                        <ProfileField
                          icon={faUser}
                          label="Full Name"
                          value={fullName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileField
                          icon={faEnvelope}
                          label="Email Address"
                          value={user.email}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileField
                          icon={faPhone}
                          label="Phone Number"
                          value={user.phoneNumber || 'N/A'}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6}>
                    <ProfileField
                      icon={faHospital}
                      label="Role / Department"
                      value={
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, mb: 0.5 }}
                          >
                            {formatRole(user.role)}
                          </Typography>
                          {user.hospital && (
                            <Typography variant="body2" color="text.secondary">
                              {department}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ProfileField
                      icon={faClock}
                      label="Last Login Date"
                      value={formatLastLogin()}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box >
    </>
  );
};

export default ProfilePage;