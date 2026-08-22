import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import SavedJobsPage from './pages/SavedJobsPage';
import RoadmapPage from './pages/RoadmapPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Application Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/roadmap"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap/:jobId"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved"
                element={
                  <ProtectedRoute>
                    <SavedJobsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
