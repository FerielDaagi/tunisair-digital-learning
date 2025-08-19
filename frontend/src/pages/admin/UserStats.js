import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import axios from 'axios';

const UserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roleDistribution: {
      admin: 0,
      tuteur: 0,
      apprenti: 0
    },
    monthlyRegistrations: [],
    userActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculer les pourcentages pour le diagramme circulaire
  const calculatePercentages = () => {
    const total = stats.totalUsers || 1;
    return {
      admin: (stats.roleDistribution.admin / total) * 100,
      tuteur: (stats.roleDistribution.tuteur / total) * 100,
      apprenti: (stats.roleDistribution.apprenti / total) * 100
    };
  };

  // Créer un graphique en courbe dynamique
  const renderLineChart = () => {
    if (!stats.monthlyRegistrations.length) return null;

    const maxCount = Math.max(...stats.monthlyRegistrations.map(m => m.count));
    const chartHeight = 200;
    const chartWidth = stats.monthlyRegistrations.length * 80;

    return (
      <div style={{ 
        position: 'relative', 
        height: chartHeight, 
        width: '100%',
        overflowX: 'auto'
      }}>
        <svg width={chartWidth} height={chartHeight} style={{ minWidth: '100%' }}>
          {/* Grille de fond */}
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={`grid-${i}`}
              x1="0"
              y1={(i * chartHeight) / 4}
              x2={chartWidth}
              y2={(i * chartHeight) / 4}
              stroke="#e9ecef"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}
          
          {/* Ligne de courbe */}
          <path
            d={stats.monthlyRegistrations.map((month, index) => {
              const x = index * 80 + 40;
              const y = chartHeight - ((month.count / maxCount) * chartHeight);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--primary-blue)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points sur la courbe */}
          {stats.monthlyRegistrations.map((month, index) => {
            const x = index * 80 + 40;
            const y = chartHeight - ((month.count / maxCount) * chartHeight);
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="var(--primary-blue)"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--primary-blue)"
                  fontWeight="bold"
                >
                  {month.count}
                </text>
              </g>
            );
          })}
          
          {/* Labels des mois */}
          {stats.monthlyRegistrations.map((month, index) => (
            <text
              key={`label-${index}`}
              x={index * 80 + 40}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#6c757d"
            >
              {month.month}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  // Créer un diagramme circulaire dynamique
  const renderPieChart = () => {
    const percentages = calculatePercentages();
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    let currentAngle = 0;
    const colors = ['var(--danger)', 'var(--success)', 'var(--primary-blue)'];
    const roles = ['admin', 'tuteur', 'apprenti'];
    
    return (
      <svg width="200" height="200" style={{ margin: '0 auto' }}>
        {roles.map((role, index) => {
          const percentage = percentages[role];
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          // Calculer les coordonnées de l'arc
          const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
          const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
          
          // Déterminer si l'arc est grand (plus de 180 degrés)
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <g key={role}>
              <path
                d={pathData}
                fill={colors[index]}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              {/* Légende */}
              <text
                x={centerX + (radius + 20) * Math.cos((startAngle + angle/2 - 90) * Math.PI / 180)}
                y={centerY + (radius + 20) * Math.sin((startAngle + angle/2 - 90) * Math.PI / 180)}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
              >
                {Math.round(percentage)}%
              </text>
            </g>
          );
        })}
        
        {/* Centre du diagramme */}
        <circle
          cx={centerX}
          cy={centerY}
          r="20"
          fill="white"
          stroke="#e9ecef"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY + 4}
          textAnchor="middle"
          fontSize="12"
          fill="#495057"
          fontWeight="bold"
        >
          {stats.totalUsers}
        </text>
      </svg>
    );
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/user-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Erreur statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="main-content">
        <div className="container">
          <div className="card">
            <div className="card-header">
              <h2>Accès refusé</h2>
            </div>
            <div className="card-body">
              <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="card">
            <div className="card-body text-center">
              <Icon name="loading" size={IconSizes.xl} className="spin" />
              <p>Chargement des statistiques...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="card">
            <div className="card-body text-center">
              <Icon name="error" size={IconSizes.xl} color={IconColors.danger} />
              <p className="text-danger">{error}</p>
              <button onClick={fetchUserStats} className="btn">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        {/* En-tête */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon name="barChart" size={IconSizes.md} color={IconColors.primary} />
              <h3 style={{ margin: 0, color: '#495057' }}>
                Statistiques des Utilisateurs
              </h3>
            </div>
          </div>
        </div>

        {/* Métriques principales avec animations */}
        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
          <div className="stat-card" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <div className="stat-icon" style={{ background: 'var(--primary-blue)' }}>
              <Icon name="user" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="stat-content">
              <div className="stat-number" style={{ animation: 'countUp 1s ease-out' }}>
                {stats.totalUsers}
              </div>
              <div className="stat-label">Total Utilisateurs</div>
            </div>
          </div>

          <div className="stat-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <div className="stat-icon" style={{ background: 'var(--success)' }}>
              <Icon name="checkCircle" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="stat-content">
              <div className="stat-number" style={{ animation: 'countUp 1s ease-out 0.1s both' }}>
                {stats.activeUsers}
              </div>
              <div className="stat-label">Utilisateurs Actifs</div>
            </div>
          </div>

          <div className="stat-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            <div className="stat-icon" style={{ background: 'var(--warning)' }}>
              <Icon name="pause" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="stat-content">
              <div className="stat-number" style={{ animation: 'countUp 1s ease-out 0.2s both' }}>
                {stats.inactiveUsers}
              </div>
              <div className="stat-label">Utilisateurs Inactifs</div>
            </div>
          </div>

          <div className="stat-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            <div className="stat-icon" style={{ background: 'var(--info)' }}>
              <Icon name="graduation" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="stat-content">
              <div className="stat-number" style={{ animation: 'countUp 1s ease-out 0.3s both' }}>
                {stats.roleDistribution.tuteur}
              </div>
              <div className="stat-label">Tuteurs</div>
            </div>
          </div>
        </div>

        {/* Graphiques côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Diagramme circulaire */}
          <div className="card">
            <div className="card-header">
              <h4>Distribution des Rôles</h4>
            </div>
            <div className="card-body text-center">
              {renderPieChart()}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--danger)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.9rem' }}>Admin</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--success)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.9rem' }}>Tuteur</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--primary-blue)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.9rem' }}>Apprenti</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique en courbe */}
          <div className="card">
            <div className="card-header">
              <h4>Évolution des Inscriptions</h4>
            </div>
            <div className="card-body">
              {renderLineChart()}
            </div>
          </div>
        </div>

        {/* Graphique en barres pour les statistiques détaillées */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h4>Statistiques Détaillées</h4>
          </div>
          <div className="card-body">
            <div style={{ 
              display: 'flex', 
              alignItems: 'end', 
              gap: '2rem', 
              height: '250px',
              padding: '1rem 0',
              justifyContent: 'center'
            }}>
              {/* Barre Admin */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '60px',
                  height: `${(stats.roleDistribution.admin / Math.max(stats.totalUsers, 1)) * 200}px`,
                  backgroundColor: 'var(--danger)',
                  borderRadius: '8px 8px 0 0',
                  minHeight: '4px',
                  transition: 'height 1s ease-out',
                  boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  Admin
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {stats.roleDistribution.admin}
                </span>
              </div>

              {/* Barre Tuteur */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '60px',
                  height: `${(stats.roleDistribution.tuteur / Math.max(stats.totalUsers, 1)) * 200}px`,
                  backgroundColor: 'var(--success)',
                  borderRadius: '8px 8px 0 0',
                  minHeight: '4px',
                  transition: 'height 1s ease-out',
                  boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  Tuteur
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {stats.roleDistribution.tuteur}
                </span>
              </div>

              {/* Barre Apprenti */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '60px',
                  height: `${(stats.roleDistribution.apprenti / Math.max(stats.totalUsers, 1)) * 200}px`,
                  backgroundColor: 'var(--primary-blue)',
                  borderRadius: '8px 8px 0 0',
                  minHeight: '4px',
                  transition: 'height 1s ease-out',
                  boxShadow: '0 4px 8px rgba(79, 70, 229, 0.3)'
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                  Apprenti
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {stats.roleDistribution.apprenti}
                </span>
              </div>

              {/* Barre Total */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '200px',
                  backgroundColor: 'var(--gray-600)',
                  borderRadius: '8px 8px 0 0',
                  border: '2px solid var(--gray-400)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'linear-gradient(to top, var(--gray-400), transparent)',
                    borderRadius: '6px 6px 0 0'
                  }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gray-600)' }}>
                  Total
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {stats.totalUsers}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h4>Actions Rapides</h4>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.href = '/admin'}
                className="btn"
                style={{ backgroundColor: 'var(--primary-blue)', color: 'white' }}
              >
                <Icon name="admin" size={IconSizes.sm} color={IconColors.white} />
                Gérer les Utilisateurs
              </button>
              
              <button 
                onClick={fetchUserStats}
                className="btn btn-outline"
              >
                <Icon name="refresh" size={IconSizes.sm} />
                Actualiser les Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
