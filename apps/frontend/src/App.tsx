import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import { FullscreenProvider } from './contexts/FullscreenContext';
import { VideoCallSocketProvider } from './contexts/VideoCallSocketContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import UserRegistrationPage from './pages/Auth/UserRegistrationPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import TicketViewPage from './pages/Tickets/TicketViewPage';
import PatientsPage from './pages/Patients/PatientsPage';
import PatientDetailsPage from './pages/Patients/PatientDetailsPage';
import HospitalsPage from './pages/Hospitals/HospitalsPage';
import HospitalDashboardPage from './pages/Hospitals/HospitalDashboardPage';
import StemiPortalPage from './pages/Stemi/StemiPortalPage';
import CommandCenterPage from './pages/Stemi/CommandCenterPage';
import StrokePortal from './pages/Portals/StrokePortal';
import StrokeCommandCenterPage from './pages/Stroke/CommandCenterPage';
import TraumaPortalPage from './pages/Trauma/TraumaPortalPage';
import EMSPortal from './pages/EMS/EMSPortal';
import EMSDashboardPage from './pages/EMSDashboard';
import AdminPage from './pages/Admin/AdminPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotificationCenterPage from './pages/NotificationCenter/NotificationCenterPage';
import HospitalUserDashboard from './pages/Hospitals/HospitalUserDashboard';
import BedsPage from './pages/Beds/BedsPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import VideoCallPage from './pages/VideoCall/VideoCallPage';
import IncomingCallNotification from './components/VideoCall/IncomingCallNotification';
import { SupportTicketsPage } from './pages/Support/SupportTicketsPage';
import { SupportTicketChatPage } from './pages/Support/SupportTicketChatPage';
import { SupportPanelPage } from './pages/Support/SupportPanelPage';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<UserRegistrationPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <FullscreenProvider>
      <VideoCallSocketProvider>
        <Layout>
          <Box sx={{ flexGrow: 1 }}>
            <IncomingCallNotification />
            <Routes>
              <Route 
                path="/" 
                element={
                  <Navigate 
                    to={user?.role === 'SUPPORT' ? '/support-panel' : '/dashboard'} 
                    replace 
                  />
                } 
              />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:ticketId" element={<TicketViewPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/video-call" element={<VideoCallPage />} />
              <Route path="/patients/:id" element={<PatientDetailsPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/hospitals/:hospitalId" element={<HospitalDashboardPage />} />
              <Route path="/my-hospital" element={
                <ProtectedRoute allowedRoles={['HOSPITAL_USER', 'ED_NURSE', 'UNIT_NURSE', 'BED_COORDINATOR']}>
                  <HospitalUserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/ems-dashboard" element={<EMSDashboardPage />} />
              <Route path="/notifications" element={<NotificationCenterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/beds"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RCC']}>
                    <BedsPage />
                  </ProtectedRoute>
                }
              />

              {/* Support Routes */}
              <Route path="/support" element={<SupportTicketsPage />} />
              <Route path="/support/:ticketId" element={<SupportTicketChatPage />} />
              <Route
                path="/support-panel"
                element={
                  <ProtectedRoute allowedRoles={['SUPPORT']}>
                    <SupportPanelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support-panel/:ticketId"
                element={
                  <ProtectedRoute allowedRoles={['SUPPORT']}>
                    <SupportTicketChatPage />
                  </ProtectedRoute>
                }
              />

              {/* Portal Routes */}
              <Route
                path="/portals/stemi"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'CATH_LAB_USER', 'DATA_COLLECTOR']}>
                    <StemiPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portals/stemi/command-center"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'CATH_LAB_USER', 'DATA_COLLECTOR']}>
                    <CommandCenterPage />
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
                path="/portals/stroke/command-center"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'DATA_COLLECTOR']}>
                    <StrokeCommandCenterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portals/trauma"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RCC', 'DATA_COLLECTOR']}>
                    <TraumaPortalPage />
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

              <Route 
                path="*" 
                element={
                  <Navigate 
                    to={user?.role === 'SUPPORT' ? '/support-panel' : '/dashboard'} 
                    replace 
                  />
                } 
              />
            </Routes>
          </Box>
        </Layout>
      </VideoCallSocketProvider>
    </FullscreenProvider>
  );
}

export default App;