'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('most_used');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userSubscriptions, setUserSubscriptions] = useState<{[key: string]: boolean}>({});
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Vérification de la configuration Supabase
  useEffect(() => {
    console.log('Configuration Supabase:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Présent' : 'Manquant');
    console.log('Client Supabase:', supabase);

    // Récupérer la session actuelle
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Session actuelle:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user || null);
    };

    getSession();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Changement d\'état d\'auth:', event, session);
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Effet pour surveiller les changements de session
  useEffect(() => {
    console.log('🔍 Session changée:', { 
      hasSession: !!session, 
      userEmail: user?.email,
      userId: user?.id 
    });
  }, [session, user]);

      // Vérifier les sélections actives de l'utilisateur
  useEffect(() => {
    const checkUserSubscriptions = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('module_name, end_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('end_date', new Date().toISOString());
        
        if (!error && data) {
          const subscriptions: {[key: string]: boolean} = {};
          data.forEach(sub => {
            subscriptions[sub.module_name] = true;
          });
          setUserSubscriptions(subscriptions);
          console.log('✅ Sélections actives:', subscriptions);
        }
      } catch (error) {
        console.error('Erreur vérification sélections:', error);
      }
    };

    if (user) {
      checkUserSubscriptions();
    }
  }, [user]);



  useEffect(() => {
    // Charger les cartes depuis Supabase
    const fetchCards = async () => {
      try {
        console.log('=== DIAGNOSTIC SUPABASE ===');
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Anon Key présent:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('Client Supabase configuré:', !!supabase);
        
        // Test de connexion de base
        const { data: testData, error: testError } = await supabase
          .from('cartes')
          .select('count')
          .limit(1);
        
        console.log('Test de connexion:', { testData, testError });
        
        console.log('Tentative de chargement des cartes depuis Supabase...');
        const { data, error } = await supabase
          .from('cartes')
          .select('*');
        
        console.log('Réponse Supabase complète:', { data, error });
        
        if (error) {
          console.error('=== ERREUR DÉTAILLÉE ===');
          console.error('Erreur lors du chargement des cartes:', error);
          console.error('Code d\'erreur:', error.code);
          console.error('Message d\'erreur:', error.message);
          console.error('Détails:', error.details);
          console.error('Hint:', error.hint);
        } else {
          console.log('Cartes chargées avec succès:', data);
          
          // Ajouter des rôles et données aléatoires aux cartes pour l'affichage
          const cardsWithRoles = (data || []).map(card => ({
            ...card,
            // Nettoyer et utiliser la catégorie de la base de données
            category: cleanCategory(card.category || 'Non classé'),
            // Ajouter des données aléatoires seulement pour l'affichage (pas stockées en DB)
            role: getRandomRole(),
            usage_count: Math.floor(Math.random() * 1000) + 1,
            experience_level: getRandomExperienceLevel()
          }));
          
          setCards(cardsWithRoles);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCards();
  }, []);

  useEffect(() => {
    // Charger le rôle de l'utilisateur
    const fetchUserRole = async () => {
      if (session && user) {
        console.log('Chargement du rôle pour:', user.email, 'ID:', user.id);
        
        try {
          // Essayer d'abord de récupérer depuis auth.users (plus fiable)
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.warn('Erreur lors du chargement depuis auth:', authError);
            setRole('user'); // Rôle par défaut
          } else {
            const userRole = authData.user?.user_metadata?.role || 'user';
            console.log('Rôle récupéré depuis auth.users:', userRole);
            setRole(userRole);
          }
        } catch (err) {
          console.error('Erreur inattendue lors du chargement du rôle:', err);
          setRole('user'); // Rôle par défaut
        }
      } else {
        console.log('Pas de session ou utilisateur:', { session: !!session, user: !!user });
        setRole(null);
      }
    };
    
    fetchUserRole();
  }, [session, user]);

  useEffect(() => {
    // Charger les cartes sélectionnées depuis le localStorage
    const saved = localStorage.getItem('selectedCards');
    if (saved) {
      try {
        setSelectedCards(JSON.parse(saved));
      } catch {
        setSelectedCards([]);
      }
    }
  }, []);

  const handleSubscribe = (card: any) => {
    const isSelected = selectedCards.some(c => c.id === card.id);
    let newSelectedCards;
    
    if (isSelected) {
      // Désabonner
      newSelectedCards = selectedCards.filter(c => c.id !== card.id);
      console.log('Désabonnement de:', card.title);
    } else {
      // S'abonner
      newSelectedCards = [...selectedCards, card];
      console.log('Abonnement à:', card.title);
    }
    
    console.log('Nouvelles cartes sélectionnées:', newSelectedCards);
    setSelectedCards(newSelectedCards);
    localStorage.setItem('selectedCards', JSON.stringify(newSelectedCards));
    console.log('localStorage mis à jour');
  };

  const isCardSelected = (cardId: string) => {
    return selectedCards.some(card => card.id === cardId);
  };

  // Fonction pour convertir en majuscules
  const toUpperCase = (str: string) => str.toUpperCase();

  // Fonction pour nettoyer les catégories supprimées
  const cleanCategory = (category: string) => {
    return category.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  };

  // Fonction pour obtenir l'URL d'accès d'un module
  const getModuleAccessUrl = async (moduleName: string) => {
    console.log('🔐 getModuleAccessUrl appelée pour:', moduleName);
    
    // Mapping des modules vers leurs pages d'accès sécurisées
    const secureModuleUrls: { [key: string]: string } = {
      'stablediffusion': '/stablediffusion-iframe-secure', // Nouvelle interface iframe sécurisée
      'iatube': '/secure-module-access?module=iatube',
      'IAmetube': '/secure-module-access?module=IAmetube',
      // Ajouter d'autres modules ici quand ils seront disponibles
      // 'IAphoto': '/secure-module-access?module=IAphoto',
      // 'IAvideo': '/secure-module-access?module=IAvideo',
    };
    
    // Vérifier si l'utilisateur est connecté
    if (!user?.id) {
      console.log('❌ Utilisateur non connecté, redirection vers login');
      router.push('/login');
      return null;
    }
    
    // Vérifier si l'utilisateur a un abonnement actif pour ce module
    const hasSubscription = userSubscriptions[moduleName.toLowerCase()];
    console.log('🔍 Vérification abonnement:', { moduleName, hasSubscription, userSubscriptions });
    
    // Temporairement, permettre l'accès à Stable Diffusion même sans abonnement vérifié
    if (!hasSubscription && moduleName.toLowerCase() !== 'stablediffusion') {
      console.log(`❌ Aucun abonnement actif pour ${moduleName}`);
      router.push(`/abonnements?module=${moduleName.toLowerCase()}`);
      return null;
    }
    
    console.log(`✅ Accès autorisé pour ${moduleName}, redirection vers la page sécurisée`);
    
    // Rediriger vers la page d'accès sécurisé appropriée
    const secureUrl = secureModuleUrls[moduleName];
    console.log('🎯 URL de redirection:', secureUrl);
    if (secureUrl) {
      console.log('🚀 Redirection vers:', secureUrl);
      router.push(secureUrl);
      return null;
    }
    
    // Fallback pour les modules non configurés
    return `/secure-module-access?module=${moduleName.toLowerCase()}`;
  };

  // Obtenir toutes les catégories uniques depuis les cartes
  const existingCategories = Array.from(new Set(cards.map(card => card.category).filter(Boolean)));
  
  // Définir les catégories autorisées
  const authorizedCategories = ['IA ASSISTANT', 'IA BUREAUTIQUE', 'IA PHOTO', 'IA VIDEO', 'IA MAO', 'IA PROMPTS', 'IA MARKETING', 'IA DESIGN'];
  
  // Filtrer les catégories existantes pour ne garder que les autorisées
  const filteredExistingCategories = existingCategories.filter(cat => authorizedCategories.includes(cat));
  
  // Ajouter les catégories autorisées qui n'existent pas encore
  const allCategories = [...filteredExistingCategories, ...authorizedCategories.filter(cat => !filteredExistingCategories.includes(cat))];
  
  const categories = ['Toutes les catégories', ...allCategories];

  // Filtrer et trier les cartes
  const filteredAndSortedCards = cards
    .filter(card => {
      const q = search.toLowerCase();
      const matchesSearch = (
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q)
      );

      // Filtre par prix
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && card.price === 0) ||
        (priceFilter === 'paid' && card.price > 0);

      // Filtre par niveau d'expérience
      const matchesExperience = experienceFilter === 'all' || 
        card.experience_level === experienceFilter;

      // Filtre par catégorie
      const matchesCategory = categoryFilter === 'all' || 
        card.category === categoryFilter;

      return matchesSearch && matchesPrice && matchesExperience && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'most_used':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'least_used':
          return (a.usage_count || 0) - (b.usage_count || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'name_az':
          return a.title.localeCompare(b.title);
        case 'name_za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 9;
  
  // Calculer les indices pour la pagination
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredAndSortedCards.slice(indexOfFirstCard, indexOfLastCard);
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredAndSortedCards.length / cardsPerPage);
  
  // Fonctions de navigation
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [search, priceFilter, experienceFilter, sortBy, categoryFilter]);

  // Détecter le scroll pour afficher/masquer le bouton de retour en haut
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour remonter en haut de page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fonctions d'administration
  const handleEditCard = (card: any) => {
    setEditingCard(card);
    setShowAdminModal(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      try {
        const { error } = await supabase
          .from('cartes')
          .delete()
          .eq('id', cardId);
        
        if (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de la carte');
        } else {
          // Recharger les cartes
          const { data } = await supabase.from('cartes').select('*');
          if (data) setCards(data);
          alert('Carte supprimée avec succès');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setIsAddingCard(true);
    setShowAdminModal(true);
  };

  // Fonctions pour générer des données aléatoires
  const getRandomRole = () => {
    const roles = ['Développeur', 'Designer', 'Marketing', 'Business', 'Étudiant', 'Freelance'];
    return roles[Math.floor(Math.random() * roles.length)];
  };

  const getRandomExperienceLevel = () => {
    const levels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  // Fonction pour obtenir les propriétés d'image en rapport avec le nom de la carte
  const getCardImageProps = (cardTitle: string) => {
    const title = cardTitle.toLowerCase();
    
    // Mapping des cartes vers des visuels générés par IA
    const imageMapping: { [key: string]: { bgColor: string; icon: string; text: string; imageUrl: string } } = {
      'cogstudio': { 
        bgColor: 'bg-red-500', 
        icon: '🎬', 
        text: 'Vidéo IA',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'psitransfer': { 
        bgColor: 'bg-blue-500', 
        icon: '📁', 
        text: 'Transfert',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop&auto=format'
      },
      'stablediffusion': { 
        bgColor: 'bg-purple-600', 
        icon: '🎨', 
        text: 'IA Générative',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'iatube': { 
        bgColor: 'bg-red-500', 
        icon: '📺', 
        text: 'Vidéo',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'iametube': { 
        bgColor: 'bg-red-500', 
        icon: '📺', 
        text: 'Vidéo',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'iaphoto': { 
        bgColor: 'bg-green-500', 
        icon: '📷', 
        text: 'Photo',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'iavideo': { 
        bgColor: 'bg-red-500', 
        icon: '🎬', 
        text: 'Vidéo',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'pdf+': { 
        bgColor: 'bg-orange-500', 
        icon: '📄', 
        text: 'Documents',
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop&auto=format'
      },
      'chatgpt': { 
        bgColor: 'bg-indigo-600', 
        icon: '🤖', 
        text: 'Assistant IA',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'midjourney': { 
        bgColor: 'bg-purple-600', 
        icon: '🎨', 
        text: 'IA Générative',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'dall-e': { 
        bgColor: 'bg-purple-600', 
        icon: '🎨', 
        text: 'IA Générative',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'canva': { 
        bgColor: 'bg-green-500', 
        icon: '🎨', 
        text: 'Design',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'figma': { 
        bgColor: 'bg-green-500', 
        icon: '🎨', 
        text: 'Design',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'notion': { 
        bgColor: 'bg-orange-500', 
        icon: '📝', 
        text: 'Productivité',
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop&auto=format'
      },
      'slack': { 
        bgColor: 'bg-blue-500', 
        icon: '💬', 
        text: 'Communication',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop&auto=format'
      },
      'discord': { 
        bgColor: 'bg-blue-500', 
        icon: '💬', 
        text: 'Communication',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop&auto=format'
      },
      'zoom': { 
        bgColor: 'bg-blue-500', 
        icon: '📹', 
        text: 'Visioconférence',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'teams': { 
        bgColor: 'bg-blue-500', 
        icon: '👥', 
        text: 'Collaboration',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop&auto=format'
      },
      'google': { 
        bgColor: 'bg-indigo-600', 
        icon: '🔍', 
        text: 'Recherche',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'microsoft': { 
        bgColor: 'bg-indigo-600', 
        icon: '💼', 
        text: 'Bureautique',
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop&auto=format'
      },
      'adobe': { 
        bgColor: 'bg-green-500', 
        icon: '🎨', 
        text: 'Création',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'autocad': { 
        bgColor: 'bg-green-500', 
        icon: '📐', 
        text: 'CAO',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'blender': { 
        bgColor: 'bg-purple-600', 
        icon: '🎬', 
        text: '3D',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'unity': { 
        bgColor: 'bg-purple-600', 
        icon: '🎮', 
        text: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'unreal': { 
        bgColor: 'bg-purple-600', 
        icon: '🎮', 
        text: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format'
      },
      'photoshop': { 
        bgColor: 'bg-green-500', 
        icon: '🖼️', 
        text: 'Édition',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'illustrator': { 
        bgColor: 'bg-green-500', 
        icon: '✏️', 
        text: 'Vectoriel',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format'
      },
      'premiere': { 
        bgColor: 'bg-red-500', 
        icon: '🎬', 
        text: 'Montage',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'after effects': { 
        bgColor: 'bg-red-500', 
        icon: '🎬', 
        text: 'Effets',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'audition': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'logic': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'ableton': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'fl studio': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'pro tools': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'cubase': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'reason': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'bitwig': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'reaper': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'garageband': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'protools': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'flstudio': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'abletonlive': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'logicpro': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'cubasepro': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'reasonstudio': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'bitwigstudio': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'reaperda': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
      'garagebandmac': { 
        bgColor: 'bg-red-500', 
        icon: '🎵', 
        text: 'MAO',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format'
      },
    };

    // Chercher une correspondance exacte ou partielle
    for (const [key, props] of Object.entries(imageMapping)) {
      if (title.includes(key)) {
        return props;
      }
    }

    // Images par défaut selon la catégorie
    const defaultImages = {
      'ia assistant': { bgColor: 'bg-indigo-600', icon: '🤖', text: 'Assistant IA', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format' },
      'ia photo': { bgColor: 'bg-green-500', icon: '📷', text: 'IA Photo', imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format' },
      'ia video': { bgColor: 'bg-red-500', icon: '🎬', text: 'IA Vidéo', imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format' },
      'ia mao': { bgColor: 'bg-red-500', icon: '🎵', text: 'IA MAO', imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format' },
      'ia design': { bgColor: 'bg-green-500', icon: '🎨', text: 'IA Design', imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop&auto=format' },
      'ia marketing': { bgColor: 'bg-indigo-600', icon: '📊', text: 'IA Marketing', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format' },
      'ia prompts': { bgColor: 'bg-indigo-600', icon: '💡', text: 'IA Prompts', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format' },
      'ia bureautique': { bgColor: 'bg-orange-500', icon: '📄', text: 'IA Bureautique', imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop&auto=format' },
    };

    // Chercher par catégorie
    for (const [category, props] of Object.entries(defaultImages)) {
      if (title.includes(category)) {
        return props;
      }
    }

    // Image par défaut générique
    return { bgColor: 'bg-indigo-600', icon: '🤖', text: 'Module IA', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format' };
  };

  // Fonction pour obtenir l'image source d'une carte


  const handleSaveCard = async (cardData: any) => {
    try {
      console.log('=== SAUVEGARDE CARTE ===');
      console.log('Mode:', isAddingCard ? 'Ajout' : 'Modification');
      console.log('ID carte éditée:', editingCard?.id);
      console.log('Données à sauvegarder:', cardData);
      
      // Validation des données
      if (!cardData.title || !cardData.description || !cardData.category || cardData.price === undefined) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      if (isAddingCard) {
        // Ajouter une nouvelle carte
        console.log('Ajout d\'une nouvelle carte...');
        const cardDataWithUpperCase = {
          ...cardData,
          category: cardData.category.toUpperCase()
        };
        const { data, error } = await supabase
          .from('cartes')
          .insert([cardDataWithUpperCase])
          .select();
        
        if (error) {
          console.error('Erreur lors de l\'ajout:', error);
          alert(`Erreur lors de l'ajout de la carte: ${error.message}`);
          return;
        } else {
          console.log('Carte ajoutée avec succès:', data);
          alert('Carte ajoutée avec succès');
        }
      } else {
        // Modifier une carte existante
        console.log('Modification de la carte ID:', editingCard.id);
        const cardDataWithUpperCase = {
          ...cardData,
          category: cardData.category.toUpperCase()
        };
        const { data, error } = await supabase
          .from('cartes')
          .update(cardDataWithUpperCase)
          .eq('id', editingCard.id)
          .select();
        
        if (error) {
          console.error('Erreur lors de la modification:', error);
          alert(`Erreur lors de la modification de la carte: ${error.message}`);
          return;
        } else {
          console.log('Carte modifiée avec succès:', data);
          alert('Carte modifiée avec succès');
        }
      }
      
      // Recharger les cartes
      console.log('Rechargement des cartes...');
      const { data } = await supabase.from('cartes').select('*');
      if (data) {
        console.log('Cartes rechargées depuis la DB:', data);
        const cardsWithRoles = data.map(card => ({
          ...card,
          // Utiliser la catégorie de la base de données
          category: card.category || 'Non classé',
          // Ajouter des données aléatoires seulement pour l'affichage
          role: getRandomRole(),
          usage_count: Math.floor(Math.random() * 1000) + 1,
          experience_level: getRandomExperienceLevel()
        }));
        console.log('Cartes avec données enrichies:', cardsWithRoles);
        setCards(cardsWithRoles);
      }
      
      setShowAdminModal(false);
      setEditingCard(null);
      setIsAddingCard(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      {/* En-tête (Header) */}
      <header className="w-full bg-white shadow-sm border-b border-gray-100 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo et navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo "IAhome" */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold text-blue-900">IAhome</span>
              </div>
              
                             {/* Menu de navigation */}
               <nav className="hidden md:flex items-center space-x-6">
                 <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Ressources</a>
                 <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Communauté</a>
                 <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Exemples</a>
                 <Link href="/blog" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Blog</Link>
               </nav>
            </div>
            
            {/* Boutons à droite */}
            <div className="flex items-center space-x-4">
              
              {!session ? (
                <>
                                     <button className="text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                     Contact commercial
                   </button>
                                     <button className="text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => router.push('/login')}>
                     Se connecter
                   </button>
                   <button className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => router.push('/register')}>
                     Commencer
                   </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Bouton de test pour Stable Diffusion */}
                  <button 
                    onClick={async () => {
                      console.log('🔍 Clic sur le bouton Stable Diffusion');
                      console.log('👤 Utilisateur:', user?.email);
                      console.log('🆔 User ID:', user?.id);
                      console.log('🔐 Session:', session ? 'Active' : 'Inactive');
                      
                      if (!user?.id) {
                        console.log('❌ Utilisateur non connecté, redirection vers login');
                        router.push('/login');
                        return;
                      }
                      
                      console.log('✅ Utilisateur connecté, génération de l\'URL d\'accès...');
                      await getModuleAccessUrl('stablediffusion');
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 text-sm"
                  >
                    <span>🎨</span>
                    <span>Stable Diffusion</span>
                  </button>
                  
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    role === 'admin' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {role === 'admin' ? 'ADMIN' : 'USER'}
                  </div>
                  
                  <Link 
                    href="/encours" 
                    className="text-gray-700 font-medium px-3 py-1 rounded hover:bg-gray-100 text-sm transition-colors"
                  >
                    📦 Mes Modules
                  </Link>
                  
                  <button 
                    className="text-gray-700 font-medium px-3 py-1 rounded hover:bg-gray-100 text-sm" 
                    onClick={async () => { 
                      await supabase.auth.signOut(); 
                      router.push('/login'); 
                    }}
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Section héros */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Contenu texte */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 leading-tight mb-4">
                Accès direct à la puissance et aux outils IA
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Boostez votre productivité dès maintenant
              </p>
              
              {/* Barre de recherche */}
              <div className="relative max-w-lg">
                                                 <input
                  type="text"
                  placeholder="Recherche parmi les modules"
                  className="w-full px-6 py-4 pl-12 pr-16 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                                 <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                   Rechercher
                 </button>
              </div>
              

            </div>
            
            {/* Illustration */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80 h-64">
                {/* Formes géométriques abstraites */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
                <div className="absolute top-16 right-0 w-20 h-20 bg-blue-400 rounded-lg opacity-70 animate-bounce"></div>
                <div className="absolute bottom-0 left-16 w-20 h-20 bg-yellow-400 transform rotate-45 opacity-70 animate-pulse"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 bg-green-400 rounded-full opacity-70 animate-bounce"></div>
                
                {/* Éléments centraux */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-900/20 mb-3">AI</div>
                    <div className="text-xs text-gray-500">Intelligence Artificielle</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section principale avec filtres et contenu */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar gauche - Catégories */}
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">Catégorie</h2>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button 
                      key={cat} 
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        categoryFilter === (cat === 'Toutes les catégories' ? 'all' : cat)
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setCategoryFilter(cat === 'Toutes les catégories' ? 'all' : cat)}
                    >
                      {cat === 'Toutes les catégories' ? cat : toUpperCase(cleanCategory(cat))}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Contenu principal */}
            <div className="flex-1">
              {/* Filtres */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                         <select 
                       className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       value={priceFilter}
                       onChange={(e) => setPriceFilter(e.target.value)}
                     >
                       <option value="all">Gratuit et payant</option>
                       <option value="free">Gratuit uniquement</option>
                       <option value="paid">Payant uniquement</option>
                     </select>
                    
                                         <select 
                       className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       value={experienceFilter}
                       onChange={(e) => setExperienceFilter(e.target.value)}
                     >
                       <option value="all">Tous niveaux d'expérience</option>
                       <option value="Débutant">Débutant</option>
                       <option value="Intermédiaire">Intermédiaire</option>
                       <option value="Avancé">Avancé</option>
                       <option value="Expert">Expert</option>
                     </select>
                  </div>
                  
                  {/* Boutons */}
                  <div className="flex items-center gap-3">
                    {session && role === 'admin' && (
                      <>
                        <button 
                          onClick={handleAddCard}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Ajouter
                        </button>
                      </>
                    )}
                    

                    
                    <select 
                      className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="most_used">Trier par : Plus installés</option>
                      <option value="least_used">Trier par : Moins installés</option>
                      <option value="price_high">Trier par : Prix élevé à bas</option>
                      <option value="price_low">Trier par : Prix bas à élevé</option>
                      <option value="name_az">Trier par : Nom A-Z</option>
                      <option value="name_za">Trier par : Nom Z-A</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grille de templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">Chargement des templates...</div>
                  </div>
                ) : filteredAndSortedCards.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">Aucun template trouvé pour "{search}"</div>
                  </div>
                ) : currentCards.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">Aucune carte à afficher (currentCards vide)</div>
                    <div className="text-sm text-gray-400 mt-2">Total cartes: {filteredAndSortedCards.length}</div>
                  </div>
                ) : (
                  currentCards.map((card) => (
                    <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      {/* En-tête de la carte */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            {toUpperCase(cleanCategory(card.category))}
                          </span>
                          {session && role === 'admin' && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleEditCard(card)}
                                className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                title="Modifier"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Supprimer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <Link href={`/card/${card.id}`}>
                          <h3 className="text-lg font-semibold text-blue-900 mb-2 hover:text-blue-700 cursor-pointer transition-colors">{card.title}</h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                      </div>



                      {/* Visuel généré par IA selon le module */}
                      <div className="w-full aspect-video rounded-lg border border-gray-200 overflow-hidden mb-4">
                                                {(() => {
                          const title = card.title.toLowerCase();
                          const category = card.category.toLowerCase();
                          let imageSrc = '';
                          
                          // Mapping spécifique pour certaines cartes
                          if (title.includes('stablediffusion') || title.includes('sdnext')) {
                            imageSrc = '/images/stablediffusion.jpg';
                          } else if (title.includes('iatube') || title.includes('iametube')) {
                            imageSrc = '/images/iatube.jpg';
                          } else if (title.includes('iaphoto')) {
                            imageSrc = '/images/iaphoto.jpg';
                          } else if (title.includes('chatgpt') || title.includes('gpt')) {
                            imageSrc = '/images/chatgpt.jpg';
                          } else if (title.includes('pdf') || title.includes('document')) {
                            imageSrc = '/images/pdf-plus.jpg';
                          } else if (title.includes('psitransfer') || title.includes('transfer')) {
                            imageSrc = '/images/psitransfer.jpg';
                          } else {
                            // Attribution d'images par catégorie pour toutes les autres cartes
                            if (category.includes('video')) {
                              imageSrc = '/images/iatube.jpg';
                            } else if (category.includes('photo')) {
                              imageSrc = '/images/iaphoto.jpg';
                            } else if (category.includes('assistant') || category.includes('ai')) {
                              imageSrc = '/images/chatgpt.jpg';
                            } else if (category.includes('bureautique') || category.includes('document')) {
                              imageSrc = '/images/pdf-plus.jpg';
                            } else if (category.includes('design') || category.includes('marketing')) {
                              imageSrc = '/images/stablediffusion.jpg';
                            } else if (category.includes('mao') || category.includes('audio')) {
                              imageSrc = '/images/psitransfer.jpg';
                            } else {
                              // Image par défaut pour les autres catégories
                              imageSrc = '/images/chatgpt.jpg';
                            }
                          }
                          
                          return (
                            <img
                              src={imageSrc}
                              alt={`Interface ${card.title}`}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>

                      {/* Pied de carte */}
                      <div className="p-6 pt-4">
                        {/* Tags d'information */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {card.role && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              👤 {card.role}
                            </span>
                          )}
                          {card.experience_level && (
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              📚 {card.experience_level}
                            </span>
                          )}
                          {card.usage_count && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              📊 {card.usage_count} utilisations
                            </span>
                          )}
                        </div>

                                                 {/* Prix et bouton */}
                         <div className="flex items-center justify-between">
                           <div className="text-2xl font-bold text-blue-900">
                             €{card.price}
                           </div>
                           <div className="flex gap-2">
                             {/* Bouton d'accès direct pour les modules avec abonnement actif */}
                             {session && userSubscriptions[card.title] && (
                               <button 
                                 className="px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors"
                                 onClick={async () => {
                                   // Vérifier si c'est un module qui nécessite un magic link
                                   if (card.title === 'iatube' || card.title === 'stablediffusion' || card.title.toLowerCase().includes('iatube') || card.title.toLowerCase().includes('stablediffusion')) {
                                     // Créer un magic link
                                     await getModuleAccessUrl(card.title);
                                   } else {
                                     // Accès direct pour les autres modules
                                     const moduleUrls: { [key: string]: string } = {
                                       'IAmetube': 'https://metube.regispailler.fr',
                                       'IAphoto': 'https://iaphoto.regispailler.fr',
                                       'IAvideo': 'https://iavideo.regispailler.fr',
                                     };
                                     
                                     const directUrl = moduleUrls[card.title];
                                     if (directUrl) {
                                       console.log('🔍 Accès direct vers:', directUrl);
                                       window.open(directUrl, '_blank');
                                     }
                                   }
                                 }}
                                 title={`Accéder à ${card.title}`}
                               >
                                 📺 Accéder
                               </button>
                             )}
                            
                            <button 
                              className={`px-6 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                isCardSelected(card.id) 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              onClick={() => handleSubscribe(card)}
                            >
                              {isCardSelected(card.id) ? 'Sélectionné' : 'Choisir'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Contrôles de pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Précédent
                  </button>
                  
                  {/* Numéros de pages */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      // Afficher seulement quelques pages autour de la page actuelle
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <span key={pageNumber} className="px-2 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              )}
              
              {/* Informations de pagination */}
              {filteredAndSortedCards.length > 0 && (
                <div className="text-center text-gray-600 text-sm mt-4">
                  Affichage de {indexOfFirstCard + 1} à {Math.min(indexOfLastCard, filteredAndSortedCards.length)} sur {filteredAndSortedCards.length} templates
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

              {/* Section Confirmer la(es) sélection(s) */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à activer vos sélections ?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Confirmez vos sélections et accédez à tous les outils IA
          </p>
          <button
            onClick={() => router.push('/abonnements')}
            className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors text-lg shadow-lg"
          >
            Confirmer la(es) sélection(s)
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">
            © 2025 iIAhome - Tous droits réservés
          </div>
        </div>
      </footer>

      {/* Modal d'administration */}
      {showAdminModal && (
        <AdminCardModal 
          card={editingCard}
          isAdding={isAddingCard}
          onSave={handleSaveCard}
          onClose={() => {
            setShowAdminModal(false);
            setEditingCard(null);
            setIsAddingCard(false);
          }}
        />
      )}

      {/* Bouton de retour en haut */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title="Retour en haut"
          aria-label="Retour en haut de page"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="w-6 h-6"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M4.5 15.75l7.5-7.5 7.5 7.5" 
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// Composant modal pour l'administration des cartes
function AdminCardModal({ card, isAdding, onSave, onClose }: {
  card: any;
  isAdding: boolean;
  onSave: (cardData: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: card?.title || '',
    description: card?.description || '',
    category: card?.category || '',
    price: card?.price || 0,
    youtube_url: card?.youtube_url || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== MODAL SUBMIT ===');
    console.log('FormData envoyé:', formData);
    console.log('Carte originale:', card);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-blue-900">
              {isAdding ? 'Ajouter une carte' : 'Modifier la carte'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre de la carte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description de la carte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="IA ASSISTANT">IA ASSISTANT</option>
                <option value="IA BUREAUTIQUE">IA BUREAUTIQUE</option>
                <option value="IA PHOTO">IA PHOTO</option>
                <option value="IA VIDEO">IA VIDEO</option>
                <option value="IA MAO">IA MAO</option>
                <option value="IA PROMPTS">IA PROMPTS</option>
                <option value="IA MARKETING">IA MARKETING</option>
                <option value="IA DESIGN">IA DESIGN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (€) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL YouTube (optionnel)
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/embed/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilisez le format embed: https://www.youtube.com/embed/VIDEO_ID
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isAdding ? 'Ajouter' : 'Modifier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
