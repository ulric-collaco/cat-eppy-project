
import pool from './db.js';

export const getAdminStats = async () => {
  // Get data from both tables
  const studentSurveysResult = await pool.query('SELECT *, \'Student\' as survey_type FROM student_surveys ORDER BY created_at DESC');
  const employerSurveysResult = await pool.query('SELECT *, \'Employer\' as survey_type FROM employer_surveys ORDER BY created_at DESC');
  
  const studentSurveys = studentSurveysResult.rows;
  const employerSurveys = employerSurveysResult.rows;
  
  // Combine and format surveys for display
  const allSurveys = [
    ...studentSurveys.map(survey => ({
      id: `student_${survey.user_name}`,
      user_name: survey.user_name,
      survey_type: 'Student',
      created_at: survey.created_at,
      image_url: survey.image_url,
      question1: survey.s_q1_name,
      question2: survey.s_q2_gender,
      question3: survey.s_q3_age,
      custom_questions: formatStudentQuestions(survey)
    })),
    ...employerSurveys.map(survey => ({
      id: `employer_${survey.user_name}`,
      user_name: survey.user_name,
      survey_type: 'Employer',
      created_at: survey.created_at,
      image_url: survey.image_url,
      question1: survey.e_q1_employer_name,
      question2: survey.e_q2_person_interviewed,
      question3: survey.e_q3_contact_details,
      custom_questions: formatEmployerQuestions(survey)
    }))
  ];

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
    averageSurveysPerUser: allSurveys.length / Math.max(Object.keys(userStats).length, 1),
    surveys: allSurveys // Include all surveys for admin view
  };
};

export const getUserSurveys = async (userName) => {
  // Get user's surveys from both tables
  const studentSurveyResult = await pool.query('SELECT *, \'Student\' as survey_type FROM student_surveys WHERE user_name = $1', [userName]);
  const employerSurveyResult = await pool.query('SELECT *, \'Employer\' as survey_type FROM employer_surveys WHERE user_name = $1', [userName]);
  
  const surveys = [
    ...studentSurveyResult.rows.map(survey => ({
      id: `student_${survey.user_name}`,
      user_name: survey.user_name,
      survey_type: 'Student',
      created_at: survey.created_at,
      image_url: survey.image_url,
      question1: survey.s_q1_name,
      question2: survey.s_q2_gender,
      question3: survey.s_q3_age,
      custom_questions: formatStudentQuestions(survey)
    })),
    ...employerSurveyResult.rows.map(survey => ({
      id: `employer_${survey.user_name}`,
      user_name: survey.user_name,
      survey_type: 'Employer',
      created_at: survey.created_at,
      image_url: survey.image_url,
      question1: survey.e_q1_employer_name,
      question2: survey.e_q2_person_interviewed,
      question3: survey.e_q3_contact_details,
      custom_questions: formatEmployerQuestions(survey)
    }))
  ];

  return surveys.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

// Helper function to format student questions for display
const formatStudentQuestions = (survey) => {
  const questions = [];
  
  if (survey.s_q4_place_of_origin) questions.push({ question: 'Place of Origin', answer: survey.s_q4_place_of_origin });
  if (survey.s_q5_current_residence) questions.push({ question: 'Current Residence', answer: survey.s_q5_current_residence });
  if (survey.s_q6_year_completion) questions.push({ question: 'Year of Completion', answer: survey.s_q6_year_completion });
  if (survey.s_q7_education) questions.push({ question: 'Education', answer: survey.s_q7_education });
  if (survey.s_q8_program_enrolled) questions.push({ question: 'Program Enrolled', answer: survey.s_q8_program_enrolled });
  if (survey.s_q9_motivation_enroll) questions.push({ question: 'Motivation to Enroll', answer: survey.s_q9_motivation_enroll });
  if (survey.s_q10_motivation_job_market) questions.push({ question: 'Motivation for Job Market', answer: survey.s_q10_motivation_job_market });
  if (survey.s_q23_current_employment_status) questions.push({ question: 'Current Employment Status', answer: survey.s_q23_current_employment_status });
  
  return questions;
};

// Helper function to format employer questions for display
const formatEmployerQuestions = (survey) => {
  const questions = [];
  
  if (survey.e_q4_hired_yp_students) questions.push({ question: 'Hired YP Students', answer: survey.e_q4_hired_yp_students });
  if (survey.e_q5_candidates_suitable) questions.push({ question: 'Candidates Suitable', answer: survey.e_q5_candidates_suitable });
  if (survey.e_q6_num_yp_candidates) questions.push({ question: 'Number of YP Candidates', answer: survey.e_q6_num_yp_candidates });
  if (survey.e_q7_motivation_hiring) questions.push({ question: 'Motivation for Hiring', answer: survey.e_q7_motivation_hiring });
  if (survey.e_q8_onboarding_rating) questions.push({ question: 'Onboarding Rating', answer: survey.e_q8_onboarding_rating });
  if (survey.e_q11_selection_challenges) questions.push({ question: 'Selection Challenges', answer: survey.e_q11_selection_challenges });
  
  return questions;
};
