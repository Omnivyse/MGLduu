import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from './config';

const UserLogin = ({ onLogin }) => {
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
      const response = await fetch(`${config.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        if (onLogin) {
          onLogin(data.token, data.user);
        }
        navigate('/');
      } else {
        setError(data.error || 'Нэвтрэхэд алдаа гарлаа');
      }
    } catch (error) {
      setError('Сүлжээний алдаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={styles.loginCard}>
      <div style={styles.header}>
        <h1 className="title" style={styles.title}>Нэвтрэх</h1>
        <p style={styles.subtitle}>Системд нэвтрэх</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Утасны дугаар</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            placeholder="Утасны дугаараа оруулна уу"
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Нууц үг</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Нууц үгээ оруулна уу"
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
          {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
        </button>
      </form>

      {/* Remove the footer text */}
      {/* <div style={styles.footer}>
        <p style={styles.footerText}>
          Бүртгэлгүй бол админтай холбогдоно уу
        </p>
      </div> */}
    </div>
  );
};

const styles = {
  loginCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '32px 24px 24px 24px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    margin: '0 auto',
    boxShadow: 'none',
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
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputGroup: {
    textAlign: 'left',
    width: '100%',
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
    boxSizing: 'border-box',
    marginBottom: 0,
  },
  loginButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '10px',
    width: '100%',
    boxSizing: 'border-box',
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

export default UserLogin; 