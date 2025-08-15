import pool from '../lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.REACT_APP_API_KEY,
  api_secret: process.env.REACT_APP_API_SECRET,
});

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { surveyId, imagePublicId } = req.body;

    if (!surveyId) {
      return res.status(400).json({ message: 'Survey ID is required' });
    }

    // First, delete the image from Cloudinary if we have a public ID
    if (imagePublicId) {
      try {
        console.log('Cloudinary Config:', {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: '***' // Don't log the actual secret
        });
        console.log('Attempting to delete image with public ID:', imagePublicId);
        
        await cloudinary.uploader.destroy(imagePublicId);
        console.log('Successfully deleted image from Cloudinary');
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', {
          message: cloudinaryError.message,
          http_code: cloudinaryError.http_code,
          name: cloudinaryError.name
        });
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Then delete the survey from the database
    await pool.query(
      'DELETE FROM surveys WHERE id = $1',
      [surveyId]
    );

    return res.status(200).json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return res.status(500).json({ message: 'Failed to delete survey' });
  }
};
