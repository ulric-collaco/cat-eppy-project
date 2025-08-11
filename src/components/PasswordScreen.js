import React, { useState } from 'react';
import './PasswordScreen.css';

const PasswordScreen = ({ onPasswordCorrect, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === '10714') {
      onPasswordCorrect();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    setPassword('');
    setError('');
    onBack();
  };

  return (
    <div className="password-screen">
      <div className="password-container">
        <div className="password-header">
          <h1>🔒 Developer Portal Access</h1>
          <p>Enter the password to unlock the developer portal</p>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'Verifying...' : 'Unlock Portal'}
            </button>
            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              ← Back to Login
            </button>
          </div>
        </form>


      </div>
    </div>
  );
};

export default PasswordScreen;
