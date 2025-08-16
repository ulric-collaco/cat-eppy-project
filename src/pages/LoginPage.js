import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import './LoginPage.css';
import { userNames } from '../data/greetings';

const LoginPage = () => {
  const { setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();

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
      <div className="login-container fancy">
        <div className="login-glow" aria-hidden="true" />
        <div className="login-inner">
          <h1 className="login-title">Survey Platform Login</h1>
          <div className="fancy-greeting">Choose your account</div>
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
    </div>
  );
};

export default LoginPage;