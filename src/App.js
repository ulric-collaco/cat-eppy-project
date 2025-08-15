import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewSurveyForm from './pages/NewSurveyForm';
import DevPortal from './pages/DevPortal';
import PasswordScreen from './components/PasswordScreen';
import './App.css';

function AppContent() {
  const [currentUserState, setCurrentUserState] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? stored : null;
    } catch (e) {
      return null;
    }
  });
  const navigate = useNavigate();

  // wrapper so consumers can call setCurrentUser(...) as before
  const setCurrentUser = (user) => {
    try {
      if (user === null) {
        localStorage.removeItem('currentUser');
      } else {
        localStorage.setItem('currentUser', user);
      }
    } catch (e) {
      // ignore storage errors
    }
    setCurrentUserState(user);
  };
  const currentUser = currentUserState;

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={currentUser ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />
          <Route 
            path="/dashboard" 
            element={currentUser ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/new-survey" 
            element={currentUser ? <NewSurveyForm /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin-login" 
            element={<PasswordScreen onPasswordCorrect={() => setCurrentUser('Ulric')} onBack={() => navigate('/')} />} 
          />
          <Route 
            path="/dev-portal" 
            element={currentUser === 'Ulric' ? <DevPortal /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
