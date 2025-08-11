import { saveSurveyMetadataToCloudinary } from '../lib/cloudinaryUtils';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { surveyData, userName } = req.body;

      if (!surveyData || !userName) {
        return res.status(400).json({ message: 'Missing surveyData or userName in request body.' });
      }

      // Call the existing function to save to Cloudinary
      const result = await saveSurveyMetadataToCloudinary({ ...surveyData, userName });

      res.status(200).json({ message: 'Survey saved successfully', data: result });
    } catch (error) {
      console.error('Error in /api/surveys/save:', error);
      res.status(500).json({ message: 'Failed to save survey', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}