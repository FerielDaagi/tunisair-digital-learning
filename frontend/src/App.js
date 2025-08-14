import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

import './App.css';

// Composant pour détecter la page courante
const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };
  
  return (
    <div className={`app-container ${isAuthPage ? 'auth-pages' : ''}`}>
      <Navbar 
        onSidebarToggle={handleSidebarToggle}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/courses/:id" element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 