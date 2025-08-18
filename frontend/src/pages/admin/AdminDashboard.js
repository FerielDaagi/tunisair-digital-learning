import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  // UI state for professional confirmations and inputs
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'demote'
  const [targetUserId, setTargetUserId] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [expandedRequestMessageId, setExpandedRequestMessageId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Tentative de chargement des utilisateurs...');
      
      const response = await userAPI.getAllUsers();
      console.log('Réponse getAllUsers:', response);
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        console.log('Utilisateurs chargés:', response.data.users.length);
      } else {
        console.warn('Réponse invalide:', response);
        setError('Format de réponse invalide du serveur');
      }
    } catch (err) {
      console.error('Erreur loadUsers:', err);
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Erreur lors du chargement des utilisateurs';
      
      if (err.response?.status === 403) {
        errorMessage = 'Accès refusé. Rôle administrateur requis.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userAPI.toggleUserStatus(userId, !currentStatus);
      setSuccess(`Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      loadUsers(); // Recharger la liste
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
    }
  };

  const handlePromoteToTutor = async (userId) => {
    try {
      await userAPI.promoteToTutor(userId);
      setSuccess('Utilisateur promu tuteur avec succès');
      loadUsers(); // Recharger la liste
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la promotion');
    }
  };

  const handleOpenRejectModal = (userId) => {
    setRejectUserId(userId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleSubmitReject = async () => {
    if (!rejectUserId) return;
    try {
      await userAPI.rejectTutorRequest(rejectUserId, rejectReason);
      setSuccess('Demande de tuteur rejetée');
      setShowRejectModal(false);
      setRejectUserId(null);
      setRejectReason('');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const handleOpenConfirm = (action, userId, title, message) => {
    setConfirmAction(action);
    setTargetUserId(userId);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !targetUserId) return;
    try {
      if (confirmAction === 'approve') {
        await userAPI.promoteToTutor(targetUserId);
        setSuccess('Utilisateur promu tuteur avec succès');
      } else if (confirmAction === 'demote') {
        await userAPI.demoteToApprentice(targetUserId);
        setSuccess('Utilisateur rétrogradé au rôle d\'apprenti');
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
      setTargetUserId(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Action échouée');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`)) {
      try {
        await userAPI.deleteUser(userId);
        setSuccess('Utilisateur supprimé avec succès');
        loadUsers(); // Recharger la liste
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive !== false) ||
                         (filterStatus === 'inactive' && user.isActive === false);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: users.length,
    apprentices: users.filter(u => u.role === 'apprenti').length,
    tutors: users.filter(u => u.role === 'tuteur').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive !== false).length,
    inactive: users.filter(u => u.isActive === false).length,
  };

  if (user?.role !== 'admin') {
    return (
      <div className="main-content">
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
          <div className="card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
              <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Accès refusé</h2>
              <p style={{ color: '#6c757d' }}>
                Vous devez être administrateur pour accéder à cette page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '2rem' }}>
        {/* En-tête */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Dashboard Administrateur</h2>
            <p style={{ color: '#6c757d', margin: 0 }}>
              Gestion des utilisateurs et de la plateforme
            </p>
          </div>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #c3e6cb'
          }}>
            {success}
          </div>
        )}

        {/* Statistiques */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Total Utilisateurs</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🎓</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.apprentices}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Apprentis</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🏫</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.tutors}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Tuteurs</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👑</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.admins}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Administrateurs</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Comptes Actifs</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{stats.inactive}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Comptes Inactifs</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#495057' }}>Filtres</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rôle
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">Tous les rôles</option>
                  <option value="apprenti">Apprentis</option>
                  <option value="tuteur">Tuteurs</option>
                  <option value="admin">Administrateurs</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, color: '#495057' }}>
              Gestion des Utilisateurs ({filteredUsers.length})
            </h3>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#6c757d' }}>🔍</div>
              <p style={{ color: '#6c757d' }}>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Utilisateur</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Rôle</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Date d'inscription</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Demande Tuteur</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem._id} style={{ 
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: userItem._id === user._id ? '#f8f9fa' : 'white'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {userItem.profile?.avatar ? (
                            <img 
                              src={userItem.profile.avatar.startsWith('http') 
                                ? userItem.profile.avatar 
                                : `http://localhost:5000${userItem.profile.avatar}`}
                              alt="Avatar"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#e9ecef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem'
                            }}>
                              U
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '500', color: '#495057' }}>
                              {userItem.name}
                              {userItem._id === user._id && (
                                <span style={{ 
                                  marginLeft: '0.5rem',
                                  backgroundColor: 'var(--primary-blue)',
                                  color: 'white',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem'
                                }}>
                                  Vous
                                </span>
                              )}
                            </div>
                            {userItem.profile?.bio && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: '#6c757d',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {userItem.profile.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem', color: '#495057' }}>
                        {userItem.email}
                      </td>
                      
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: 
                            userItem.role === 'admin' ? 'var(--danger)' :
                            userItem.role === 'tuteur' ? 'var(--success)' : 'var(--primary-blue)',
                          color: 'white'
                        }}>
                          {userItem.role === 'admin' ? 'Admin' :
                           userItem.role === 'tuteur' ? 'Tuteur' : 'Apprenti'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: userItem.isActive === false ? 'var(--danger)' : 'var(--success)',
                          color: 'white'
                        }}>
                          {userItem.isActive === false ? 'Inactif' : 'Actif'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                        {new Date(userItem.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {/* Cas ADMIN (ligne) -> ne rien afficher */}
                        {userItem.role === 'admin' && (
                          <div />
                        )}

                        {/* Cas APPRENTI */}
                        {userItem.role === 'apprenti' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            {/* S'il y a une demande en attente: X / ✓ / détails */}
                            {userItem.tutorRequestStatus === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleOpenConfirm(
                                    'approve',
                                    userItem._id,
                                    'Approuver la demande de tutorat',
                                    `Confirmez-vous l\'approbation de la demande de ${userItem.name} ?`
                                  )}
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--success)',
                                    color: 'white'
                                  }}
                                  title={'Approuver la demande'}
                                  disabled={userItem._id === user._id}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(userItem._id)}
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--danger)',
                                    color: 'white'
                                  }}
                                  title={'Rejeter la demande'}
                                  disabled={userItem._id === user._id}
                                >
                                  ✕
                                </button>
                                {(userItem.tutorRequestMessage || userItem.tutorRequestAt) && (
                                  <button
                                    onClick={() => setExpandedRequestMessageId(
                                      expandedRequestMessageId === userItem._id ? null : userItem._id
                                    )}
                                    style={{
                                      padding: '0.4rem 0.6rem',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      backgroundColor: 'var(--primary-blue)',
                                      color: 'white'
                                    }}
                                    title={'Voir détails'}
                                  >
                                    ℹ️
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Si aucune demande: icône d'upgrade */}
                            {(!userItem.tutorRequestStatus || userItem.tutorRequestStatus === 'none') && (
                              <button
                                onClick={() => handleOpenConfirm(
                                  'approve',
                                  userItem._id,
                                  'Promouvoir en tuteur',
                                  `Promouvoir ${userItem.name} au rôle de tuteur ?`
                                )}
                                style={{
                                  padding: '0.4rem 0.6rem',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  backgroundColor: 'var(--success)',
                                  color: 'white'
                                }}
                                title={'Promouvoir en tuteur'}
                                disabled={userItem._id === user._id}
                              >
                                ⬆️
                              </button>
                            )}

                            {/* Si demande existe mais non pending (approved/rejected): seulement détails */}
                            {(userItem.tutorRequestStatus === 'approved' || userItem.tutorRequestStatus === 'rejected') && (
                              (userItem.tutorRequestMessage || userItem.tutorRequestAt) ? (
                                <button
                                  onClick={() => setExpandedRequestMessageId(
                                    expandedRequestMessageId === userItem._id ? null : userItem._id
                                  )}
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--primary-blue)',
                                    color: 'white'
                                  }}
                                  title={'Voir détails'}
                                >
                                  ℹ️
                                </button>
                              ) : <div />
                            )}

                            {expandedRequestMessageId === userItem._id && (
                              <div style={{
                                marginTop: '0.5rem',
                                textAlign: 'left',
                                backgroundColor: '#f8f9fa',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #e9ecef',
                                maxWidth: '360px'
                              }}>
                                {userItem.tutorRequestAt && (
                                  <div style={{ color: '#6c757d', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                    Demande du {new Date(userItem.tutorRequestAt).toLocaleString('fr-FR')}
                                  </div>
                                )}
                                {userItem.tutorRequestMessage ? (
                                  <div style={{ color: '#495057', fontSize: '0.9rem' }}>
                                    {userItem.tutorRequestMessage}
                                  </div>
                                ) : (
                                  <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>Aucun message joint.</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cas TUTEUR */}
                        {userItem.role === 'tuteur' && (
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenConfirm(
                                'demote',
                                userItem._id,
                                'Rétrograder au rôle d\'apprenti',
                                `Confirmez-vous la rétrogradation de ${userItem.name} au rôle d\'apprenti ?`
                              )}
                              style={{
                                padding: '0.4rem 0.6rem',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: 'var(--warning)',
                                color: 'white'
                              }}
                              title="Rétrograder à apprenti"
                              disabled={userItem._id === user._id}
                            >
                              ⇩
                            </button>
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {/* Toggle Status */}
                          {userItem._id !== user._id && (
                            <button
                              onClick={() => handleToggleStatus(userItem._id, userItem.isActive === false)}
                              style={{
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: userItem.isActive === false ? 'var(--success)' : 'var(--warning)',
                                color: 'white'
                              }}
                              title={userItem.isActive === false ? 'Activer' : 'Désactiver'}
                            >
                              {userItem.isActive === false ? 'A' : 'D'}
                            </button>
                          )}
                          
                          {/* Tutor actions déplacées dans la colonne Demande Tuteur */}
                          
                          {/* Delete User */}
                          {userItem._id !== user._id && (
                            <button
                              onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                              style={{
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: 'var(--danger)',
                                color: 'white'
                              }}
                              title="Supprimer"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Rejeter demande */}
        {showRejectModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '520px'
            }}>
              <h3 style={{ marginTop: 0, color: 'var(--danger)' }}>Rejeter la demande de tutorat</h3>
              <p style={{ color: '#6c757d' }}>Vous pouvez indiquer une raison (optionnelle) :</p>
              <textarea
                rows="4"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                placeholder="Raison du refus (optionnel)"
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectUserId(null); setRejectReason(''); }}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReject}
                  className="btn"
                  style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmation générique (approuver / rétrograder) */}
        {showConfirmModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '520px' }}>
              <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{confirmTitle}</h3>
              <p style={{ color: '#6c757d' }}>{confirmMessage}</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowConfirmModal(false); setConfirmAction(null); setTargetUserId(null); }}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="btn btn-primary"
                  style={{ backgroundColor: confirmAction === 'demote' ? 'var(--warning)' : 'var(--success)', color: 'white' }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
