import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarClass = `sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`;
  const mainContentClass = `main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`;

  return (
    <>
      {/* Bouton toggle pour mobile */}
      <button className="sidebar-toggle" onClick={toggleMobileSidebar}>
        ☰
      </button>

      {/* Sidebar */}
      <nav className={sidebarClass}>
        <div className="sidebar-header">
          <Link to="/" className="logo">
            {!isCollapsed && "Tunisair Academy"}
            {isCollapsed && "TA"}
          </Link>
        </div>

        <div className="sidebar-nav">
          {isAuthenticated ? (
            <>
              {/* Section Navigation principale */}
              <div className="nav-section">
                <h3 className="nav-section-title">
                  {!isCollapsed && "Navigation"}
                </h3>
                <ul className="nav-links">
                  <li>
                    <Link 
                      to="/" 
                      className={isActive('/') ? 'active' : ''}
                    >
                      <span className="nav-icon">🏠</span>
                      {!isCollapsed && "Tableau de bord"}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/courses" 
                      className={isActive('/courses') ? 'active' : ''}
                    >
                      <span className="nav-icon">📚</span>
                      {!isCollapsed && "Cours"}
                    </Link>
                  </li>
                  {user?.role === 'admin' && (
                    <li>
                      <Link 
                        to="/admin" 
                        className={isActive('/admin') ? 'active' : ''}
                        style={{
                          background: 'var(--accent-gradient-2)',
                          color: 'white',
                          margin: '0 1rem',
                          borderRadius: '12px',
                          padding: '12px 1rem'
                        }}
                      >
                        <span className="nav-icon">👑</span>
                        {!isCollapsed && "Administration"}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Section Profil utilisateur */}
              <div className="nav-section">
                <h3 className="nav-section-title">
                  {!isCollapsed && "Mon Compte"}
                </h3>
                <ul className="nav-links">
                  <li>
                    <Link 
                      to="/profile" 
                      className={isActive('/profile') ? 'active' : ''}
                    >
                      <span className="nav-icon">
                        {user?.profile?.avatar ? (
                          <img
                            src={user.profile.avatar.startsWith('http')
                              ? user.profile.avatar
                              : `http://localhost:5000${user.profile.avatar}`}
                            alt="Avatar"
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          '👤'
                        )}
                      </span>
                      {!isCollapsed && (user?.name || 'Profil')}
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        margin: '0 1rem',
                        borderRadius: '12px',
                        padding: '12px 1rem'
                      }}
                    >
                      <span className="nav-icon">🚪</span>
                      {!isCollapsed && "Déconnexion"}
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="nav-section">
              <h3 className="nav-section-title">
                {!isCollapsed && "Connexion"}
              </h3>
              <ul className="nav-links">
                <li>
                  <Link 
                    to="/login"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      margin: '0 1rem',
                      borderRadius: '12px',
                      padding: '12px 1rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="nav-icon">🔑</span>
                    {!isCollapsed && "Connexion"}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Bouton toggle sidebar (desktop) */}
        <button 
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </nav>

      {/* Overlay pour mobile */}
      {isMobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
};

export default Navbar; 