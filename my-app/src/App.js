import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Portfolio from './components/Portfolio';
import Login from './components/Login';
import Register from './components/register'; // Ensure this import matches your file structure

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is already logged in when the app loads
    // This can be from localStorage, cookies, or a session
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'; // Just an example, adjust based on your auth logic
    setIsAuthenticated(loggedIn);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isLoggedIn', 'true'); // Store login state in localStorage or manage session
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isLoggedIn'); // Clear the stored login state
    // Redirect to login page
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate replace to="/Portfolio" /> : <Login onLogin={login} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate replace to="/Portfolio" /> : <Register />} />
          <Route path="/Portfolio" element={isAuthenticated ? <Portfolio logout={logout} /> : <Navigate replace to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
