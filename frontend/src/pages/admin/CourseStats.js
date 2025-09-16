import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, emoji, children }) => (
  <div className="card" style={{ textAlign: 'center', padding: '1rem 1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '1.5rem' }}>{emoji}</div>
      <div style={{ fontWeight: 600, fontSize: '1.25rem', color: '#495057' }}>{value}</div>
    </div>
    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>{title}</p>
    {children && <div style={{ marginTop: '0.5rem' }}>{children}</div>}
  </div>
);

const DonutChart = ({ value, total, size = 120, stroke = 14, colors = ['var(--primary-blue)', '#e9ecef'] }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const dash = ratio * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={colors[1]} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={colors[0]} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" />
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontWeight: 700, fill: '#495057' }}>{Math.round(ratio * 100)}%</text>
    </svg>
  );
};

const StarsGauge = ({ value = 0, max = 5 }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = max - full - (half ? 1 : 0);
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => <span key={`f-${i}`}>⭐</span>)}
      {half && <span>✩</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e-${i}`}>☆</span>)}
    </div>
  );
};

const BarChart = ({ data, xKey, yKey, height = 140, color = 'var(--primary-blue)' }) => {
  const maxVal = useMemo(() => Math.max(1, ...data.map(d => d[yKey] || 0)), [data, yKey]);
  const barWidth = 40;
  const gap = 18;
  const width = data.length * (barWidth + gap) + gap;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const val = d[yKey] || 0;
        const h = Math.max(4, (val / maxVal) * (height - 30));
        const x = gap + i * (barWidth + gap);
        const y = height - h - 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} fill={color} rx={6} />
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" style={{ fontSize: 10, fill: '#6c757d' }}>
              {(d[xKey] || '').toString().slice(0, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const StatistiqueCours = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getCourseStats();
        setData(res.data?.data || null);
      } catch (e) {
        setError(e.response?.data?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') load();
  }, [user]);

  if (user?.role !== 'admin') {
    return <div className="container"><div className="card" style={{ padding: '1rem' }}>Accès refusé.</div></div>;
  }

  const published = data?.totals?.publishedCourses || 0;
  const totalCourses = data?.totals?.totalCourses || 0;

  return (
    <div className="container" style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Statistiques des Cours (Plateforme)</h2>
      {loading && <div className="card" style={{ padding: '1rem' }}>Chargement...</div>}
      {error && <div className="card" style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard title="Cours totaux" value={data.totals.totalCourses} emoji="📚" />
            <StatCard title="Cours publiés" value={data.totals.publishedCourses} emoji="✅">
              <DonutChart value={published} total={totalCourses} />
            </StatCard>
            <StatCard title="Inscriptions" value={data.totals.totalEnrollments} emoji="🧑‍🎓" />
            <StatCard title="Formations complétées" value={data.totals.completedEnrollments} emoji="🏁" />
            <StatCard title="Avis" value={data.totals.totalReviews} emoji="💬" />
            <StatCard title="Note moyenne" value={data.totals.averageRating} emoji="⭐">
              <StarsGauge value={data.totals.averageRating} />
            </StatCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-header"><h4>Top cours par inscriptions</h4></div>
              <div className="card-body" style={{ overflowX: 'auto' }}>
                <BarChart data={data.topCoursesByEnrollments.map(c => ({ name: c.title, value: c.enrollments }))} xKey="name" yKey="value" />
                <div style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Cours</th>
                        <th style={{ textAlign: 'left' }}>Tuteur</th>
                        <th>Publié</th>
                        <th>Inscriptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCoursesByEnrollments.map((c) => (
                        <tr key={c.id}>
                          <td>{c.title}</td>
                          <td>{c.instructor?.name || `${c.instructor?.firstName || ''} ${c.instructor?.lastName || ''}`.trim()}</td>
                          <td style={{ textAlign: 'center' }}>{c.isPublished ? 'Oui' : 'Non'}</td>
                          <td style={{ textAlign: 'center' }}>{c.enrollments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h4>Top cours par note moyenne</h4></div>
              <div className="card-body" style={{ overflowX: 'auto' }}>
                <BarChart data={data.topCoursesByRating.map(c => ({ name: c.title, value: c.averageRating }))} xKey="name" yKey="value" color="#f59f00" />
                <div style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Cours</th>
                        <th style={{ textAlign: 'left' }}>Tuteur</th>
                        <th>Publié</th>
                        <th>Note</th>
                        <th>Avis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCoursesByRating.map((c) => (
                        <tr key={c.id}>
                          <td>{c.title}</td>
                          <td>{c.instructor?.name || `${c.instructor?.firstName || ''} ${c.instructor?.lastName || ''}`.trim()}</td>
                          <td style={{ textAlign: 'center' }}>{c.isPublished ? 'Oui' : 'Non'}</td>
                          <td style={{ textAlign: 'center' }}>{c.averageRating}</td>
                          <td style={{ textAlign: 'center' }}>{c.reviews}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><h4>Top tuteurs par cours publiés</h4></div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              {(!data.topTutorsByPublished || data.topTutorsByPublished.length === 0) && (
                <div>Aucun tuteur avec des cours publiés.</div>
              )}
              {data.topTutorsByPublished && data.topTutorsByPublished.length > 0 && (
                <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#495057' }}>Tuteur</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#495057' }}>Email</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#495057' }}>Cours publiés</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#495057' }}>Cours totaux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topTutorsByPublished.map((t, idx) => (
                      <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                        <td style={{ padding: '10px 12px' }}>{t.name}</td>
                        <td style={{ padding: '10px 12px' }}>{t.email}</td>
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(13, 110, 253, 0.08)', color: '#0d6efd', fontWeight: 600 }}>{t.publishedCourses}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(108, 117, 125, 0.12)', color: '#495057', fontWeight: 600 }}>{t.totalCourses}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h4>Derniers avis</h4></div>
            <div className="card-body">
              {data.recentReviews.length === 0 && <div>Aucun avis pour le moment.</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {data.recentReviews.map((r) => (
                  <div key={r._id} className="card" style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{r.student?.firstName} {r.student?.lastName}</strong>
                      <span>⭐ {r.rating}</span>
                    </div>
                    <div style={{ color: '#6c757d', marginTop: 2 }}>Nom cours: {r.course?.title || '-'}</div>
                    <div style={{ color: '#6c757d', marginTop: 2, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Dernier avis: {r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      {r.course?.publishedAt && (
                        <span style={{ padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6 }}>
                          Publié: {new Date(r.course.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {r.comment && <div style={{ marginTop: 6 }}>{r.comment}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatistiqueCours;


