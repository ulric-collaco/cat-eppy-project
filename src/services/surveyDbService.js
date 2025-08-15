
// Survey data service using the new PostgreSQL backend

export const saveSurvey = async (surveyData, userName) => {
  const response = await fetch('/api/surveys/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ surveyData, userName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save survey');
  }

  return await response.json();
};

export const getAdminStats = async (adminPassword) => {
  const response = await fetch(`/api/surveys/get?userName=Ulric&adminPassword=${adminPassword}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch admin stats');
  }
  return await response.json();
};

export const getUserSurveys = async (userName) => {
  const response = await fetch(`/api/surveys/get?userName=${userName}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user surveys');
  }
  return await response.json();
};

export const deleteSurvey = async (surveyId, imagePublicId) => {
  const response = await fetch('/api/surveys/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ surveyId, imagePublicId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete survey');
  }

  return await response.json();
};
