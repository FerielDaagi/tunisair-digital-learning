import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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