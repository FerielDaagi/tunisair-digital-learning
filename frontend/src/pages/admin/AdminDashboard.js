import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLocation } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import ConfirmModal from '../../components/common/ConfirmModal';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { items: notifItems, addTutorRequestNotification, removeTutorRequestNotification } = useNotifications();
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
  const [confirmDeleteState, setConfirmDeleteState] = useState({ open: false, userId: null, userName: '' });
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(3);


  useEffect(() => {
    loadUsers();
  }, []);

  // Lire une notification passée depuis la sidebar et l'afficher en haut
  useEffect(() => {
    if (location?.state?.notif && location.state.notif.category === 'tutor_request') {
      const note = location.state.notif;
      setSuccess(note.message || note.title || 'Notification');
      // Nettoyer l'état d'historique pour éviter la réaffichage au back/forward
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Ancien effet de pulse de bannière supprimé

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
        // Mettre à jour le badge des demandes de tutorat dans la sidebar
        const count = (response.data.users || []).filter(u => u.role === 'apprenti' && u.tutorRequestStatus === 'pending').length;
        if (count > 0) addTutorRequestNotification(count); else removeTutorRequestNotification();
      } else {
        console.warn('Réponse invalide:', response);
        setError('Format de réponse invalide du serveur');
      }
    } catch (err) {
      console.error('Erreur loadUsers:', err);
      console.error("Détails de l'erreur:", {
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

  // Fonctions de pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  
  // Filtrer et paginer les utilisateurs
  const getFilteredUsers = () => {
    let filtered = users.filter(userItem => {
      const matchesSearch = userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || userItem.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && userItem.isActive !== false) ||
                           (filterStatus === 'inactive' && userItem.isActive === false);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    return filtered;
  };
  
  // Ordonner: demandes de tutorat en attente épinglées en haut
  const sortedFilteredUsers = (() => {
    const list = getFilteredUsers();
    return [...list].sort((a, b) => {
      const ap = a.role === 'apprenti' && a.tutorRequestStatus === 'pending' ? 1 : 0;
      const bp = b.role === 'apprenti' && b.tutorRequestStatus === 'pending' ? 1 : 0;
      // Éléments avec ap=1 doivent venir AVANT → trier desc
      if (ap !== bp) return bp - ap;
      // Sinon trier par date de création desc
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
  })();
  const currentUsers = sortedFilteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(getFilteredUsers().length / usersPerPage);

  // Demandes de tutorat en attente
  const pendingTutorRequests = users.filter(
    (u) => u.role === 'apprenti' && u.tutorRequestStatus === 'pending'
  );

  // Notification de demandes de tutorat gérée globalement dans NotificationContext


  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userAPI.toggleUserStatus(userId, !currentStatus);
      setSuccess(`Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      loadUsers(); // Recharger la liste
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
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
      await loadUsers();
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
        setSuccess("Utilisateur rétrogradé au rôle d'apprenti");
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
      setTargetUserId(null);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Action échouée');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    setConfirmDeleteState({ open: true, userId, userName });
  };

  const confirmDeleteUser = async () => {
    const { userId } = confirmDeleteState;
    setConfirmDeleteState({ open: false, userId: null, userName: '' });
    try {
      await userAPI.deleteUser(userId);
      setSuccess('Utilisateur supprimé avec succès.');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'La suppression a échoué. Veuillez réessayer.');
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

        <ConfirmModal
          open={confirmDeleteState.open}
          title="Supprimer l’utilisateur"
          message={`Confirmez-vous la suppression de l’utilisateur « ${confirmDeleteState.userName} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          destructive
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDeleteState({ open: false, userId: null, userName: '' })}
        />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon name="user" size={IconSizes.md} color={IconColors.gray} />
                <h3 style={{ margin: 0, color: '#495057' }}>
                  Gestion des Utilisateurs ({getFilteredUsers().length})
                </h3>
              </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Icon name="loading" size={IconSizes.xl} color={IconColors.gray} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Icon name="search" size={IconSizes.xl} color={IconColors.light} />
              <p style={{ color: '#6c757d' }}>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'center' }}>Rôle</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                    <th style={{ textAlign: 'center' }}>Date d'inscription</th>
                    <th style={{ textAlign: 'center' }}>Demande Tuteur</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((userItem) => (
                    <tr key={userItem._id} className={userItem._id === user._id ? 'current-user' : ''}>
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
                                <span className="current-user-badge">
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
                      
                      <td style={{ textAlign: 'center' }}>
                        <span className={`role-badge ${userItem.role}`}>
                          {userItem.role === 'admin' ? 'Admin' :
                           userItem.role === 'tuteur' ? 'Tuteur' : 'Apprenti'}
                        </span>
                      </td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${userItem.isActive === false ? 'inactive' : 'active'}`}>
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
                                    `Confirmez-vous l'approbation de la demande de ${userItem.name} ?`
                                  )}
                                  className="admin-action-btn approve-btn"
                                  title={'Approuver la demande'}
                                  disabled={userItem._id === user._id}
                                >
                                  <Icon name="success" size={IconSizes.xs} color={IconColors.white} />
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(userItem._id)}
                                  className="admin-action-btn reject-btn"
                                  title={'Rejeter la demande'}
                                  disabled={userItem._id === user._id}
                                >
                                  <Icon name="error" size={IconSizes.xs} color={IconColors.white} />
                                </button>
                                {(userItem.tutorRequestMessage || userItem.tutorRequestAt) && (
                                  <button
                                    onClick={() => setExpandedRequestMessageId(
                                      expandedRequestMessageId === userItem._id ? null : userItem._id
                                    )}
                                    className="admin-action-btn info-btn"
                                    title={'Voir détails'}
                                  >
                                    <Icon name="info" size={IconSizes.xs} color={IconColors.white} />
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
                                className="admin-action-btn promote-btn"
                                title={'Promouvoir en tuteur'}
                                disabled={userItem._id === user._id}
                              >
                                <Icon name="graduation" size={IconSizes.xs} color={IconColors.white} />
                              </button>
                            )}

                            {/* Si demande existe mais non pending (approved/rejected): seulement détails */}
                            {(userItem.tutorRequestStatus === 'approved' || userItem.tutorRequestStatus === 'rejected') && (
                              (userItem.tutorRequestMessage || userItem.tutorRequestAt) ? (
                                <button
                                  onClick={() => setExpandedRequestMessageId(
                                    expandedRequestMessageId === userItem._id ? null : userItem._id
                                  )}
                                  className="admin-action-btn info-btn"
                                  title={'Voir détails'}
                                >
                                  <Icon name="info" size={IconSizes.xs} color={IconColors.white} />
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
                                "Rétrograder au rôle d'apprenti",
                                `Confirmez-vous la rétrogradation de ${userItem.name} au rôle d'apprenti ?`
                              )}
                              className="admin-action-btn demote-btn"
                              title="Rétrograder à apprenti"
                              disabled={userItem._id === user._id}
                            >
                              <Icon name="user" size={IconSizes.xs} color={IconColors.white} />
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
                              className={`admin-action-btn ${userItem.isActive === false ? 'activate-btn' : 'deactivate-btn'}`}
                              title={userItem.isActive === false ? 'Activer' : 'Désactiver'}
                            >
                              {userItem.isActive === false ? (
                                <Icon name="unlock" size={IconSizes.xs} color={IconColors.white} />
                              ) : (
                                <Icon name="lock" size={IconSizes.xs} color={IconColors.white} />
                              )}
                            </button>
                          )}
                          
                          {/* Delete User */}
                          {userItem._id !== user._id && (
                            <button
                              onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                              className="admin-action-btn delete-btn"
                              title="Supprimer"
                            >
                              <Icon name="delete" size={IconSizes.xs} color={IconColors.white} />
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
          
          {/* Pagination */}
          {getFilteredUsers().length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-body">
                <div className="pagination-container">
                  {/* Informations de pagination */}
                  <div className="pagination-info">
                    Affichage de {indexOfFirstUser + 1} à {Math.min(indexOfLastUser, getFilteredUsers().length)} sur {getFilteredUsers().length} utilisateurs
                    {totalPages === 1 && ' (1 page)'}
                  </div>
                  
                  {/* Contrôles de pagination - masqués si une seule page */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      {/* Bouton première page */}
                      <button
                        onClick={handleFirstPage}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                        title="Première page"
                      >
                        <Icon name="chevronLeft" size={IconSizes.xs} />
                        <Icon name="chevronLeft" size={IconSizes.xs} style={{ marginLeft: '-8px' }} />
                      </button>
                      
                      {/* Bouton page précédente */}
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                        title="Page précédente"
                      >
                        <Icon name="chevronLeft" size={IconSizes.xs} />
                      </button>
                      
                      {/* Numéros de pages */}
                      <div className="pagination-page-numbers">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Bouton page suivante */}
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                        title="Page suivante"
                      >
                        <Icon name="chevronRight" size={IconSizes.xs} />
                      </button>
                      
                      {/* Bouton dernière page */}
                      <button
                        onClick={handleLastPage}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                        title="Dernière page"
                      >
                        <Icon name="chevronRight" size={IconSizes.xs} />
                        <Icon name="chevronRight" size={IconSizes.xs} style={{ marginLeft: '-8px' }} />
                      </button>
                    </div>
                  )}
                  
                  {/* Sélecteur d'utilisateurs par page - toujours visible */}
                  <div className="pagination-selector">
                    <span>Afficher :</span>
                    <select
                      value={usersPerPage}
                      onChange={(e) => {
                        setUsersPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span>par page</span>
                  </div>
                </div>
              </div>
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
              background: 'white', padding: '1.25rem', borderRadius: '12px', width: '90%', maxWidth: '520px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</div>
                <h3 style={{ margin: 0, color: 'var(--danger)', fontSize: '1.1rem' }}>Rejeter la demande de tutorat</h3>
              </div>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Motif du rejet (optionnel)</p>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.95rem' }}
                placeholder="Ex.: Profil incomplet, expérience insuffisante, etc."
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
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
