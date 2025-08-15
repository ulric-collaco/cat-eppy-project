
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { uploadImageToCloudinary } from '../cloudinary';
import { saveSurvey } from '../services/surveyDbService';
import './NewSurveyForm.css';

const surveyQuestions = {
  'Employer': [
    'Name of the Employer',
    'Name of the Person Interviewed',
    'Contact Details: Email or Phone number'
  ],
  'Student': [
    'Name of the Employer',
    'Name of the Person Interviewed',
    'Contact Details: Email or Phone number'
  ],
  'general': [ // Fallback
    'Name of the Employer',
    'Name of the Person Interviewed',
    'Contact Details: Email or Phone number'
  ]
};

const extraQuestions = {
  'Employer': [
  'Do you find the candidates suitable for the profile you offered them?',
  'Currently how many YP candidates are working with you?',
  'What was your motivation for hiring students from YP?\n(Probe: basic training done, job preparedness of student, bulk availability)',
  'How would you rate the onboarding process for YP candidates?\n(Probe: Areas where candidates typically excel or need more support upon joining.)',
  'How have YP candidates performed over time compared to other recruits?\n(Probe: Any examples of outstanding performance or areas where they consistently struggle.)'
  ],
  'Student': [
    'Q6. Currently how many YP candidates are working with you?',
    'Q7. What was your motivation for hiring students from YP?\n(Consider: basic training done, job preparedness of student, bulk availability)',
    'Q8. How would you rate the onboarding process for YP candidates?\n(Consider: Areas where candidates typically excel or need more support upon joining)',
    'Q9. What level of supervision or mentoring do YP candidates typically require in their initial months?'
  ],
  'general': [ // Fallback
    'Q6. Currently how many YP candidates are working with you?',
    'Q7. What was your motivation for hiring students from YP?\n(Consider: basic training done, job preparedness of student, bulk availability)',
    'Q8. How would you rate the onboarding process for YP candidates?\n(Consider: Areas where candidates typically excel or need more support upon joining)',
    'Q9. What level of supervision or mentoring do YP candidates typically require in their initial months?'
  ]
};

// Follow-up questions to show when the user answers 'no' to hiring YP
const extraQuestionsNo = {
  'Employer': [
    'Do you find the candidates suitable for the profile you wanted?',
    'What was your motivation for hiring the current employee that you did? What strengths were you actively looking for?\n(Probe: basic training done, job preparedness of student, bulk availability)',
    'How would you rate the onboarding process for your employees?\n(Probe: Areas where candidates typically excel or need more support upon joining.)'
  ],
  'Student': [
    // fallback for students (can be customized later)
    'How would you rate your overall experience?'
  ],
  'general': [
    'How would you rate your overall experience?'
  ]
};

// Questions that should always appear for certain survey types (regardless of yes/no)
const extraAlwaysQuestions = {
  'Employer': [
    'What level of supervision or mentoring do your employees typically require in their initial months?',
    'What challenges do you generally face while selecting anybody as an employee? (Probe: student availability, travel restrictions, relocation issues, not meeting salary expectations, job continuity)',
    'What key skills or qualities do you find missing in candidates, if any? (e.g., communication, punctuality, teamwork)'
  ],
  'Student': [],
  'general': []
};

