import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getUserSurveysFromCloudinary, deleteSurveyFromCloudinary, getAllSurveysFromCloudinary, getAdminStatsFromCloudinary, manualRestoreFromCloudinary } from '../services/cloudinarySurveyService';
import CloudinaryTest from '../components/CloudinaryTest';
import PasswordScreen from '../components/PasswordScreen';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [showPasswordScreen, setShowPasswordScreen] = useState(false);

  // Check if current user is admin (Ulric) and has entered correct password
  useEffect(() => {
    if (currentUser === 'Ulric') {
      // Check if password is stored in localStorage
      const storedPassword = localStorage.getItem('devPortalPassword');
      if (storedPassword === '10714') {
        setIsAdmin(true);
        setShowPasswordScreen(false);
      } else {
        setShowPasswordScreen(true);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
      setShowPasswordScreen(false);
    }
  }, [currentUser]);

  const handlePasswordCorrect = () => {
    localStorage.setItem('devPortalPassword', '10714');
    setIsAdmin(true);
    setShowPasswordScreen(false);
  };

  const handleBackToLogin = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogout = () => {
    // Clear admin access on logout
    localStorage.removeItem('devPortalPassword');
    setCurrentUser(null);
    navigate('/');
  };

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedData;
      const adminPass = localStorage.getItem('devPortalPassword'); // Get password from localStorage

      if (isAdmin) {
        // Admin sees all surveys from all users via serverless function
        const response = await fetch(`/api/surveys/get?userName=Ulric&adminPassword=${adminPass}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch admin surveys via API');
        }
        fetchedData = await response.json();
        setAdminStats(fetchedData.data); // The serverless function returns admin stats directly for Ulric
        setSurveys(fetchedData.data.recentSurveys); // Display recent surveys for admin view
        console.log('Admin view: All surveys loaded via API:', fetchedData.data.totalSurveys);
      } else {
        // Regular users only see their own surveys via serverless function
        const response = await fetch(`/api/surveys/get?userName=${currentUser}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user surveys via API');
        }
        fetchedData = await response.json();
        setSurveys(fetchedData.data);
        console.log('User view: User surveys loaded via API:', fetchedData.data.length);
      }

      // Sort by timestamp (newest first) - this might be redundant if serverless sorts
      const sortedSurveys = fetchedData.data.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setSurveys(sortedSurveys);

    } catch (error) {
      console.error('Error fetching surveys:', error);
      // Optionally, set an error state to display to the user
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await deleteSurveyFromCloudinary(surveyId);
        fetchSurveys(); // Refresh the list
      } catch (error) {
        console.error('Error deleting survey:', error);
      }
    }
  };

  const handleManualRestore = async () => {
    if (window.confirm('This will attempt to restore all surveys from Cloudinary. Continue?')) {
      try {
        setLoading(true);
        const result = await manualRestoreFromCloudinary();
        
        if (result.success) {
          alert(`Restoration successful! ${result.surveys.length} surveys restored.`);
          fetchSurveys(); // Refresh the list
        } else {
          alert('No surveys found to restore from Cloudinary.');
        }
      } catch (error) {
        console.error('Error during manual restore:', error);
        alert('Restoration failed. Please check the console for details.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Show password screen if Ulric needs to enter password
  if (currentUser === 'Ulric' && showPasswordScreen) {
    return (
      <PasswordScreen
        onPasswordCorrect={handlePasswordCorrect}
        onBack={handleBackToLogin}
      />
    );
  }

  return (
    <div className={`dashboard ${isAdmin ? 'admin' : ''}`}>
                        <header className="dashboard-header">
                    <h1>
                      {isAdmin ? '🔧 Developer Portal' : 'Survey Dashboard'}
                      {isAdmin && <span className="admin-badge">ADMIN</span>}
                    </h1>
                    {!isAdmin && (
                      <div className="data-persistence-note">
                        💾 Survey data is automatically backed up to Cloudinary
                      </div>
                    )}
        <div className="user-info">
          <span className="current-user">
            Logged in as: <strong>{currentUser}</strong>
            {isAdmin && <span className="admin-role"> (Developer)</span>}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {!isAdmin && (
          <section className="new-survey-section">
            <h2>Start a New Survey</h2>
            <div className="survey-type-buttons">
              <button 
                className="survey-type-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Staff' } })}
              >
                Staff Survey
              </button>
              <button 
                className="survey-type-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Employer' } })}
              >
                Employer Survey
              </button>
              <button 
                className="survey-type-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Student' } })}
              >
                Student Survey
              </button>
            </div>
          </section>
        )}

        {/* Admin Statistics Section */}
        {isAdmin && adminStats && (
          <section className="admin-stats-section">
            <h2>📊 Platform Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{adminStats.totalSurveys}</div>
                <div className="stat-label">Total Surveys</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.totalUsers}</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.averageSurveysPerUser.toFixed(1)}</div>
                <div className="stat-label">Avg per User</div>
              </div>
            </div>
            
            <div className="stats-details">
              <div className="user-breakdown">
                <h3>👥 User Activity</h3>
                {Object.entries(adminStats.userStats).map(([userName, stats]) => (
                  <div key={userName} className="user-stat">
                    <span className="user-name">{userName}</span>
                    <span className="user-survey-count">{stats.total} surveys</span>
                    <span className="user-last-activity">
                      Last: {formatDate(stats.lastSubmission)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="type-breakdown">
                <h3>📋 Survey Types</h3>
                {Object.entries(adminStats.typeStats).map(([type, count]) => (
                  <div key={type} className="type-stat">
                    <span className="type-name">{type}</span>
                    <span className="type-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Manual Restore Button */}
            <div className="admin-restore-section">
              <h3>🔄 Data Recovery</h3>
              <p style={{ color: '#a0a0a0', marginBottom: '15px' }}>
                If survey data was lost due to server restart, use this button to restore from Cloudinary
              </p>
              <button 
                className="restore-button"
                onClick={handleManualRestore}
                disabled={loading}
              >
                {loading ? 'Restoring...' : '🔄 Restore Surveys from Cloudinary'}
              </button>
            </div>
          </section>
        )}

        {/* Admin Survey Creation Section */}
        {isAdmin && (
          <section className="new-survey-section admin-survey-section">
            <h2>🔧 Admin Tools - Create Test Survey</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
              Create surveys for testing purposes (will be attributed to you)
            </p>
            <div className="survey-type-buttons admin-buttons">
              <button 
                className="survey-type-button admin-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Staff' } })}
              >
                🧪 Staff Survey
              </button>
              <button 
                className="survey-type-button admin-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Employer' } })}
              >
                🧪 Employer Survey
              </button>
              <button 
                className="survey-type-button admin-button"
                onClick={() => navigate('/new-survey', { state: { surveyType: 'Student' } })}
              >
                🧪 Student Survey
              </button>
            </div>
          </section>
        )}

        <section className="survey-history-section">
          <h2>
            {isAdmin ? 'All User Surveys' : 'Your Survey History'}
            {isAdmin && <span className="survey-count"> ({surveys.length} total)</span>}
          </h2>
          
          {loading ? (
            <div className="loading">Loading surveys...</div>
          ) : surveys.length === 0 ? (
            <div className="no-surveys">
              {isAdmin ? 'No surveys submitted by any users yet.' : 'No surveys submitted yet.'}
            </div>
          ) : (
            <div className="surveys-list">
              {surveys.map((survey) => (
                <div key={survey.id} className="survey-item">
                  <div className="survey-image">
                    <img src={survey.finalImageUrl || survey.imageUrl} alt="Survey" />
                  </div>
                  <div className="survey-details">
                    <div className="survey-header">
                      <h3>{survey.surveyType} Survey</h3>
                      {isAdmin && (
                        <span className="user-badge">
                          👤 {survey.userName}
                        </span>
                      )}
                    </div>
                    <p className="survey-date">{formatDate(survey.timestamp)}</p>
                    <p className="survey-answers">
                      <strong>Q1:</strong> {survey.question1}<br/>
                      <strong>Q2:</strong> {survey.question2}<br/>
                      <strong>Q3:</strong> {survey.question3}
                    </p>
                    <div className="survey-actions">
                      {isAdmin && (
                        <button 
                          className="view-original-button"
                          onClick={() => window.open(survey.originalImageUrl || survey.imageUrl, '_blank')}
                          title="View original image"
                        >
                          📷 Original
                        </button>
                      )}
                      <button 
                        className="delete-survey-button"
                        onClick={() => handleDeleteSurvey(survey.id)}
                        title="Delete survey"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Admin-only Cloudinary Test Section */}
        {isAdmin && (
          <section className="new-survey-section">
            <h2>🔧 Cloudinary Upload Test (Admin Only)</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
              Test Cloudinary configuration and uploads
            </p>
            <CloudinaryTest />
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
