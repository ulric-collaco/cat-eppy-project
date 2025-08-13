
import pool from './db.js';

export const getAdminStats = async () => {
  const allSurveysResult = await pool.query('SELECT * FROM surveys ORDER BY created_at DESC');
  const allSurveys = allSurveysResult.rows;

  if (allSurveys.length === 0) {
    return {
      totalSurveys: 0,
      totalUsers: 0,
      userStats: {},
      typeStats: {},
      recentSurveys: [],
      averageSurveysPerUser: 0
    };
  }

  const userStats = allSurveys.reduce((acc, survey) => {
    if (!acc[survey.user_name]) {
      acc[survey.user_name] = {
        total: 0,
        byType: {},
        lastSubmission: null
      };
    }

    acc[survey.user_name].total += 1;
    acc[survey.user_name].byType[survey.survey_type] = (acc[survey.user_name].byType[survey.survey_type] || 0) + 1;

    const submissionDate = new Date(survey.created_at);
    if (!acc[survey.user_name].lastSubmission || submissionDate > new Date(acc[survey.user_name].lastSubmission)) {
      acc[survey.user_name].lastSubmission = survey.created_at;
    }

    return acc;
  }, {});

  const typeStats = allSurveys.reduce((acc, survey) => {
    acc[survey.survey_type] = (acc[survey.survey_type] || 0) + 1;
    return acc;
  }, {});

  const recentSurveys = allSurveys.slice(0, 10);

  return {
    totalSurveys: allSurveys.length,
    totalUsers: Object.keys(userStats).length,
    userStats,
    typeStats,
    recentSurveys,
    averageSurveysPerUser: allSurveys.length / Math.max(Object.keys(userStats).length, 1)
  };
};

export const getUserSurveys = async (userName) => {
  const result = await pool.query('SELECT * FROM surveys WHERE user_name = $1 ORDER BY created_at DESC', [userName]);
  return result.rows;
};
