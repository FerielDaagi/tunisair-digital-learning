import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '520px'
};

const titleStyle = { marginTop: 0, color: 'var(--text-primary)' };
const messageStyle = { color: '#6c757d', marginTop: '0.5rem' };
const actionsStyle = { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' };

const ConfirmModal = ({
  open,
  title = 'Confirmer l’action',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title" style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <button onClick={onCancel} className="btn btn-outline">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{ backgroundColor: destructive ? 'var(--danger)' : 'var(--primary)', color: 'white' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


