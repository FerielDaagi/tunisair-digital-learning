import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import NotificationHandler from './components/NotificationHandler';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotificationCenter from './pages/admin/NotificationCenter';
import UserStats from './pages/admin/UserStats';
import TestNotification from './pages/user/TestNotification';
import CreateCourse from './pages/tutor/CreateCourse';
import EditCourse from './pages/tutor/EditCourse';
import CreateModule from './pages/tutor/CreateModule';
import EditModule from './pages/tutor/EditModule';
import ManageModules from './pages/tutor/ManageModules';
import MyCourses from './pages/tutor/MyCourses';
import QuickCreateModule from './pages/tutor/QuickCreateModule';

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
      <NotificationHandler />
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
          <Route path="/admin/stats" element={
            <ProtectedRoute>
              <UserStats />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          <Route path="/test-notifications" element={
            <ProtectedRoute>
              <TestNotification />
            </ProtectedRoute>
          } />
          {/* Routes pour les tuteurs */}
          <Route path="/tutor/create-course" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
          <Route path="/tutor/edit-course/:courseId" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
          <Route path="/tutor/create-module/:courseId" element={<ProtectedRoute><CreateModule /></ProtectedRoute>} />
          <Route path="/tutor/edit-module/:moduleId" element={<ProtectedRoute><EditModule /></ProtectedRoute>} />
          <Route path="/tutor/quick-create-module/:courseId" element={<ProtectedRoute><QuickCreateModule /></ProtectedRoute>} />
          <Route path="/tutor/manage-modules/:courseId" element={<ProtectedRoute><ManageModules /></ProtectedRoute>} />
          <Route path="/tutor/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App; 