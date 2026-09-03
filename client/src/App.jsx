import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleRoute } from './components/guards/RoleRoute';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import WardenLayout from './components/layout/WardenLayout';
import StudentLayout from './components/layout/StudentLayout';

// Pages
import Login from './pages/Login';
import Hostels from './pages/Hostels';
import HostelDetail from './pages/HostelDetail';
import WardenDashboard from './pages/WardenDashboard';
import Placeholder from './pages/Placeholder';

import StudentDashboard from './pages/student/Dashboard';
import StudentHostels from './pages/student/Hostels';
import StudentHostelDetail from './pages/student/HostelDetail';
import StudentRoomDetail from './pages/student/RoomDetail';
import StudentAllocation from './pages/student/Allocation';
import StudentProfile from './pages/student/Profile';
import StudentOutings from './pages/student/Outings';
import StudentNotifications from './pages/student/Notifications';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public / Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              
              {/* WARDEN ROUTES */}
              <Route element={<RoleRoute allowedRoles={['warden']} />}>
                <Route path="/warden" element={<WardenLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<WardenDashboard />} />
                  <Route path="hostels" element={<Hostels />} />
                  <Route path="hostels/:hostelId" element={<HostelDetail />} />
                  <Route path="students" element={<Placeholder title="Student Directory" />} />
                  <Route path="outings" element={<Placeholder title="Outing Requests" />} />
                  <Route path="occupancy" element={<Placeholder title="Occupancy Overview" />} />
                  <Route path="audit" element={<Placeholder title="Audit Logs" />} />
                </Route>
              </Route>

              {/* STUDENT ROUTES */}
              <Route element={<RoleRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="hostels" element={<StudentHostels />} />
                  <Route path="hostels/:hostelId" element={<StudentHostelDetail />} />
                  <Route path="rooms/:roomId" element={<StudentRoomDetail />} />
                  <Route path="allocation" element={<StudentAllocation />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="outings" element={<StudentOutings />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                </Route>
              </Route>

            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
