import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import './LoginPage.css';

const LoginPage = () => {
  const { setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const userNames = ['Ulric', 'Jeremy', 'Asher', 'Dev','Diva','Vedant'];

  const handleLogin = (userName) => {
    if (userName === 'Ulric') {
      navigate('/admin-login');
    } else {
      setCurrentUser(userName);
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Survey Platform Login</h1>
        <div className="user-options">
          {userNames.map(userName => (
            <button
              key={userName}
              className="user-button"
              onClick={() => handleLogin(userName)}
            >
              {userName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;