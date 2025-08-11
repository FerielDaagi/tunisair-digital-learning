import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
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