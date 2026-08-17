import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Spinner from '../common/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-linkedin-bg flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-linkedin-card border border-linkedin-border">
          <div className="w-12 h-12 rounded-lg bg-linkedin-blue flex items-center justify-center text-white font-black text-xl shadow">
            R2R
          </div>
          <div className="flex items-center gap-3">
            <Spinner size="md" color="text-linkedin-blue" />
            <span className="text-sm font-medium text-linkedin-text-secondary">
              Verifying session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login page with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-linkedin-bg flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default ProtectedRoute;
