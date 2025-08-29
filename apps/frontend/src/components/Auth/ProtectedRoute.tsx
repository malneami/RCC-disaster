import React from 'react';
import { Box, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Alert severity="error">
        You must be logged in to access this page.
      </Alert>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access this page. Your role: {user.role}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;