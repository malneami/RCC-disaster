import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import PatientsPage from './pages/Patients/PatientsPage';
import PatientDetailsPage from './pages/Patients/PatientDetailsPage';
import HospitalsPage from './pages/Hospitals/HospitalsPage';
import HospitalDashboardPage from './pages/Hospitals/HospitalDashboardPage';
import STEMIPortal from './pages/Portals/STEMIPortal';
import StrokePortal from './pages/Portals/StrokePortal';
import TraumaPortal from './pages/Portals/TraumaPortal';
import EMSPortal from './pages/EMS/EMSPortal';
import EMSDashboardPage from './pages/Dashboard/EMSDashboardPage';
import AdminPage from './pages/Admin/AdminPage';
import ProfilePage from './pages/Profile/ProfilePage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailsPage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/hospitals/:hospitalId" element={<HospitalDashboardPage />} />
          <Route path="/ems-dashboard" element={<EMSDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Portal Routes */}
          <Route
            path="/portals/stemi"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'CATH_LAB_USER', 'DATA_COLLECTOR']}>
                <STEMIPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portals/stroke"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'DATA_COLLECTOR']}>
                <StrokePortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portals/trauma"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'DATA_COLLECTOR']}>
                <TraumaPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portals/ems"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'EMS', 'DATA_COLLECTOR']}>
                <EMSPortal />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Layout>
  );
}

export default App;