// Survey data service using localStorage
const SURVEYS_STORAGE_KEY = 'survey_platform_surveys';

// Get all surveys from localStorage
export const getAllSurveys = () => {
  try {
    const surveys = localStorage.getItem(SURVEYS_STORAGE_KEY);
    return surveys ? JSON.parse(surveys) : [];
  } catch (error) {
    console.error('Error reading surveys from localStorage:', error);
    return [];
  }
};

// Get surveys for a specific user
export const getUserSurveys = (userName) => {
  const allSurveys = getAllSurveys();
  return allSurveys.filter(survey => survey.userName === userName);
};

// Save a new survey
export const saveSurvey = (surveyData) => {
  try {
    const allSurveys = getAllSurveys();
    const newSurvey = {
      ...surveyData,
      id: Date.now().toString(), // Simple ID generation
      timestamp: new Date().toISOString()
    };
    
    allSurveys.push(newSurvey);
    localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(allSurveys));
    
    return newSurvey;
  } catch (error) {
    console.error('Error saving survey to localStorage:', error);
    throw error;
  }
};

// Delete a survey
export const deleteSurvey = (surveyId) => {
  try {
    const allSurveys = getAllSurveys();
    const filteredSurveys = allSurveys.filter(survey => survey.id !== surveyId);
    localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(filteredSurveys));
    
    return true;
  } catch (error) {
    console.error('Error deleting survey from localStorage:', error);
    return false;
  }
};

// Clear all surveys (useful for testing)
export const clearAllSurveys = () => {
  try {
    localStorage.removeItem(SURVEYS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing surveys from localStorage:', error);
    return false;
  }
};

// Get survey statistics
export const getSurveyStats = (userName) => {
  const userSurveys = getUserSurveys(userName);
  
  return {
    total: userSurveys.length,
    byType: userSurveys.reduce((acc, survey) => {
      acc[survey.surveyType] = (acc[survey.surveyType] || 0) + 1;
      return acc;
    }, {}),
    recent: userSurveys
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
  };
};

// NEW: Admin functions for developer portal
export const getAdminStats = () => {
  const allSurveys = getAllSurveys();
  
  // User statistics
  const userStats = allSurveys.reduce((acc, survey) => {
    if (!acc[survey.userName]) {
      acc[survey.userName] = {
        total: 0,
        byType: {},
        lastSubmission: null
      };
    }
    
    acc[survey.userName].total += 1;
    acc[survey.userName].byType[survey.surveyType] = (acc[survey.userName].byType[survey.surveyType] || 0) + 1;
    
    const submissionDate = new Date(survey.timestamp);
    if (!acc[survey.userName].lastSubmission || submissionDate > new Date(acc[survey.userName].lastSubmission)) {
      acc[survey.userName].lastSubmission = survey.timestamp;
    }
    
    return acc;
  }, {});
  
  // Survey type statistics
  const typeStats = allSurveys.reduce((acc, survey) => {
    acc[survey.surveyType] = (acc[survey.surveyType] || 0) + 1;
    return acc;
  }, {});
  
  // Recent activity
  const recentSurveys = allSurveys
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  return {
    totalSurveys: allSurveys.length,
    totalUsers: Object.keys(userStats).length,
    userStats,
    typeStats,
    recentSurveys,
    averageSurveysPerUser: allSurveys.length / Math.max(Object.keys(userStats).length, 1)
  };
};

// Get surveys by date range (for admin analytics)
export const getSurveysByDateRange = (startDate, endDate) => {
  const allSurveys = getAllSurveys();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return allSurveys.filter(survey => {
    const surveyDate = new Date(survey.timestamp);
    return surveyDate >= start && surveyDate <= end;
  });
};
