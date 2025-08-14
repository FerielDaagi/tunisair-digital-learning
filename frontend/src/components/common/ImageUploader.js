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
      >
        {!currentImage ? (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">{placeholder}</div>
            <div className="upload-hint">Glissez-déposez une image ici ou cliquez pour sélectionner</div>
            <div className="upload-info">
              Types acceptés : {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}<br/>
              Taille maximum : {maxSize}MB
            </div>
          </div>
        ) : (
          <div className="image-preview">
            {typeof currentImage === 'string' ? (
              <img 
                src={currentImage} 
                alt="Aperçu" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img 
                src={URL.createObjectURL(currentImage)} 
                alt="Aperçu" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            
            <div className="image-overlay">
              <div className="overlay-content">
                <div className="overlay-icon">📷</div>
                <div className="overlay-text">Cliquer pour changer</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {currentImage && (
        <button
          type="button"
          onClick={removeImage}
          className="remove-image-btn"
        >
          🗑️ Supprimer l'image
        </button>
      )}
    </div>
  );
};

export default ImageUploader;

