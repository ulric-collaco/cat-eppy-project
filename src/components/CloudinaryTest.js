import React, { useState } from 'react';
import { uploadImageToCloudinary } from '../cloudinary';

const CloudinaryTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleTestUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing Cloudinary upload...');
      const uploadResult = await uploadImageToCloudinary(selectedFile);
      setResult(uploadResult);
      console.log('Test upload successful:', uploadResult);
    } catch (error) {
      console.error('Test upload failed:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Cloudinary Upload Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ marginBottom: '10px' }}
        />
        <br />
        <button 
          onClick={handleTestUpload}
          disabled={!selectedFile || uploading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#667eea', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Test Upload'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee', 
          color: '#c33', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #fcc'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#efe', 
          color: '#363', 
          borderRadius: '5px',
          border: '1px solid #cfc'
        }}>
          <h3>Upload Successful!</h3>
          <p><strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a></p>
          <p><strong>Public ID:</strong> {result.publicId}</p>
          <p><strong>Dimensions:</strong> {result.width} x {result.height}</p>
          {result.url && (
            <div style={{ marginTop: '15px' }}>
              <img src={result.url} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>Debug Info:</h4>
        <p><strong>Selected File:</strong> {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)` : 'None'}</p>
        <p><strong>File Type:</strong> {selectedFile ? selectedFile.type : 'None'}</p>
        <p><strong>Cloudinary Config:</strong> Check browser console for detailed logs</p>
      </div>
    </div>
  );
};

export default CloudinaryTest;
