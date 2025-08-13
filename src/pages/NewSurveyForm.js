
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { uploadImageToCloudinary } from '../cloudinary';
import { saveSurvey } from '../services/surveyDbService';
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
      const uploadResult = await uploadImageToCloudinary(selectedImage);

      const surveyData = {
        surveyType: surveyType,
        question1: formData.question1.trim(),
        question2: formData.question2.trim(),
        question3: formData.question3.trim(),
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
      };

      await saveSurvey(surveyData, currentUser);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError(`Failed to submit survey: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
