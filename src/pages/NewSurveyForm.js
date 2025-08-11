import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { uploadImageToCloudinary } from '../cloudinary';
import { saveSurveyToCloudinary } from '../services/cloudinarySurveyService';
import './NewSurveyForm.css';

const NewSurveyForm = () => {
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const surveyType = location.state?.surveyType || 'general';

  const [formData, setFormData] = useState({
    question1: '',
    question2: '',
    question3: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    if (!formData.question1.trim() || !formData.question2.trim() || !formData.question3.trim()) {
      setError('Please fill in all questions');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('Starting survey submission...');
      console.log('Selected image:', selectedImage);
      console.log('Form data:', formData);
      
      // Step 1: Upload original image to Cloudinary
      const uploadResult = await uploadImageToCloudinary(selectedImage);
      console.log('Original image upload successful:', uploadResult);

      // Step 2: Save survey data with image URL
      const surveyData = {
        userName: currentUser,
        surveyType: surveyType,
        question1: formData.question1.trim(),
        question2: formData.question2.trim(),
        question3: formData.question3.trim()
      };

      const finalSurveyData = {
        ...surveyData,
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
      };

      // Step 3: Send data to the serverless function
      const response = await fetch('/api/surveys/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: finalSurveyData,
          userName: currentUser // Pass userName explicitly for serverless function
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save survey via API');
      }

      console.log('Survey saved successfully via API');

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting survey:', error);
      
      // Show more specific error messages
      if (error.message.includes('Invalid upload preset')) {
        setError('Cloudinary configuration error: Please check your upload preset settings.');
      } else if (error.message.includes('Authentication failed')) {
        setError('Cloudinary authentication error: Please check your API credentials.');
      } else if (error.message.includes('File too large')) {
        setError('Image file is too large. Please use an image smaller than 10MB.');
      } else if (error.message.includes('Upload failed')) {
        setError(`Image upload failed: ${error.message}`);
      } else {
        setError(`Failed to submit survey: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="new-survey-form-page">
      <div className="form-container">
        <header className="form-header">
          <h1>Create New Survey</h1>
          {currentUser === 'Ulric' && (
            <div className="admin-indicator">
              🔧 Admin Mode - Creating test survey
            </div>
          )}
          <p className="survey-type-display">
            Survey Type: <strong>{surveyType}</strong>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="survey-form">
          <div className="form-section">
            <label htmlFor="image" className="form-label">
              Upload an Image *
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageSelect}
              className="image-input"
              required
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-section">
            <label htmlFor="question1" className="form-label">
              Question One *
            </label>
            <textarea
              id="question1"
              name="question1"
              value={formData.question1}
              onChange={handleInputChange}
              placeholder="Enter your answer here"
              className="form-textarea"
              required
            />
          </div>

          <div className="form-section">
            <label htmlFor="question2" className="form-label">
              Question Two *
            </label>
            <textarea
              id="question2"
              name="question2"
              value={formData.question2}
              onChange={handleInputChange}
              placeholder="Enter your answer here"
              className="form-textarea"
              required
            />
          </div>

          <div className="form-section">
            <label htmlFor="question3" className="form-label">
              Question Three *
            </label>
            <textarea
              id="question3"
              name="question3"
              value={formData.question3}
              onChange={handleInputChange}
              placeholder="Enter your answer here"
              className="form-textarea"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewSurveyForm;