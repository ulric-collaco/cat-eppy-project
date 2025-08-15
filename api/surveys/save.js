
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

      const {
        question1,
        question2,
        question3,
        imageUrl,
        imagePublicId,
        surveyType,
  custom_questions
      } = surveyData;

      const id = Date.now().toString();

      // quick connectivity check to fail fast with clearer message
      try {
        await pool.query('SELECT 1');
      } catch (dbErr) {
        console.error('DB connectivity check failed in /api/surveys/save:', dbErr);
        return res.status(500).json({ message: 'Database connection failed', error: dbErr.message });
      }

      // Normalize custom_questions: ensure we pass a valid JSON string to the DB
      let customQuestionsValue = null; // will be a JSON string when set
      if (custom_questions) {
        try {
          if (typeof custom_questions === 'string') {
            // try to parse and re-stringify to validate
            const parsed = JSON.parse(custom_questions);
            customQuestionsValue = JSON.stringify(parsed);
          } else if (Array.isArray(custom_questions) || typeof custom_questions === 'object') {
            customQuestionsValue = JSON.stringify(custom_questions);
          } else {
            console.warn('save: custom_questions present but not an object/array/string, ignoring:', custom_questions);
          }
        } catch (err) {
          console.warn('save: failed to normalize custom_questions, ignoring. Error:', err.message);
          customQuestionsValue = null;
        }
      }

      console.debug('Saving survey', { id, userName, surveyType, hasCustomQuestions: !!customQuestionsValue });

      const result = await pool.query(
        `INSERT INTO surveys (id, user_name, survey_type, question1, question2, question3, custom_questions, image_url, image_public_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
         RETURNING *`,
        [
          id,
          userName,
          surveyType,
          question1 || null,
          question2 || null,
          question3 || null,
          customQuestionsValue,
          imageUrl || null,
          imagePublicId || null,
        ]
      );

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
