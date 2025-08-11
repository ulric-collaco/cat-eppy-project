// Polyfills for Node.js environment (Vercel Serverless Functions)
// These are typically not needed in a browser environment.
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = require('form-data');
}
if (typeof globalThis.Blob === 'undefined') {
  const { Blob } = require('buffer'); // Node.js native Blob
  globalThis.Blob = Blob;
}
if (typeof globalThis.File === 'undefined') {
  // A simple File polyfill for server-side, might need more robust solution for complex cases
  globalThis.File = class File extends Blob {
    constructor(chunks, filename, options) {
      super(chunks, options);
      this.name = filename;
    }
  };
}
// If fetch is not globally available (vercel dev usually provides it)
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = require('node-fetch');
}

// Cloudinary configuration - using environment variables for serverless
// Ensure these are set in Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dodluocf3', // Fallback to default if not set
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'survey_uploads', // Fallback to default if not set
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
};

// Cloudinary upload URL for raw files (JSON metadata)
export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/raw/upload`;

// Function to save survey metadata as a JSON file in Cloudinary
export const saveSurveyMetadataToCloudinary = async (surveyData) => {
  try {
    const surveyMetadata = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userName: surveyData.userName,
      surveyType: surveyData.surveyType,
      question1: surveyData.question1,
      question2: surveyData.question2,
      question3: surveyData.question3,
      imageUrl: surveyData.imageUrl,
      imagePublicId: surveyData.imagePublicId,
    };

    const jsonBlob = new Blob([JSON.stringify(surveyMetadata, null, 2)], {
      type: 'application/json'
    });

    const metadataFile = new File([jsonBlob], `survey_${surveyMetadata.id}.json`, {
      type: 'application/json'
    });

    const formData = new FormData();
    formData.append('file', metadataFile);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('public_id', `survey_metadata/${surveyMetadata.id}`);
    formData.append('resource_type', 'raw'); // Store as raw file, not image

    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to save survey metadata: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Survey metadata saved to Cloudinary:', result);

    // Update the master index in Cloudinary
    await updateMasterIndex(surveyMetadata.id, surveyMetadata.userName, surveyMetadata.surveyType, surveyMetadata.timestamp);

    return surveyMetadata;
  } catch (error) {
    console.error('Error saving survey metadata to Cloudinary:', error);
    throw error;
  }
};

// Update the master index file in Cloudinary
export const updateMasterIndex = async (newSurveyId, userName, surveyType, timestamp) => {
  try {
    // Try to download the current master index from Cloudinary
    const masterIndexDownloadUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/raw/upload/survey_platform/master_index.json`;
    let masterIndex = {
      lastUpdated: new Date().toISOString(),
      totalSurveys: 0,
      surveyIds: []
    };

    try {
      const response = await fetch(masterIndexDownloadUrl);
      if (response.ok) {
        masterIndex = await response.json();
      } else {
        console.warn('Master index not found in Cloudinary, creating a new one.');
      }
    } catch (fetchError) {
      console.warn('Error fetching master index, creating a new one:', fetchError);
    }

    // Add the new survey to the index if it's not already there
    const existingSurveyIndex = masterIndex.surveyIds.findIndex(s => s.id === newSurveyId);
    if (existingSurveyIndex === -1) {
      masterIndex.surveyIds.push({
        id: newSurveyId,
        userName: userName,
        surveyType: surveyType,
        timestamp: timestamp,
        metadataFile: `survey_metadata/${newSurveyId}`
      });
      masterIndex.totalSurveys = masterIndex.surveyIds.length;
    } else {
      // Update existing entry if needed (e.g., if survey was re-submitted)
      masterIndex.surveyIds[existingSurveyIndex] = {
        id: newSurveyId,
        userName: userName,
        surveyType: surveyType,
        timestamp: timestamp,
        metadataFile: `survey_metadata/${newSurveyId}`
      };
    }

    // Convert to JSON file
    const indexBlob = new Blob([JSON.stringify(masterIndex, null, 2)], {
      type: 'application/json'
    });

    const indexFile = new File([indexBlob], 'master_index.json', {
      type: 'application/json'
    });

    // Upload master index to Cloudinary
    const formData = new FormData();
    formData.append('file', indexFile);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('public_id', 'survey_platform/master_index');
    formData.append('resource_type', 'raw');

    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('Master index updated in Cloudinary');
      console.log('Master index upload response:', await response.json()); // Log full success response
    } else {
      const errorText = await response.text();
      console.warn(`Failed to update master index in Cloudinary: ${response.status} - ${errorText}`); // Log full error response
    }
  } catch (error) {
    console.error('Error updating master index:', error);
  }
};

// Retrieve all surveys from Cloudinary using the master index
export const getAllSurveysFromCloudinaryServer = async () => {
  try {
    const masterIndexUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/raw/upload/survey_platform/master_index.json`;

    const response = await fetch(masterIndexUrl);
    if (!response.ok) {
      console.warn('Master index not found in Cloudinary');
      return [];
    }

    const masterIndex = await response.json();
    console.log('Master index found:', masterIndex);

    const restoredSurveys = [];
    for (const surveyInfo of masterIndex.surveyIds) {
      try {
        const metadataUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/raw/upload/${surveyInfo.metadataFile}.json`;
        const metadataResponse = await fetch(metadataUrl);

        if (metadataResponse.ok) {
          const surveyData = await metadataResponse.json();
          restoredSurveys.push(surveyData);
        } else {
          console.warn(`Failed to download metadata for survey ${surveyInfo.id}`);
        }
      } catch (error) {
        console.error(`Error downloading survey ${surveyInfo.id}:`, error);
      }
    }

    console.log(`Successfully restored ${restoredSurveys.length} out of ${masterIndex.totalSurveys} surveys`);
    return restoredSurveys;

  } catch (error) {
    console.error('Error retrieving surveys from Cloudinary:', error);
    return [];
  }
};

// Get surveys for a specific user
export const getUserSurveysFromCloudinaryServer = async (userName) => {
  const allSurveys = await getAllSurveysFromCloudinaryServer();
  return allSurveys.filter(survey => survey.userName === userName);
};

// Get admin statistics
export const getAdminStatsFromCloudinaryServer = async () => {
  const allSurveys = await getAllSurveysFromCloudinaryServer();

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

  // User statistics
  const userStats = allSurveys.reduce((acc, survey) => {
    if (!acc[survey.userName]) {
      acc[survey.userName] = {
        total: 0,
        byType: {},
        lastSubmission: null
      };
    }

    acc[survey.userName].total += 1;
    acc[survey.userName].byType[survey.surveyType] = (acc[survey.userName].byType[survey.surveyType] || 0) + 1;

    const submissionDate = new Date(survey.timestamp);
    if (!acc[survey.userName].lastSubmission || submissionDate > new Date(acc[survey.userName].lastSubmission)) {
      acc[survey.userName].lastSubmission = survey.timestamp;
    }

    return acc;
  }, {});

  // Survey type statistics
  const typeStats = allSurveys.reduce((acc, survey) => {
    acc[survey.surveyType] = (acc[survey.surveyType] || 0) + 1;
    return acc;
  }, {});

  // Recent activity
  const recentSurveys = allSurveys
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return {
    totalSurveys: allSurveys.length,
    totalUsers: Object.keys(userStats).length,
    userStats,
    typeStats,
    recentSurveys,
    averageSurveysPerUser: allSurveys.length / Math.max(Object.keys(userStats).length, 1)
  };
};