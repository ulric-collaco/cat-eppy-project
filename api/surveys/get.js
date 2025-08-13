
import { getAdminStats, getUserSurveys } from '../lib/queries.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userName, adminPassword } = req.query; // Using query for GET requests

      if (!userName) {
        return res.status(400).json({ message: 'Missing userName in query parameters.' });
      }

      let surveys;
      if (userName === 'Ulric') {
        // Admin access requires password verification
        // TODO: Add back password check using environment variables
        // if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
        //   return res.status(401).json({ message: 'Unauthorized: Invalid admin password.' });
        // }
        surveys = await getAdminStats();
      } else {
        surveys = await getUserSurveys(userName);
      }

      res.status(200).json({ message: 'Surveys retrieved successfully', data: surveys });
    } catch (error) {
      console.error('Error in /api/surveys/get:', error);
      res.status(500).json({ message: 'Failed to retrieve surveys', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