const NewSurveyForm = () => {
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const surveyType = location.state?.surveyType || 'general';
  const questions = surveyQuestions[surveyType] || surveyQuestions.general;

  const [formData, setFormData] = useState({
    question1: '',
    question2: '',
    question3: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hiredYuvaStudents, setHiredYuvaStudents] = useState('no');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHiredYuvaStudentsChange = (e) => {
    const { value } = e.target;
    setHiredYuvaStudents(value);
    if (value === 'no') {
      // Clean up form data for follow-up questions
      const newFormData = { ...formData };
      Object.keys(newFormData).forEach(key => {
        if (key.startsWith('customQuestion_')) {
          delete newFormData[key];
        }
      });
      setFormData(newFormData);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
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

    for (let i = 0; i < questions.length; i++) {
      if (!formData[`question${i + 1}`]?.trim()) {
        setError('Please fill in all standard questions');
        return;
      }
    }

    if (hiredYuvaStudents === 'yes') {
      // Check all follow-up questions are answered
      for (let i = 0; i < extraQuestions[surveyType].length; i++) {
        if (!formData[`customQuestion_${i}`]?.trim()) {
          setError(`Please fill in the follow-up questions.`);
          return;
        }
      }
    }

    if (hiredYuvaStudents === 'no') {
      // Check all follow-up questions for the 'no' path are answered
      for (let i = 0; i < extraQuestionsNo[surveyType].length; i++) {
        if (!formData[`customQuestionNo_${i}`]?.trim()) {
          setError(`Please fill in the follow-up questions.`);
          return;
        }
      }
    }

    // Validate always-present questions
    if (extraAlwaysQuestions[surveyType] && extraAlwaysQuestions[surveyType].length > 0) {
      for (let i = 0; i < extraAlwaysQuestions[surveyType].length; i++) {
        if (!formData[`alwaysQuestion_${i}`]?.trim()) {
          setError('Please fill in the required employer questions.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const uploadResult = await uploadImageToCloudinary(selectedImage);

      // Collect dynamic follow-up answers from formData (future-proof)
      const customAnswers = [];
      Object.keys(formData).forEach((key) => {
        if (key.startsWith('customQuestion_')) {
          const idx = key.split('_')[1];
          const questionText = extraQuestions[surveyType] && extraQuestions[surveyType][idx]
            ? extraQuestions[surveyType][idx]
            : `Custom Question ${idx}`;
          const answer = (formData[key] || '').trim();
          customAnswers.push({ question: questionText, answer });
        }
        if (key.startsWith('customQuestionNo_')) {
          const idx = key.split('_')[1];
          const questionText = extraQuestionsNo[surveyType] && extraQuestionsNo[surveyType][idx]
            ? extraQuestionsNo[surveyType][idx]
            : `Custom Question No ${idx}`;
          const answer = (formData[key] || '').trim();
          customAnswers.push({ question: questionText, answer });
        }
        if (key.startsWith('alwaysQuestion_')) {
          const idx = key.split('_')[1];
          const questionText = extraAlwaysQuestions[surveyType] && extraAlwaysQuestions[surveyType][idx]
            ? extraAlwaysQuestions[surveyType][idx]
            : `Always Question ${idx}`;
          const answer = (formData[key] || '').trim();
          customAnswers.push({ question: questionText, answer });
        }
      });

      const surveyData = {
        surveyType: surveyType,
        question1: formData.question1.trim(),
        question2: formData.question2.trim(),
        question3: formData.question3.trim(),
  custom_questions: customAnswers,
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
              {questions[0]} *
            </label>
            <input
              type="text"
              id="question1"
              name="question1"
              value={formData.question1}
              onChange={handleInputChange}
              placeholder="Enter employer name"
              className="form-input"
              required
            />
          </div>

          <div className="form-section">
            <label htmlFor="question2" className="form-label">
              {questions[1]} *
            </label>
            <input
              type="text"
              id="question2"
              name="question2"
              value={formData.question2}
              onChange={handleInputChange}
              placeholder="Enter interviewee name"
              className="form-input"
              required
            />
          </div>

          <div className="form-section">
            <label htmlFor="question3" className="form-label">
              {questions[2]} *
            </label>
            <input
              type="text"
              id="question3"
              name="question3"
              value={formData.question3}
              onChange={handleInputChange}
              placeholder="Enter email or phone number"
              className="form-input"
              required
            />
          </div>

          {/* Question 4: Yuva Parivartan Hiring */}
          <div className="form-section">
            <label className="form-label">
              Q4. Did you hire students from Yuva Parivartan? *
            </label>
            <div className="radio-group">
              <div className="radio-button yes-button">
                <input
                  type="radio"
                  id="hireYes"
                  name="hiredYuvaStudents"
                  value="yes"
                  checked={hiredYuvaStudents === 'yes'}
                  onChange={handleHiredYuvaStudentsChange}
                />
                <label htmlFor="hireYes">Yes</label>
              </div>
              <div className="radio-button no-button">
                <input
                  type="radio"
                  id="hireNo"
                  name="hiredYuvaStudents"
                  value="no"
                  checked={hiredYuvaStudents === 'no'}
                  onChange={handleHiredYuvaStudentsChange}
                />
                <label htmlFor="hireNo">No</label>
              </div>
            </div>
          </div>

          {/* Follow-up Questions Section */}
          {hiredYuvaStudents === 'yes' && (
            <>
              {extraQuestions[surveyType].map((question, index) => (
                <div className="form-section" key={`customQuestion_${index}`}>
                  <label htmlFor={`customQuestion_${index}`} className="form-label">
                    {question} *
                  </label>
                  <textarea
                    id={`customQuestion_${index}`}
                    name={`customQuestion_${index}`}
                    value={formData[`customQuestion_${index}`] || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your answer here"
                    className="form-textarea"
                    required
                  />
                </div>
              ))}
            </>
          )}

          {hiredYuvaStudents === 'no' && (
            <>
              {extraQuestionsNo[surveyType].map((question, index) => (
                <div className="form-section" key={`customQuestionNo_${index}`}>
                  <label htmlFor={`customQuestionNo_${index}`} className="form-label">
                    {question} *
                  </label>
                  <textarea
                    id={`customQuestionNo_${index}`}
                    name={`customQuestionNo_${index}`}
                    value={formData[`customQuestionNo_${index}`] || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your answer here"
                    className="form-textarea"
                    required
                  />
                </div>
              ))}
            </>
          )}

          {/* Always-present questions for Employer (regardless of yes/no) */}
          {extraAlwaysQuestions[surveyType] && extraAlwaysQuestions[surveyType].length > 0 && (
            <>
              {extraAlwaysQuestions[surveyType].map((question, index) => (
                <div className="form-section" key={`alwaysQuestion_${index}`}>
                  <label htmlFor={`alwaysQuestion_${index}`} className="form-label">
                    {question} *
                  </label>
                  <textarea
                    id={`alwaysQuestion_${index}`}
                    name={`alwaysQuestion_${index}`}
                    value={formData[`alwaysQuestion_${index}`] || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your answer here"
                    className="form-textarea"
                    required
                  />
                </div>
              ))}
            </>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="exit-button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              Exit
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSurveyForm;
