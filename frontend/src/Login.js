import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        if (onLogin) {
          onLogin(data.token, data.user);
        }
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.loginCard}>
        <div style={styles.header}>
          <h1 className="title" style={styles.title}>Admin Login</h1>
          <p style={styles.subtitle}>Enter your credentials to access the admin panel</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter username"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter password"
              required
            />
          </div>
          {error && (
            <div className="error" style={styles.error}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="loginButton"
            style={styles.loginButton}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    margin: '0 0 10px 0',
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#7f8c8d',
    margin: '0',
    fontSize: '0.9rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  loginButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '10px'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #f5c6cb',
    fontSize: '0.9rem'
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0'
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: '0.8rem',
    margin: '0'
  }
};

export default Login; 