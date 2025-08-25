import pool from './db.js';

const createTableQuery = `
  -- Table for Student surveys
  CREATE TABLE IF NOT EXISTS student_surveys (
    user_name VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    s_q1_name TEXT,
    s_q2_gender TEXT,
    s_q3_age TEXT,
    s_q4_place_of_origin TEXT,
    s_q5_current_residence TEXT,
    s_q6_year_completion TEXT,
    s_q7_education TEXT,
    s_q8_program_enrolled TEXT,
    s_q9_motivation_enroll TEXT,
    s_q10_motivation_job_market TEXT,
    s_q11_career_growth TEXT,
    s_q12_family_community_role TEXT,
    s_q13_role_models TEXT,
    s_q14_personal_goals TEXT,
    s_q15_left_job_reason TEXT,
    s_q16_work_life_balance TEXT,
    s_q17_discrimination TEXT,
    s_q18_skills_match TEXT,
    s_q19_communication_problems TEXT,
    s_q20_soft_skills_challenges TEXT,
    s_q21_other_left_job_reasons TEXT,
    s_q22_cultural_challenges TEXT,
    s_q23_current_employment_status TEXT,
    s_q24_job_duration TEXT,
    s_q25_monthly_income TEXT,
    s_q26_motivation_stay TEXT,
    s_q27_job_challenges TEXT,
    s_q28_overcome_challenges TEXT,
    s_q29_advice_for_others TEXT,
    image_url TEXT
  );

  -- Table for Employer surveys
  CREATE TABLE IF NOT EXISTS employer_surveys (
    user_name VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    e_q1_employer_name TEXT,
    e_q2_person_interviewed TEXT,
    e_q3_contact_details TEXT,
    e_q4_hired_yp_students TEXT, -- Yes/No
    e_q5_candidates_suitable TEXT,
    e_q6_num_yp_candidates TEXT,
    e_q7_motivation_hiring TEXT,
    e_q8_onboarding_rating TEXT,
    e_q9_performance_comparison TEXT,
    e_q10_supervision_level TEXT,
    e_q11_selection_challenges TEXT,
    e_q12_missing_skills TEXT,
    image_url TEXT
  );

  -- Add indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_student_surveys_user_name ON student_surveys(user_name);
  CREATE INDEX IF NOT EXISTS idx_employer_surveys_user_name ON employer_surveys(user_name);
`;

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(createTableQuery);
    console.log('Table "surveys" created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();