import React, { useState } from 'react';
import { Icon, IconSizes, IconColors } from './IconTheme';

const FileViewer = ({ file, baseUrl = 'http://localhost:5000' }) => {
  const [isViewing, setIsViewing] = useState(false);

  const getFileIcon = (mimeType, filename) => {
    if (mimeType) {
      if (mimeType.startsWith('image/')) return '🖼️';
      if (mimeType.startsWith('video/')) return '🎥';
      if (mimeType.startsWith('audio/')) return '🎵';
      if (mimeType.includes('pdf')) return '📄';
      if (mimeType.includes('word')) return '📝';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
      if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    }
    
    // Fallback basé sur l'extension
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg': return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv': return '🎥';
      case 'mp3':
      case 'wav':
      case 'ogg': return '🎵';
      case 'zip':
      case 'rar':
      case '7z': return '📦';
      default: return '📁';
    }
  };

  const getFileUrl = () => {
    if (file.path) {
      return file.path.startsWith('http') ? file.path : `${baseUrl}${file.path}`;
    }
    if (file.filename) {
      return `${baseUrl}/uploads/lessons/attachments/${file.filename}`;
    }
    return null;
  };

  const canPreview = () => {
    if (!file.mimeType) return false;
    return file.mimeType.startsWith('image/') || 
           file.mimeType.startsWith('video/') || 
           file.mimeType.includes('pdf');
  };

  const handleClick = () => {
    if (canPreview()) {
      setIsViewing(true);
    } else {
      // Télécharger le fichier
      const url = getFileUrl();
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const closeViewer = () => {
    setIsViewing(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileUrl = getFileUrl();
  const fileName = file.originalName || file.filename || 'Fichier';
  const fileSize = file.size ? formatFileSize(file.size) : '';

  return (
    <>
      <div 
        className="file-item"
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: '#fff',
          marginBottom: '0.5rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.backgroundColor = '#f8f9ff';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#e9ecef';
          e.target.style.backgroundColor = '#fff';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <div style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>
          {getFileIcon(file.mimeType, fileName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: '500', 
            color: '#495057',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {fileName}
          </div>
          {fileSize && (
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#6c757d',
              marginTop: '0.25rem'
            }}>
              {fileSize}
            </div>
          )}
        </div>
        <div style={{ 
          fontSize: '0.85rem', 
          color: '#6c757d',
          marginLeft: '0.5rem'
        }}>
          {canPreview() ? '👁️ Voir' : '⬇️ Télécharger'}
        </div>
      </div>

      {/* Modal de visualisation */}
      {isViewing && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closeViewer}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderBottom: '1px solid #e9ecef',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
                  {getFileIcon(file.mimeType, fileName)}
                </span>
                <span style={{ fontWeight: '500', color: '#495057' }}>
                  {fileName}
                </span>
              </div>
              <button
                onClick={closeViewer}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9ecef';
                  e.target.style.color = '#495057';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '1rem',
              maxHeight: 'calc(90vh - 80px)',
              overflow: 'auto'
            }}>
              {file.mimeType && file.mimeType.startsWith('image/') && (
                <img 
                  src={fileUrl} 
                  alt={fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              )}
              
              {file.mimeType && file.mimeType.startsWith('video/') && (
                <video 
                  src={fileUrl} 
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                    margin: '0 auto'
                  }}
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              )}
              
              {file.mimeType && file.mimeType.includes('pdf') && (
                <iframe 
                  src={fileUrl}
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title={fileName}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e9ecef',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                {fileSize && `Taille: ${fileSize}`}
              </div>
              <button
                onClick={() => window.open(fileUrl, '_blank')}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                Ouvrir dans un nouvel onglet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;

