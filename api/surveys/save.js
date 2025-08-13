
import pool from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { surveyData, userName } = req.body;

      if (!surveyData || !userName) {
        return res.status(400).json({ message: 'Missing surveyData or userName in request body.' });
      }

      const {
        question1,
        question2,
        question3,
        imageUrl,
        imagePublicId,
        surveyType,
      } = surveyData;

      const id = Date.now().toString();

      const result = await pool.query(
        `INSERT INTO surveys (id, user_name, survey_type, question1, question2, question3, image_url, image_public_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, userName, surveyType, question1, question2, question3, imageUrl, imagePublicId]
      );

      res.status(200).json({ message: 'Survey saved successfully', data: result.rows[0] });
    } catch (error) {
      console.error('Error in /api/surveys/save:', error);
      res.status(500).json({ message: 'Failed to save survey', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
