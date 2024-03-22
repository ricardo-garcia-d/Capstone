// Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false); 
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('https://mcsbt-stockapp.ey.r.appspot.com/register', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Registration successful
        setRegistrationSuccess(true);
      } else {
        // Handle registration failure
        alert(data.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed');
    }
  };

  const goToPortfolio = () => {
    navigate('/Portfolio'); 
  };

  return (
    <div className="register-container">
      {registrationSuccess ? (
        <div>
          <p>Registration successful!</p>
          <button onClick={goToPortfolio}>Go to Portfolio</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="register-form">
          {/* Registration form fields */}
          <label>
            Username:
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Confirm Password:
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </label>
          <button className="register-button" type="submit">Register</button>
        </form>
      )}
    </div>
  );
}

export default Register;
