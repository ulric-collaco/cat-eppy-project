
import pool from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { surveyData, userName } = req.body;

      if (!surveyData || !userName) {
        return res.status(400).json({ message: 'Missing surveyData or userName in request body.' });
      }

      // Temporary debug: log incoming payload (trimmed) to help diagnose save failures
      try {
        const bodyPreview = JSON.stringify({ surveyData, userName }).slice(0, 2000);
        console.info('save.js received body:', bodyPreview);
      } catch (e) {
        console.info('save.js received body (could not stringify)');
      }

      const { imageUrl, surveyType } = surveyData;

      // quick connectivity check to fail fast with clearer message
      try {
        await pool.query('SELECT 1');
      } catch (dbErr) {
        console.error('DB connectivity check failed in /api/surveys/save:', dbErr);
        return res.status(500).json({ message: 'Database connection failed', error: dbErr.message });
      }

      console.debug('Saving survey', { userName, surveyType });

      let result;

      if (surveyType === 'Student') {
        // Handle Student survey
        const {
          alwaysQuestion_0, alwaysQuestion_1, alwaysQuestion_2, alwaysQuestion_3, alwaysQuestion_4,
          alwaysQuestion_5, alwaysQuestion_6, alwaysQuestion_7, alwaysQuestion_8, alwaysQuestion_9,
          alwaysQuestion_10, alwaysQuestion_11, alwaysQuestion_12, alwaysQuestion_13, alwaysQuestion_14,
          alwaysQuestion_15, alwaysQuestion_16, alwaysQuestion_17, alwaysQuestion_18, alwaysQuestion_19,
          alwaysQuestion_20, alwaysQuestion_21, alwaysQuestion_15_1, alwaysQuestion_15_2, alwaysQuestion_15_3,
          currentlyEmployed, gender, education, motivationEnroll, motivationJobMarket, mainReason,
          softSkillsChallenges, leftJobReasons, currentStatus, jobDuration, monthlyIncome,
          motivationStay, jobChallenges, overcomeChallenges
        } = surveyData;

        result = await pool.query(
          `INSERT INTO student_surveys (
            user_name, s_q1_name, s_q2_gender, s_q3_age, s_q4_place_of_origin, s_q5_current_residence,
            s_q6_year_completion, s_q7_education, s_q8_program_enrolled, s_q9_motivation_enroll, s_q10_motivation_job_market,
            s_q11_career_growth, s_q12_family_community_role, s_q13_role_models, s_q14_personal_goals, s_q15_left_job_reason,
            s_q16_work_life_balance, s_q17_discrimination, s_q18_skills_match, s_q19_communication_problems, s_q20_soft_skills_challenges,
            s_q21_other_left_job_reasons, s_q22_cultural_challenges, s_q23_current_employment_status, s_q24_job_duration, s_q25_monthly_income,
            s_q26_motivation_stay, s_q27_job_challenges, s_q28_overcome_challenges, s_q29_advice_for_others, image_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
          ON CONFLICT (user_name) DO UPDATE SET
            s_q1_name = EXCLUDED.s_q1_name,
            s_q2_gender = EXCLUDED.s_q2_gender,
            s_q3_age = EXCLUDED.s_q3_age,
            s_q4_place_of_origin = EXCLUDED.s_q4_place_of_origin,
            s_q5_current_residence = EXCLUDED.s_q5_current_residence,
            s_q6_year_completion = EXCLUDED.s_q6_year_completion,
            s_q7_education = EXCLUDED.s_q7_education,
            s_q8_program_enrolled = EXCLUDED.s_q8_program_enrolled,
            s_q9_motivation_enroll = EXCLUDED.s_q9_motivation_enroll,
            s_q10_motivation_job_market = EXCLUDED.s_q10_motivation_job_market,
            s_q11_career_growth = EXCLUDED.s_q11_career_growth,
            s_q12_family_community_role = EXCLUDED.s_q12_family_community_role,
            s_q13_role_models = EXCLUDED.s_q13_role_models,
            s_q14_personal_goals = EXCLUDED.s_q14_personal_goals,
            s_q15_left_job_reason = EXCLUDED.s_q15_left_job_reason,
            s_q16_work_life_balance = EXCLUDED.s_q16_work_life_balance,
            s_q17_discrimination = EXCLUDED.s_q17_discrimination,
            s_q18_skills_match = EXCLUDED.s_q18_skills_match,
            s_q19_communication_problems = EXCLUDED.s_q19_communication_problems,
            s_q20_soft_skills_challenges = EXCLUDED.s_q20_soft_skills_challenges,
            s_q21_other_left_job_reasons = EXCLUDED.s_q21_other_left_job_reasons,
            s_q22_cultural_challenges = EXCLUDED.s_q22_cultural_challenges,
            s_q23_current_employment_status = EXCLUDED.s_q23_current_employment_status,
            s_q24_job_duration = EXCLUDED.s_q24_job_duration,
            s_q25_monthly_income = EXCLUDED.s_q25_monthly_income,
            s_q26_motivation_stay = EXCLUDED.s_q26_motivation_stay,
            s_q27_job_challenges = EXCLUDED.s_q27_job_challenges,
            s_q28_overcome_challenges = EXCLUDED.s_q28_overcome_challenges,
            s_q29_advice_for_others = EXCLUDED.s_q29_advice_for_others,
            image_url = EXCLUDED.image_url,
            created_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            userName, // $1
            alwaysQuestion_0 || null, // $2 - Name
            gender || null, // $3 - Gender
            alwaysQuestion_2 || null, // $4 - Age
            alwaysQuestion_3 || null, // $5 - Place of Origin
            alwaysQuestion_4 || null, // $6 - Current Residence
            alwaysQuestion_5 || null, // $7 - Year of Completion
            education || null, // $8 - Education
            alwaysQuestion_7 || null, // $9 - Program Enrolled
            motivationEnroll || null, // $10 - Motivation to Enroll
            motivationJobMarket || null, // $11 - Motivation Job Market
            alwaysQuestion_10 || null, // $12 - Career Growth
            null, // $13 - Family/Community Role (not implemented yet)
            null, // $14 - Role Models (not implemented yet)
            null, // $15 - Personal Goals (not implemented yet)
            mainReason || null, // $16 - Left Job Reason
            alwaysQuestion_12 || null, // $17 - Work Life Balance
            alwaysQuestion_13 || null, // $18 - Discrimination
            alwaysQuestion_14 || null, // $19 - Skills Match
            alwaysQuestion_15 || null, // $20 - Communication Problems
            softSkillsChallenges || null, // $21 - Soft Skills Challenges
            leftJobReasons || null, // $22 - Other Left Job Reasons
            alwaysQuestion_15_3 || null, // $23 - Cultural Challenges
            currentlyEmployed || null, // $24 - Current Employment Status
            jobDuration || null, // $25 - Job Duration
            monthlyIncome || null, // $26 - Monthly Income
            motivationStay || null, // $27 - Motivation Stay
            jobChallenges || null, // $28 - Job Challenges
            overcomeChallenges || null, // $29 - Overcome Challenges
            alwaysQuestion_21 || null, // $30 - Advice for Others
            imageUrl || null, // $31 - Image URL
          ]
        );

      } else if (surveyType === 'Employer') {
        // Handle Employer survey
        const {
          question1, question2, question3, surveyYesNoAnswer,
          customQuestion_0, customQuestion_1, customQuestion_2, customQuestion_3, customQuestion_4,
          customQuestionNo_0, customQuestionNo_1, customQuestionNo_2,
          alwaysQuestion_0, alwaysQuestion_1, alwaysQuestion_2
        } = surveyData;

        result = await pool.query(
          `INSERT INTO employer_surveys (
            user_name, e_q1_employer_name, e_q2_person_interviewed, e_q3_contact_details, e_q4_hired_yp_students,
            e_q5_candidates_suitable, e_q6_num_yp_candidates, e_q7_motivation_hiring, e_q8_onboarding_rating, e_q9_performance_comparison,
            e_q10_supervision_level, e_q11_selection_challenges, e_q12_missing_skills, image_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (user_name) DO UPDATE SET
            e_q1_employer_name = EXCLUDED.e_q1_employer_name,
            e_q2_person_interviewed = EXCLUDED.e_q2_person_interviewed,
            e_q3_contact_details = EXCLUDED.e_q3_contact_details,
            e_q4_hired_yp_students = EXCLUDED.e_q4_hired_yp_students,
            e_q5_candidates_suitable = EXCLUDED.e_q5_candidates_suitable,
            e_q6_num_yp_candidates = EXCLUDED.e_q6_num_yp_candidates,
            e_q7_motivation_hiring = EXCLUDED.e_q7_motivation_hiring,
            e_q8_onboarding_rating = EXCLUDED.e_q8_onboarding_rating,
            e_q9_performance_comparison = EXCLUDED.e_q9_performance_comparison,
            e_q10_supervision_level = EXCLUDED.e_q10_supervision_level,
            e_q11_selection_challenges = EXCLUDED.e_q11_selection_challenges,
            e_q12_missing_skills = EXCLUDED.e_q12_missing_skills,
            image_url = EXCLUDED.image_url,
            created_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            userName, // $1
            question1 || null, // $2 - Employer Name
            question2 || null, // $3 - Person Interviewed
            question3 || null, // $4 - Contact Details
            surveyYesNoAnswer || null, // $5 - Hired YP Students (Yes/No)
            // Use the appropriate follow-up questions based on yes/no answer
            (surveyYesNoAnswer === 'yes' ? customQuestion_0 : customQuestionNo_0) || null, // $6 - Candidates Suitable
            customQuestion_1 || null, // $7 - Number of YP Candidates
            customQuestion_2 || null, // $8 - Motivation for Hiring
            customQuestion_3 || null, // $9 - Onboarding Rating
            customQuestion_4 || null, // $10 - Performance Comparison
            alwaysQuestion_0 || null, // $11 - Supervision Level
            alwaysQuestion_1 || null, // $12 - Selection Challenges
            alwaysQuestion_2 || null, // $13 - Missing Skills
            imageUrl || null, // $14 - Image URL
          ]
        );

      } else {
        return res.status(400).json({ message: 'Invalid survey type. Must be either "Student" or "Employer".' });
      }

      res.status(200).json({ message: 'Survey saved successfully', data: result.rows[0] });
    } catch (error) {
      console.error('Error in /api/surveys/save:', error);
      const payload = { message: 'Failed to save survey', error: error.message };
      if (process.env.NODE_ENV !== 'production') payload.stack = error.stack;
      res.status(500).json(payload);
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
