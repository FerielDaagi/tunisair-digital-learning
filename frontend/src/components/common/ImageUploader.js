import React, { useState, useRef } from 'react';

const ImageUploader = ({ 
  onImageSelect, 
  currentImage, 
  placeholder = "Cliquez pour sélectionner une image",
  maxSize = 5, // MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  className = "",
  style = {}
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Vérifier le type de fichier
    if (!acceptedTypes.includes(file.type)) {
      setError(`Type de fichier non supporté. Types acceptés : ${acceptedTypes.join(', ')}`);
      return false;
    }

    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux. Taille maximum : ${maxSize}MB`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      onImageSelect(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageSelect(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-uploader ${className}`} style={style}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${currentImage ? 'has-image' : ''}`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '3px dashed var(--primary-blue)' : '3px dashed var(--gray-300)',
          backgroundColor: dragActive ? 'rgba(79, 70, 229, 0.05)' : 'var(--gray-50)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {currentImage ? (
          <div className="image-preview">
            <img
              src={typeof currentImage === 'string' ? currentImage : URL.createObjectURL(currentImage)}
              alt="Aperçu"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '12px'
              }}
            />
            <div className="image-overlay">
              <div className="overlay-content">
                <div className="overlay-icon">📷</div>
                <div className="overlay-text">Cliquez pour changer</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <div className="upload-text">{placeholder}</div>
            <div className="upload-hint">
              Glissez-déposez une image ici ou cliquez pour sélectionner
            </div>
            <div className="upload-info">
              Types acceptés : {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
              <br />
              Taille max : {maxSize}MB
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error" style={{
          color: 'var(--danger)',
          fontSize: '0.9rem',
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          ⚠️ {error}
        </div>
      )}

      {currentImage && (
        <button
          type="button"
          onClick={removeImage}
          className="remove-image-btn"
          style={{
            background: 'var(--danger)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            marginTop: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          🗑️ Supprimer l'image
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
