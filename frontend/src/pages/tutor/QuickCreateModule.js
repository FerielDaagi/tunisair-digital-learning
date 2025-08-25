import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const QuickCreateModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }

    // Redirection immédiate vers le formulaire de création
    console.log('🚀 Redirection immédiate vers la création de module pour le cours:', courseId);
    navigate(`/tutor/create-module/${courseId}`, { replace: true });
  }, [user, navigate, courseId]);

  // Ce composant ne s'affiche jamais, il redirige immédiatement
  return null;
};

export default QuickCreateModule;

