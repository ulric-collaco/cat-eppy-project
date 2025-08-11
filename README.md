# Survey Platform

A React-based survey data collection platform with image upload capabilities using Cloudinary.

## Features

- **User Authentication**: Simple name-based login (Ulric, Jeremy, Asher)
- **Survey Creation**: Create surveys with three types: Staff, Employer, and Student
- **Image Upload**: Upload images using Cloudinary cloud storage
- **Survey Management**: View, manage, and delete submitted surveys
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Dark Theme**: Modern dark color scheme for better user experience

## Tech Stack

- **Frontend**: React 18 with React Router v6
- **Image Storage**: Cloudinary
- **Data Storage**: Local Storage (browser-based)
- **Styling**: CSS3 with mobile-first responsive design
- **State Management**: React Context API

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd survey-platform
npm install
```

### 2. Configure Cloudinary

1. **Create a Cloudinary Account**:
   - Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
   - Verify your email address

2. **Get Your Credentials**:
   - Log into your Cloudinary dashboard
   - Note your `Cloud Name` from the dashboard
   - Go to Settings → Upload → Upload presets
   - Create a new upload preset or use the default one

3. **Update Configuration**:
   - Open `src/cloudinary.js`
   - Replace the placeholder values with your actual credentials:
   ```javascript
   export const cloudinaryConfig = {
     cloudName: 'your-actual-cloud-name',
     uploadPreset: 'your-upload-preset-name',
     apiKey: 'your-api-key',
     apiSecret: 'your-api-secret'
   };
   ```

### 3. Run the Application

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Usage

### Login
- Choose your name from the three options: Ulric, Jeremy, or Asher
- No password required

### Create Surveys
1. Select a survey type (Staff, Employer, or Student)
2. Upload an image (max 5MB)
3. Answer three text-based questions
4. Submit the survey

### View Surveys
- Access your survey history from the dashboard
- View uploaded images and answers
- Delete surveys if needed

## Data Storage

Survey data is stored locally in the browser's localStorage. This means:
- Data persists between browser sessions
- Data is specific to each browser/device
- No external database required
- Perfect for development and testing

## File Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context for state management
├── pages/             # Main page components
├── services/          # Data and API services
├── cloudinary.js      # Cloudinary configuration
├── App.js             # Main application component
└── index.js           # Application entry point
```

## Customization

### Adding New Survey Types
1. Update the survey type options in `Dashboard.js`
2. Add corresponding logic in `NewSurveyForm.js`

### Modifying Questions
1. Edit the form fields in `NewSurveyForm.js`
2. Update the display logic in `Dashboard.js`

### Styling Changes
1. Modify CSS files in the respective component directories
2. Global styles are in `App.css` and `index.css`

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Image Upload Issues
- Ensure your Cloudinary credentials are correct
- Check that your upload preset allows unsigned uploads
- Verify image file size is under 5MB

### Data Not Persisting
- Check if localStorage is enabled in your browser
- Clear browser cache and try again
- Ensure you're using the same browser/device

### Performance Issues
- Clear browser cache and localStorage
- Check for large image files
- Ensure stable internet connection for image uploads

## Future Enhancements

- User registration and authentication
- Survey templates and customization
- Data export functionality
- Advanced image editing capabilities
- Multi-language support
- Offline functionality

## License

This project is open source and available under the MIT License.
