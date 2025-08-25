import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Icon, IconSizes, IconColors } from './IconTheme';

const Navbar = ({ onSidebarToggle, isSidebarCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { items: notifications, remove: removeNotification, clear: clearAllNotifications } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const notificationsRef = useRef(null);

  // Synchroniser l'état local avec la prop externe
  useEffect(() => {
    setIsCollapsed(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Gérer le clic en dehors des notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Bouton toggle pour mobile */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Sidebar */}
      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
        {/* Header de la sidebar */}
        <div className="sidebar-header">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            {isCollapsed ? 'TA' : 'Tunisair Academy'}
          </Link>
          
          {/* Bouton toggle pour desktop */}
          <button 
            onClick={toggleSidebar}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            title={isCollapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
          >
            {isCollapsed ? (
              <Icon name="sidebarToggleCollapsed" size={IconSizes.sm} color={IconColors.white} />
            ) : (
              <Icon name="sidebarToggle" size={IconSizes.sm} color={IconColors.white} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Navigation</h3>
            <ul className="nav-links">
              <li>
                <Link 
                  to="/" 
                  className={isActive('/') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <Icon name="dashboard" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                  {!isCollapsed && 'Tableau de bord'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className={isActive('/courses') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <Icon name="courses" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                  {!isCollapsed && 'Cours'}
                </Link>
              </li>
              {user?.role === 'tuteur' && (
                <>
                  <li>
                    <Link 
                      to="/tutor/my-courses" 
                      className={isActive('/tutor/my-courses') ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      <Icon name="bookOpen" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                      {!isCollapsed && 'Mes Cours'}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/tutor/create-course" 
                      className={isActive('/tutor/create-course') ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      <Icon name="plus" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                      {!isCollapsed && 'Créer un cours'}
                    </Link>
                  </li>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link 
                      to="/admin" 
                      className={isActive('/admin') ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      <Icon name="admin" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                      {!isCollapsed && 'Gestion des comptes'}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/admin/stats" 
                      className={isActive('/admin/stats') ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      <Icon name="barChart" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                      {!isCollapsed && 'Statistiques'}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Notifications de demandes de tutorat pour les admins */}
          {user?.role === 'admin' && (() => {
            const note = notifications.find(n => n.id === 'tutor-requests-pending' || n.category === 'tutor_request');
            const pendingTutorCount = note?.count ?? notifications.filter(n => n.category === 'tutor_request').length;
            if (pendingTutorCount === 0) return null;
            return (
              <div className="nav-section">
                <h3 className="nav-section-title">Notifications</h3>
                <ul className="nav-links">
                  <li>
                    <Link 
                      to="/admin"
                      className={isActive('/admin') ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      <Icon name="graduation" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                      {!isCollapsed && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Demandes de tutorat
                          <span style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            padding: '0 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {pendingTutorCount}
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
              </div>
            );
          })()}

          {/* Profil utilisateur avec accès direct */}
          {user && (
            <div className="nav-section">
              <h3 className="nav-section-title">Mon Profil</h3>
              <ul className="nav-links">
                <li>
                  <Link 
                    to="/profile" 
                    className={isActive('/profile') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar.startsWith('http')
                              ? user.profile.avatar
                              : `http://localhost:5000${user.profile.avatar}`}
                            alt="Avatar"
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          user.name ? user.name.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      {!isCollapsed && (
                        <div style={{ flex: 1 }}>
                          <div style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            lineHeight: '1.2'
                          }}>
                            {user.name || 'Utilisateur'}
                          </div>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.8rem',
                            textTransform: 'capitalize'
                          }}>
                            {user.role || 'apprenti'}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>

                {/* Notification button removed as requested */}

                <li>
                  <button 
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    <Icon name="logout" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                    {!isCollapsed && 'Déconnexion'}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar; 