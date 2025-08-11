// Cloudinary-based survey data service for persistent storage
import { cloudinaryConfig, cloudinaryUploadUrl } from '../cloudinary';

// Store survey metadata as a JSON file in Cloudinary
export const saveSurveyToCloudinary = async (surveyData) => {
  try {
    // Create a JSON file with survey metadata
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
      textOverlayUrl: surveyData.textOverlayUrl,
      textOverlayPublicId: surveyData.textOverlayPublicId
    };

    // Convert JSON to a file blob
    const jsonBlob = new Blob([JSON.stringify(surveyMetadata, null, 2)], {
      type: 'application/json'
    });

    // Create a file from the blob
    const metadataFile = new File([jsonBlob], `survey_${surveyMetadata.id}.json`, {
      type: 'application/json'
    });

    // Upload the metadata file to Cloudinary
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
      throw new Error(`Failed to save survey metadata: ${response.status}`);
    }

    const result = await response.json();
    console.log('Survey metadata saved to Cloudinary:', result);

    // Also save to localStorage as backup
    const allSurveys = JSON.parse(localStorage.getItem('survey_platform_surveys') || '[]');
    allSurveys.push(surveyMetadata);
    localStorage.setItem('survey_platform_surveys', JSON.stringify(allSurveys));

    // Update the master index in Cloudinary
    await updateMasterIndex(allSurveys);

    return surveyMetadata;
  } catch (error) {
    console.error('Error saving survey to Cloudinary:', error);
    throw error;
  }
};

// Update the master index file in Cloudinary
const updateMasterIndex = async (allSurveys) => {
  try {
    // Create a master index with all survey IDs and basic info
    const masterIndex = {
      lastUpdated: new Date().toISOString(),
      totalSurveys: allSurveys.length,
      surveyIds: allSurveys.map(survey => ({
        id: survey.id,
        userName: survey.userName,
        surveyType: survey.surveyType,
        timestamp: survey.timestamp,
        metadataFile: `survey_metadata/${survey.id}`
      }))
    };

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
    } else {
      console.warn('Failed to update master index in Cloudinary');
    }
  } catch (error) {
    console.error('Error updating master index:', error);
  }
};

// Retrieve all surveys from Cloudinary using the master index
export const getAllSurveysFromCloudinary = async () => {
  try {
    // First try to get from localStorage (faster)
    const localSurveys = JSON.parse(localStorage.getItem('survey_platform_surveys') || '[]');
    
    // If we have local data, return it
    if (localSurveys.length > 0) {
      console.log('Using cached survey data from localStorage');
      return localSurveys;
    }

    // If no local data, try to restore from Cloudinary master index
    console.log('No local data found, attempting to restore from Cloudinary...');
    const restoredSurveys = await restoreFromMasterIndex();
    
    if (restoredSurveys.length > 0) {
      // Save restored data to localStorage
      localStorage.setItem('survey_platform_surveys', JSON.stringify(restoredSurveys));
      console.log(`Restored ${restoredSurveys.length} surveys from Cloudinary`);
      return restoredSurveys;
    }

    console.warn('No surveys found in Cloudinary. Data may have been lost.');
    return [];
  } catch (error) {
    console.error('Error retrieving surveys from Cloudinary:', error);
    return [];
  }
};

// Restore surveys from Cloudinary master index
const restoreFromMasterIndex = async () => {
  try {
    // Try to download the master index from Cloudinary
    const masterIndexUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/raw/upload/survey_platform/master_index.json`;
    
    const response = await fetch(masterIndexUrl);
    if (!response.ok) {
      console.warn('Master index not found in Cloudinary');
      return [];
    }

    const masterIndex = await response.json();
    console.log('Master index found:', masterIndex);

    // Download each survey metadata file
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
    console.error('Error restoring from master index:', error);
    return [];
  }
};

// Get surveys for a specific user
export const getUserSurveysFromCloudinary = async (userName) => {
  const allSurveys = await getAllSurveysFromCloudinary();
  return allSurveys.filter(survey => survey.userName === userName);
};

// Delete a survey from both Cloudinary and localStorage
export const deleteSurveyFromCloudinary = async (surveyId) => {
  try {
    // Remove from localStorage
    const allSurveys = JSON.parse(localStorage.getItem('survey_platform_surveys') || '[]');
    const filteredSurveys = allSurveys.filter(survey => survey.id !== surveyId);
    
    localStorage.setItem('survey_platform_surveys', JSON.stringify(filteredSurveys));

    // Update the master index in Cloudinary
    await updateMasterIndex(filteredSurveys);

    console.log('Survey removed from localStorage and master index updated');
    return true;
  } catch (error) {
    console.error('Error deleting survey:', error);
    return false;
  }
};

// Get admin statistics
export const getAdminStatsFromCloudinary = async () => {
  const allSurveys = await getAllSurveysFromCloudinary();
  
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

// Get surveys by date range
export const getSurveysByDateRangeFromCloudinary = async (startDate, endDate) => {
  const allSurveys = await getAllSurveysFromCloudinary();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return allSurveys.filter(survey => {
    const surveyDate = new Date(survey.timestamp);
    return surveyDate >= start && surveyDate <= end;
  });
};

// Manual restore function for when data is lost
export const manualRestoreFromCloudinary = async () => {
  console.log('Attempting manual restoration from Cloudinary...');
  const restoredSurveys = await restoreFromMasterIndex();
  
  if (restoredSurveys.length > 0) {
    localStorage.setItem('survey_platform_surveys', JSON.stringify(restoredSurveys));
    console.log(`Manual restoration successful: ${restoredSurveys.length} surveys restored`);
    return {
      success: true,
      message: `Restored ${restoredSurveys.length} surveys from Cloudinary`,
      surveys: restoredSurveys
    };
  } else {
    return {
      success: false,
      message: 'No surveys found in Cloudinary to restore',
      surveys: []
    };
  }
};
