import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getAdminStats, deleteSurvey } from '../services/surveyDbService';
import { toast } from 'sonner';
import PasswordScreen from '../components/PasswordScreen';
import './DevPortal.css';

const DevPortal = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [showPasswordScreen, setShowPasswordScreen] = useState(false);
  const [userTotalSurveys, setUserTotalSurveys] = useState({});

  useEffect(() => {
    const storedPassword = localStorage.getItem('devPortalPassword');
    if (currentUser !== 'Ulric' || storedPassword !== '10714') {
      setShowPasswordScreen(true);
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handlePasswordCorrect = () => {
    localStorage.setItem('devPortalPassword', '10714');
    setShowPasswordScreen(false);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('devPortalPassword');
    setCurrentUser(null);
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const adminPass = localStorage.getItem('devPortalPassword');
      const response = await getAdminStats(adminPass);
      
      if (response && response.data) {
        setAdminStats(response.data);
        setSurveys(response.data.recentSurveys || []);
        
        // Calculate total surveys per user
        const userTotals = {};
        response.data.recentSurveys.forEach(survey => {
          userTotals[survey.user_name] = (userTotals[survey.user_name] || 0) + 1;
        });
        setUserTotalSurveys(userTotals);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showPasswordScreen) {
      fetchData();
    }
  }, [fetchData, showPasswordScreen]);

  const handleDeleteSurvey = async (survey) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteSurvey(survey.id, survey.image_public_id);
        toast.success('Survey deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting survey:', error);
        toast.error('Failed to delete survey: ' + error.message);
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

  if (showPasswordScreen) {
    return (
      <PasswordScreen
        onPasswordCorrect={handlePasswordCorrect}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <div className="dev-portal">
      <header className="dev-portal-header">
        <h1>
          🔧 Developer Portal
          <span className="admin-badge">ADMIN</span>
        </h1>
        <div className="user-info">
          <span className="current-user">
            Logged in as: <strong>{currentUser}</strong>
            <span className="admin-role"> (Developer)</span>
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dev-portal-content">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <>
            <section className="admin-stats-section">
              <h2>📊 Platform Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{adminStats?.totalSurveys || 0}</div>
                  <div className="stat-label">Total Surveys</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{adminStats?.uniqueUsers24h || 0}</div>
                  <div className="stat-label">Users (24h)</div>
                </div>
              </div>

              <div className="stats-details">
                <div className="user-breakdown">
                  <h3>👥 User Survey Totals</h3>
                  {Object.entries(userTotalSurveys).map(([userName, total]) => (
                    <div key={userName} className="user-stat">
                      <span className="user-name">{userName}</span>
                      <span className="user-survey-count">{total} surveys</span>
                    </div>
                  ))}
                </div>

                <div className="type-breakdown">
                  <h3>📋 Survey Types</h3>
                  {adminStats?.typeStats && Object.entries(adminStats.typeStats).map(([type, count]) => (
                    <div key={type} className="type-stat">
                      <span className="type-name">{type}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="survey-history-section">
              <h2>All User Surveys <span className="survey-count">({surveys.length} total)</span></h2>
              
              <div className="surveys-list">
                {surveys.map((survey) => (
                  <div key={survey.id} className="survey-item">
                    <div className="survey-image">
                      <img src={survey.image_url} alt="Survey" />
                    </div>
                    <div className="survey-details">
                      <div className="survey-header">
                        <h3>{survey.survey_type} Survey</h3>
                        <span className="user-badge">
                          👤 {survey.user_name}
                        </span>
                      </div>
                      <p className="survey-date">{formatDate(survey.created_at)}</p>
                      <p className="survey-answers">
                        <strong>Q1:</strong> {survey.question1}<br />
                        <strong>Q2:</strong> {survey.question2}<br />
                        <strong>Q3:</strong> {survey.question3}
                          {survey.custom_questions && Array.isArray(survey.custom_questions) && (
                            <>
                              {survey.custom_questions.map((cq, idx) => (
                                <div key={idx}><strong>{cq.question}:</strong> {cq.answer}</div>
                              ))}
                            </>
                          )}
                      </p>
                      <div className="survey-actions">
                        <button
                          className="view-original-button"
                          onClick={() => window.open(survey.image_url, '_blank')}
                          title="View original image"
                        >
                          📷 Original
                        </button>
                        <button
                          className="delete-survey-button"
                          onClick={() => handleDeleteSurvey(survey)}
                          title="Delete survey"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DevPortal;
