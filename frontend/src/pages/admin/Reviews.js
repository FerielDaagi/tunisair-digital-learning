import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Reviews.css';

const Reviews = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [pageSize, setPageSize] = useState(10);

  const deriveNameFromEmail = (email) => {
    if (!email || typeof email !== 'string') return '—';
    const local = email.split('@')[0] || '';
    if (!local) return email;
    return local
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  };

  const getStudentDisplayName = (student) => {
    if (!student) return '—';
    const email = student.email || '';
    if (student.name && student.name !== email) return student.name;
    return deriveNameFromEmail(email) || email || '—';
  };

  const getAvatarUrl = (student) => {
    const path = student?.profile?.avatar;
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return `http://localhost:5000${path}`;
    return `http://localhost:5000/${path}`;
  };

  const canAccess = user?.role === 'admin';

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, ...filters };
      const res = await adminAPI.getAllReviews(params);
      setReviews(res.data?.data?.reviews || []);
      setPagination(res.data?.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, pageSize });
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  useEffect(() => {
    if (canAccess) {
      load(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => load(1);
  const clearFilters = () => { setFilters({ sortBy: 'createdAt', sortOrder: 'desc' }); load(1); };

  if (!canAccess) return <div className="container" style={{ padding: '1rem' }}><div className="card" style={{ padding: '1rem' }}>Accès refusé.</div></div>;

  return (
    <div className="container" style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem' }}>
      <div className="admin-reviews">
      <div className="admin-reviews__header">
        <h2>Avis et Évaluations (Admin)</h2>
        <div className="admin-reviews__page-controls">
          <label>
            Par page
            {' '}
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>
      <div className="admin-reviews__filters card">
        <div className="card-body">
          <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
            <option value="createdAt">Date</option>
            <option value="helpfulVotes">Votes utiles</option>
            <option value="rating">Note</option>
          </select>
          <select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <div className="admin-reviews__actions">
            <button className="btn btn-primary" onClick={applyFilters}>Appliquer</button>
            <button className="btn" onClick={clearFilters}>Réinitialiser</button>
          </div>
        </div>
      </div>

      {loading && <div className="card admin-reviews__empty">Chargement...</div>}
      {error && <div className="card admin-reviews__empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {!loading && (
        <div className="admin-reviews__table card">
          <div className="card-body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cours</th>
                  <th>Étudiant</th>
                  <th>Note</th>
                  <th>Commentaire</th>
                  <th>Votes utiles</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-reviews__empty">Aucun avis trouvé avec ces filtres.</div>
                    </td>
                  </tr>
                )}
                {reviews.map((r) => {
                  const displayName = getStudentDisplayName(r.student);
                  const email = r.student?.email;
                  const showEmail = Boolean(email && email !== displayName);
                  return (
                  <tr key={r._id}>
                    <td className="admin-reviews__row-course">{r.course?.title}</td>
                    <td>
                      <div className="admin-reviews__row-student">
                        {getAvatarUrl(r.student) && (
                          <img className="admin-reviews__avatar" src={getAvatarUrl(r.student)} alt="avatar" />
                        )}
                        <div className="admin-reviews__row-student-text">
                          <span className="admin-reviews__row-student-name">{displayName}</span>
                          {showEmail && (
                            <span className="admin-reviews__row-student-email">{email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="rating-badge">⭐ {r.rating}</span>
                    </td>
                    <td>{r.comment || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="helpful-badge">👍 {r.helpfulVotes || 0}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                );})}
              </tbody>
            </table>
            <div className="admin-reviews__pagination">
              <div className="admin-reviews__page-info">Page {pagination.currentPage} / {pagination.totalPages} • {pagination.totalItems} avis</div>
              <div className="admin-reviews__page-controls">
                <button className="btn" disabled={pagination.currentPage <= 1} onClick={() => load(pagination.currentPage - 1)}>Précédent</button>
                <button className="btn" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => load(pagination.currentPage + 1)}>Suivant</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Reviews;


