// Cloudinary configuration
// Replace these values with your actual Cloudinary credentials
export const cloudinaryConfig = {
  cloudName: 'dodluocf3',
  uploadPreset: 'survey_uploads', // Try 'ml_default' first, or create your own upload preset
  apiKey: process.env.REACT_APP_API_KEY,
  apiSecret: process.env.REACT_APP_API_SECRET
};

// Cloudinary upload URL - this is the correct format for unsigned uploads
export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

// Helper function to upload image to Cloudinary
export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('cloud_name', cloudinaryConfig.cloudName);

  try {
    console.log('Uploading to Cloudinary with config:', {
      cloudName: cloudinaryConfig.cloudName,
      uploadPreset: cloudinaryConfig.uploadPreset,
      fileSize: file.size,
      fileName: file.name
    });

    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorData);
      
      // Provide more specific error messages
      if (response.status === 400) {
        throw new Error('Invalid upload preset or cloud name. Please check your Cloudinary configuration.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please check your Cloudinary credentials.');
      } else if (response.status === 413) {
        throw new Error('File too large. Please use an image smaller than 10MB.');
      } else {
        throw new Error(`Upload failed: ${response.status} - ${errorData}`);
      }
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export default cloudinaryConfig;
