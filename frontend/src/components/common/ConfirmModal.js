import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const baseModalStyle = {
  background: 'white',
  padding: '1.25rem 1.25rem 1rem',
  borderRadius: '14px',
  width: '100%',
  maxWidth: '560px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  maxHeight: '85vh',
  overflowY: 'auto'
};

const titleBase = { margin: 0, fontWeight: 700, fontSize: '1.1rem' };
const messageBase = { color: '#5b6470', marginTop: '0.6rem', lineHeight: 1.5 };
const actionsStyle = { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.1rem' };

const ConfirmModal = ({
  open,
  title = 'Confirmer l’action',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  variant = 'default', // 'default' | 'warning'
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  const isWarning = variant === 'warning';
  const modalStyle = {
    ...baseModalStyle,
    border: isWarning ? '1px solid #F6C08E' : '1px solid #e5e7eb'
  };
  const titleStyle = {
    ...titleBase,
    color: isWarning ? '#B45309' : 'var(--text-primary, #111827)'
  };
  const messageStyle = {
    ...messageBase
  };

  const renderMessage = () => {
    if (typeof message === 'string') {
      return message.split('\n').map((line, idx) => (
        <span key={idx}>
          {line}
          {idx < message.split('\n').length - 1 ? <br /> : null}
        </span>
      ));
    }
    return message;
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        {isWarning && (
          <div style={{
            background: '#FEF3C7',
            color: '#92400E',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontWeight: 600 }}>Attention</span>
          </div>
        )}
        <h3 id="confirm-title" style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{renderMessage()}</p>
        <div style={actionsStyle}>
          <button onClick={onCancel} className="btn btn-outline">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{ backgroundColor: destructive ? 'var(--danger, #dc2626)' : (isWarning ? '#f59e0b' : 'var(--primary, #6366f1)'), color: 'white' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


