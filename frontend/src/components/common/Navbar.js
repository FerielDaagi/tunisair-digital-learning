import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, IconSizes, IconColors } from './IconTheme';

const Navbar = ({ onSidebarToggle, isSidebarCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, notifications, removeNotification, clearAllNotifications, addNotification } = useAuth();
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
                    className="notification-button"
                  >
                    <Icon name="notifications" size={IconSizes.sm} color={IconColors.white} className="nav-icon" />
                    {!isCollapsed && (
                      <>
                        <span>Notifications</span>
                        {notifications && notifications.length > 0 && (
                          <span className="notification-badge">
                            {notifications.length > 9 ? '9+' : notifications.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  
                  {/* Dropdown des notifications */}
                  {showNotifications && !isCollapsed && (
                    <div 
                      ref={notificationsRef}
                      style={{
                        position: 'fixed',
                        left: '280px',
                        top: '120px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        width: '360px',
                        maxHeight: '500px',
                        overflow: 'hidden',
                        zIndex: 1000,
                        border: '1px solid var(--gray-200)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <div style={{
                        padding: '1.25rem',
                        borderBottom: '1px solid var(--gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Icon name="notifications" size={IconSizes.sm} color="white" />
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Notifications</h4>
                        </div>
                        {notifications && notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                          >
                            <Icon name="trash2" size={IconSizes.xs} color="white" />
                            Tout effacer
                          </button>
                        )}
                      </div>
                      
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {!notifications || notifications.length === 0 ? (
                          <div style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)'
                          }}>
                            <Icon name="bell" size={IconSizes.xl} color={IconColors.light} />
                            <p style={{ margin: '1rem 0 0 0', fontSize: '1rem' }}>Aucune notification</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>Vous serez notifié ici des nouvelles activités</p>
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid var(--gray-100)',
                                backgroundColor: 'var(--bg-primary)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem'
                              }}>
                                <div style={{
                                  flexShrink: 0,
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: notification.type === 'success' ? 'var(--success)' : 
                                             notification.type === 'error' ? 'var(--danger)' : 
                                             notification.type === 'warning' ? 'var(--warning)' : 'var(--info)',
                                  opacity: 0.1
                                }}>
                                  <Icon 
                                    name={notification.type === 'success' ? 'success' : 
                                          notification.type === 'error' ? 'error' : 
                                          notification.type === 'warning' ? 'warning' : 'info'} 
                                    size={IconSizes.sm} 
                                    color={notification.type === 'success' ? 'var(--success)' : 
                                           notification.type === 'error' ? 'var(--danger)' : 
                                           notification.type === 'warning' ? 'var(--warning)' : 'var(--info)'} 
                                  />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    color: 'var(--text-primary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.4',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem'
                                  }}>
                                    {notification.message}
                                  </div>
                                  <div style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    <Icon name="clock" size={IconSizes.xs} color="var(--gray-400)" />
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
                                    color: 'var(--gray-400)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s ease',
                                    opacity: 0.7
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.opacity = 1;
                                    e.target.style.backgroundColor = 'var(--gray-100)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.opacity = 0.7;
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                  title="Supprimer la notification"
                                >
                                  <Icon name="close" size={IconSizes.xs} color="var(--gray-400)" />
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