import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      const { user, token } = response.data;
      
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">Welcome Back</h2>
            <p className="text-center" style={{ color: '#6c757d' }}>
              Sign in to your E-Learning account
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                marginBottom: '1rem' 
              }}>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="text-center mt-3">
        <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
  Don't have an account?{' '}
  <Link to="/signup" style={{ color: '#dc3545', textDecoration: 'none' }}>
    Sign up here
  </Link>
</p>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>
            Demo credentials: admin@example.com / password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 