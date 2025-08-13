
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getUserSurveys, deleteSurvey, getAdminStats } from '../services/surveyDbService';
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

  useEffect(() => {
    if (currentUser === 'Ulric') {
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
    localStorage.removeItem('devPortalPassword');
    setCurrentUser(null);
    navigate('/');
  };

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const adminPass = localStorage.getItem('devPortalPassword');

      if (isAdmin) {
        const response = await getAdminStats(adminPass);
        if (response && response.data) {
          setAdminStats(response.data);
          setSurveys(response.data.recentSurveys || []);
        } else {
          setAdminStats(null);
          setSurveys([]);
        }
      } else {
        const response = await getUserSurveys(currentUser);
        if (response && response.data) {
          setSurveys(response.data);
        } else {
          setSurveys([]);
        }
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
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
        await deleteSurvey(surveyId);
        fetchSurveys();
      } catch (error) {
        console.error('Error deleting survey:', error);
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
          </section>
        )}

        <section className="survey-history-section">
          <h2>
            {isAdmin ? 'All User Surveys' : 'Your Survey History'}
            {isAdmin && surveys && <span className="survey-count"> ({surveys.length} total)</span>}
          </h2>

          {loading ? (
            <div className="loading">Loading surveys...</div>
          ) : surveys.length === 0 ? (
            <div className="no-surveys">
              {isAdmin ? 'No surveys submitted by any users yet.' : 'No surveys submitted yet.'}
            </div>
          ) : (
            <div className="surveys-list">
              {Array.isArray(surveys) && surveys.map((survey) => (
                <div key={survey.id} className="survey-item">
                  <div className="survey-image">
                    <img src={survey.image_url} alt="Survey" />
                  </div>
                  <div className="survey-details">
                    <div className="survey-header">
                      <h3>{survey.survey_type} Survey</h3>
                      {isAdmin && (
                        <span className="user-badge">
                          👤 {survey.user_name}
                        </span>
                      )}
                    </div>
                    <p className="survey-date">{formatDate(survey.created_at)}</p>
                    <p className="survey-answers">
                      <strong>Q1:</strong> {survey.question1}<br />
                      <strong>Q2:</strong> {survey.question2}<br />
                      <strong>Q3:</strong> {survey.question3}
                    </p>
                    <div className="survey-actions">
                      {isAdmin && (
                        <button
                          className="view-original-button"
                          onClick={() => window.open(survey.image_url, '_blank')}
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
