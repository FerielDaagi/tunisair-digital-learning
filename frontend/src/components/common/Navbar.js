import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          E-Learning Platform
        </Link>
        {isAuthenticated ? (
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin" style={{
                  background: 'linear-gradient(135deg, #dc3545, #c82333)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 2px 8px rgba(220,53,69,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
                >
                  👑 Admin
                </Link>
              </li>
            )}
            <li>
              <Link to="/profile" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                textDecoration: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
              >
                {user?.profile?.avatar ? (
                  <img 
                    src={user.profile.avatar.startsWith('http') 
                      ? user.profile.avatar 
                      : `http://localhost:5000${user.profile.avatar}`}
                    alt="Avatar"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: 'white'
                  }}>
                    👤
                  </div>
                )}
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {user?.name || 'Profile'}
                </span>
              </Link>
            </li>
            <li><button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Logout</button></li>
          </ul>
        ) : (
          <ul className="nav-links">
            <li><Link to="/login">Login</Link></li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 