import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onSidebarToggle, isSidebarCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, notifications, removeNotification, clearAllNotifications, addNotification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Synchroniser l'état local avec la prop externe
  useEffect(() => {
    setIsCollapsed(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

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
            {isCollapsed ? '→' : '←'}
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
                  <span className="nav-icon">⌂</span>
                  {!isCollapsed && 'Tableau de bord'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className={isActive('/courses') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📖</span>
                  {!isCollapsed && 'Cours'}
                </Link>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <Link 
                    to="/admin" 
                    className={isActive('/admin') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">⚙</span>
                    {!isCollapsed && 'Administration'}
                  </Link>
                </li>
              )}
            </ul>
          </div>

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

                {/* Section Notifications */}
                <li>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    <span className="nav-icon" style={{ fontSize: '1.1rem' }}>!</span>
                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Notifications</span>
                        {notifications && notifications.length > 0 && (
                          <span style={{
                            backgroundColor: 'var(--danger)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {notifications.length > 9 ? '9+' : notifications.length}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                  

                  
                  {/* Dropdown des notifications */}
                  {showNotifications && !isCollapsed && (
                    <div style={{
                      position: 'fixed',
                      left: '280px', // Fixed position instead of absolute
                      top: '120px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      width: '320px',
                      maxHeight: '400px',
                      overflow: 'hidden',
                      zIndex: 1000,
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e9ecef',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <h4 style={{ margin: 0, color: '#495057' }}>Notifications</h4>
                        {notifications && notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6c757d',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              textDecoration: 'underline'
                            }}
                          >
                            Tout effacer
                          </button>
                        )}
                      </div>
                      
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {!notifications || notifications.length === 0 ? (
                          <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#6c757d'
                          }}>
                            Aucune notification
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              style={{
                                padding: '1rem',
                                borderBottom: '1px solid #f8f9fa',
                                backgroundColor: notification.type === 'success' ? '#f8fff9' : 
                                               notification.type === 'error' ? '#fff8f8' : '#f8fbff'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '0.5rem'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    color: notification.type === 'success' ? '#155724' : 
                                           notification.type === 'error' ? '#721c24' : '#0c5460',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                  }}>
                                    {notification.message}
                                  </div>
                                  <div style={{
                                    color: '#6c757d',
                                    fontSize: '0.75rem',
                                    marginTop: '0.25rem'
                                  }}>
                                    {new Date(notification.timestamp).toLocaleTimeString('fr-FR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeNotification(notification.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6c757d',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = 1}
                                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                                  title="Fermer"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </li>

                <li>
                  <button 
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="nav-icon">⇥</span>
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