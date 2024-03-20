import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Presuming there's a CSS file for styling

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      const response = await loginUser(credentials);
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      console.log(data);
  
      if (data.success) {
        onLogin();
        localStorage.setItem('user_id', data.user_id);
        navigate('/Portfolio');
      } else {
        setErrorMessage(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.toString());
    }
  };
  

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Username:
          <input type="text" name="username" value={credentials.username} onChange={handleChange} />
        </label>
        <label>
          Password:
          <input type="password" name="password" value={credentials.password} onChange={handleChange} />
        </label>
        <button type="submit">Login </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </form>
      <button onClick={() => navigate('/register')} className="register-button"> Register</button>
    </div>
  );
}

export default Login;

async function loginUser(credentials) {
  const response = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
    return response;
  }

