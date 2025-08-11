import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewSurveyForm from './pages/NewSurveyForm';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <Router>
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
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
