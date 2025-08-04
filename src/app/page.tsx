'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Breadcrumb from '../components/Breadcrumb';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [priceFilter, setPriceFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('most_used');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userSubscriptions, setUserSubscriptions] = useState<{[key: string]: boolean}>({});
  const [showScrollToTop, setShowScrollToTop] = useState(false);



  // État pour la modal iframe
  const [iframeModal, setIframeModal] = useState<{isOpen: boolean, url: string, title: string}>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Fonction utilitaire pour déterminer si un module est gratuit
  const isModuleFree = (module: any) => {
    const priceStr = module.price?.toString().toLowerCase() || '';
    return priceStr === '0' || priceStr === '0.00' || priceStr.includes('gratuit') || priceStr.includes('free');
  };

  const isModulePaid = (module: any) => {
    const priceStr = module.price?.toString().toLowerCase() || '';
    const isFree = isModuleFree(module);
    return !isFree && (priceStr.includes('€') || priceStr.includes('euros') || priceStr.includes('euro') || /\d+\.\d+/.test(priceStr) || /\d+,\d+/.test(priceStr));
  };

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
    // Charger les modules depuis Supabase
    const fetchModules = async () => {
      try {
        console.log('=== DIAGNOSTIC SUPABASE ===');
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Anon Key présent:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('Client Supabase configuré:', !!supabase);
        
        // Test de connexion de base
        const { data: testData, error: testError } = await supabase
          .from('modules')
          .select('id')
          .limit(1);
        
        console.log('Test de connexion:', { testData, testError });
        
        console.log('Tentative de chargement des modules depuis Supabase...');
        const { data, error } = await supabase
          .from('modules')
          .select('*');
        
        console.log('Réponse Supabase complète:', { data, error });
        
        if (error) {
          console.error('=== ERREUR DÉTAILLÉE ===');
          console.error('Erreur lors du chargement des modules:', error);
          console.error('Code d\'erreur:', error.code);
          console.error('Message d\'erreur:', error.message);
          console.error('Détails:', error.details);
          console.error('Hint:', error.hint);
        } else {
          console.log('Modules chargés avec succès:', data);
          console.log('Sous-titres des modules:', data?.map(m => ({ title: m.title, subtitle: m.subtitle })));
          
          // Ajouter des rôles et données aléatoires aux modules pour l'affichage
          const modulesWithRoles = (data || []).map(module => ({
            ...module,
            // Nettoyer et utiliser la catégorie de la base de données
            category: cleanCategory(module.category || 'Non classé'),
            // Ajouter des données aléatoires seulement pour l'affichage (pas stockées en DB)
            role: getRandomRole(),
            usage_count: Math.floor(Math.random() * 1000) + 1,
            experience_level: getRandomExperienceLevel()
          }));
          
          setModules(modulesWithRoles);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modules:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
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
    // Charger les modules sélectionnés depuis le localStorage
    const saved = localStorage.getItem('selectedModules');
    if (saved) {
      try {
        setSelectedModules(JSON.parse(saved));
      } catch {
        setSelectedModules([]);
      }
    }
  }, []);



  const handleSubscribe = (module: any) => {
    const isSelected = selectedModules.some(m => m.id === module.id);
    let newSelectedModules;
    
    if (isSelected) {
      // Désabonner
      newSelectedModules = selectedModules.filter(m => m.id !== module.id);
      console.log('Désabonnement de:', module.title);
    } else {
      // S'abonner
      newSelectedModules = [...selectedModules, module];
      console.log('Abonnement à:', module.title);
    }
    
    console.log('Nouveaux modules sélectionnés:', newSelectedModules);
    setSelectedModules(newSelectedModules);
    localStorage.setItem('selectedModules', JSON.stringify(newSelectedModules));
    console.log('localStorage mis à jour');
  };

  const isModuleSelected = (moduleId: string) => {
    return selectedModules.some(module => module.id === moduleId);
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
    
    // Vérifier l'abonnement pour tous les modules
    if (!hasSubscription) {
      console.log(`❌ Aucun abonnement actif pour ${moduleName}`);
      // Rediriger vers la page détaillée du module pour l'achat
      router.push(`/card/${moduleName.toLowerCase()}`);
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

  // Obtenir toutes les catégories uniques depuis les modules
  const existingCategories = Array.from(new Set(modules.map(module => module.category).filter(Boolean)));
  
  // Définir les catégories autorisées
  const authorizedCategories = ['IA ASSISTANT', 'IA BUREAUTIQUE', 'IA PHOTO', 'IA VIDEO', 'IA MAO', 'IA PROMPTS', 'IA MARKETING', 'IA DESIGN'];
  
  // Filtrer les catégories existantes pour ne garder que les autorisées
  const filteredExistingCategories = existingCategories.filter(cat => authorizedCategories.includes(cat));
  
  // Ajouter les catégories autorisées qui n'existent pas encore
  const allCategories = [...filteredExistingCategories, ...authorizedCategories.filter(cat => !filteredExistingCategories.includes(cat))];
  
  const categories = ['Toutes les catégories', ...allCategories];

  // Filtrer et trier les modules
  const filteredAndSortedModules = modules
    .filter(module => {
      // Exclure Stable Diffusion de la page d'accueil
      if (module.title.toLowerCase().includes('stablediffusion') || module.title.toLowerCase().includes('sdnext')) {
        return false;
      }

      const q = search.toLowerCase();
      const matchesSearch = (
        module.title.toLowerCase().includes(q) ||
        module.description.toLowerCase().includes(q) ||
        module.category.toLowerCase().includes(q)
      );

      // Filtre par prix
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && isModuleFree(module)) ||
        (priceFilter === 'paid' && isModulePaid(module));

      // Filtre par niveau d'expérience
      const matchesExperience = experienceFilter === 'all' || 
        module.experience_level === experienceFilter;

      // Filtre par catégorie
      const matchesCategory = categoryFilter === 'all' || 
        module.category === categoryFilter;

      return matchesSearch && matchesPrice && matchesExperience && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'most_used':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'least_used':
          return (a.usage_count || 0) - (b.usage_count || 0);
        case 'price_high':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'price_low':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
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
  const modulesPerPage = 9;
  
  // Calculer les indices pour la pagination
  const indexOfLastModule = currentPage * modulesPerPage;
  const indexOfFirstModule = indexOfLastModule - modulesPerPage;
  const currentModules = filteredAndSortedModules.slice(indexOfFirstModule, indexOfLastModule);
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredAndSortedModules.length / modulesPerPage);
  
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


  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      try {
        const { error } = await supabase
          .from('modules')
          .delete()
          .eq('id', moduleId);
        
        if (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du module');
        } else {
          // Recharger les modules
          const { data } = await supabase.from('modules').select('*');
          if (data) setModules(data);
          alert('Module supprimé avec succès');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };



  // Fonction pour redirection vers la page d'administration des modules
  const handleAdminRedirect = () => {
    router.push('/admin');
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

  // Fonction pour obtenir les propriétés d'image en rapport avec le nom du module
  // Fonction pour vérifier l'accès à un module
  const checkModuleAccess = async (moduleName: string) => {
    if (!user?.id) return { canAccess: false, reason: 'Utilisateur non connecté' };
    
    try {
      const response = await fetch('/api/check-session-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          moduleName: moduleName
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur vérification accès:', error);
      return { canAccess: false, reason: 'Erreur de vérification' };
    }
  };

  const generateModuleMagicLink = async (moduleName: string) => {
    if (!user?.id) return null;
    
    try {
      const response = await fetch('/api/generate-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName: moduleName,
          durationMinutes: moduleName === 'Metube' ? 720 : 1440 // 12h pour Metube, 24h pour les autres
        }),
      });

      const data = await response.json();
      if (data.success && data.accessUrl) {
        return data.accessUrl;
      } else {
        console.error('Erreur génération magic link:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Erreur génération magic link:', error);
      return null;
    }
  };

  // Fonction pour obtenir les conditions d'accès selon le module
  const getAccessConditions = (moduleTitle: string) => {
    if (moduleTitle === 'Metube') {
      return '12 heures';
    }
    return 'Accès illimité';
  };

  const getCardImageProps = (cardTitle: string) => {
    const title = cardTitle.toLowerCase();
    
    // Mapping des modules vers des visuels générés par IA
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


      'metube': { 
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




  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      <Breadcrumb />

      {/* Section héros */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Contenu texte */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Accès direct à la puissance et aux outils IA
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Build with ready-made apps and templates created by the Bubble community.
              </p>
              
              {/* Barre de recherche */}
              <div className="relative max-w-lg">
                <input
                  type="text"
                  placeholder="Search for a template"
                  className="w-full px-6 py-4 pl-12 pr-16 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/20 transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/70">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Search
                </button>
              </div>
            </div>
            
            {/* Illustration */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80 h-64">
                {/* Formes géométriques abstraites */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
                <div className="absolute top-16 right-0 w-20 h-20 bg-yellow-400 rounded-lg opacity-80 animate-bounce"></div>
                <div className="absolute bottom-0 left-16 w-20 h-20 bg-green-400 transform rotate-45 opacity-80 animate-pulse"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 bg-white rounded-full opacity-80 animate-bounce"></div>
                
                {/* Éléments centraux */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white/30 mb-3">AI</div>
                    <div className="text-xs text-white/70">Intelligence Artificielle</div>
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
                ) : filteredAndSortedModules.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">Aucun template trouvé pour "{search}"</div>
                  </div>
                ) : currentModules.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">Aucun module à afficher (currentModules vide)</div>
                    <div className="text-sm text-gray-400 mt-2">Total modules: {filteredAndSortedModules.length}</div>
                  </div>
                ) : (
                  currentModules.map((module) => (
                    <div key={module.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      {/* En-tête du module */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            {toUpperCase(cleanCategory(module.category))}
                          </span>
                          {session && role === 'admin' && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleDeleteModule(module.id)}
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
                        
                        <Link href={`/card/${module.id}`}>
                          <h3 className="text-lg font-semibold text-blue-900 mb-1 hover:text-blue-700 cursor-pointer transition-colors">{module.title}</h3>
                          {module.subtitle && (
                            <p className="text-sm text-gray-500 mb-2 italic">{module.subtitle}</p>
                          )}
                        </Link>
                      </div>



                      {/* Visuel généré par IA selon le module */}
                      <div className="w-full aspect-video rounded-lg border border-gray-200 overflow-hidden mb-4">
                                                {(() => {
                          const title = module.title.toLowerCase();
                          const category = module.category.toLowerCase();
                          let imageSrc = '';
                          
                          // Mapping spécifique pour certains modules
                          if (title.includes('metube')) {
                            imageSrc = '/images/iatube.jpg';
                          } else if (title.includes('invoke')) {
                            imageSrc = '/images/chatgpt.jpg';
                          } else if (title.includes('stablediffusion') || title.includes('sdnext')) {
                            imageSrc = '/images/stablediffusion.jpg';
                          } else if (title.includes('ruinefooocus')) {
                            imageSrc = '/images/chatgpt.jpg';
                          } else if (title.includes('iaphoto')) {
                            imageSrc = '/images/iaphoto.jpg';
                          } else if (title.includes('chatgpt') || title.includes('gpt')) {
                            imageSrc = '/images/chatgpt.jpg';
                          } else if (title.includes('pdf') || title.includes('document')) {
                            imageSrc = '/images/pdf-plus.jpg';
                          } else if (title.includes('psitransfer') || title.includes('transfer')) {
                            imageSrc = '/images/psitransfer.jpg';
                          } else {
                            // Attribution d'images par catégorie pour tous les autres modules
                            if (category.includes('video')) {
                              imageSrc = '/images/iatube.jpg';
                            } else if (category.includes('photo')) {
                              imageSrc = '/images/iaphoto.jpg';
                            } else if (category.includes('assistant') || category.includes('ai')) {
                              imageSrc = '/images/chatgpt.jpg';
                            } else if (category.includes('bureautique') || category.includes('document')) {
                              imageSrc = '/images/pdf-plus.jpg';
                            } else if (category.includes('design') || category.includes('marketing')) {
                              imageSrc = '/images/chatgpt.jpg';
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
                              alt={`Interface ${module.title}`}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>

                      {/* Pied du module */}
                      <div className="p-6 pt-4">
                        {/* Tags d'information */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {module.role && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              👤 {module.role}
                            </span>
                          )}
                          {module.experience_level && (
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                              📚 {module.experience_level}
                            </span>
                          )}
                          {module.usage_count && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              📊 {module.usage_count} utilisations
                            </span>
                          )}

                        </div>

                                                 {/* Boutons d'accès */}
                         <div className="flex items-center justify-end">
                           <div className="flex gap-2">
                             {/* Bouton d'accès direct pour les modules avec abonnement actif (exclure les modules gratuits spécifiques) */}
{session && (userSubscriptions[module.title] || (isModuleFree(module) && !['PDF+', 'Librespeed', 'PSitransfer'].includes(module.title))) && module.title !== 'Metube' && (
                               <button 
                                 className="px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors"
                                 onClick={async () => {
                                   // Vérifier l'accès au module avant d'ouvrir
                                   const accessCheck = await checkModuleAccess(module.title);
                                   
                                   if (!accessCheck.canAccess) {
                                     if (accessCheck.reason === 'Session expirée') {
                                       alert(`Session expirée pour ${module.title}. Veuillez générer un nouveau lien d'accès.`);
                                     } else {
                                       alert(`Accès refusé pour ${module.title}: ${accessCheck.reason}`);
                                     }
                                     return;
                                   }

                                   // Accès direct pour tous les modules dans une iframe
                                   if (module.title === 'Metube') {
                                     // Générer un magic link de 12 heures pour Metube
                                     console.log('🔍 Génération d\'un magic link de 12 heures pour Metube');
                                     const magicLink = await generateModuleMagicLink(module.title);
                                     if (magicLink) {
                                       setIframeModal({
                                         isOpen: true,
                                         url: magicLink,
                                         title: module.title
                                       });
                                     } else {
                                       alert('Erreur lors de la génération du lien d\'accès');
                                     }
                                   } else {
                                     // Accès direct pour tous les autres modules dans une iframe
                                     const moduleUrls: { [key: string]: string } = {
                                       'IAphoto': 'https://iaphoto.regispailler.fr',
                                       'IAvideo': 'https://iavideo.regispailler.fr',
                                       'Librespeed': 'https://librespeed.regispailler.fr',
                                       'PSitransfer': 'https://psitransfer.regispailler.fr',
                                       'PDF+': 'https://pdfplus.regispailler.fr',
                                     };
                                     
                                     const directUrl = moduleUrls[module.title];
                                     if (directUrl) {
                                       console.log('🔍 Ouverture de', module.title, 'dans une iframe:', directUrl);
                                       setIframeModal({
                                         isOpen: true,
                                         url: directUrl,
                                         title: module.title
                                       });
                                     } else {
                                       // Pour les modules gratuits sans URL spécifique, afficher un message
                                       if (isModuleFree(module)) {
                                         alert(`Module gratuit "${module.title}" - Accès disponible pour les utilisateurs connectés`);
                                       }
                                     }
                                   }
                                 }}
                                 title={`Accéder à ${module.title}`}
                               >
                                 {isModuleFree(module) ? '🆓 Accéder gratuitement' : '📺 Accéder'}
                               </button>
                             )}
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
              {filteredAndSortedModules.length > 0 && (
                <div className="text-center text-gray-600 text-sm mt-4">
                  Affichage de {indexOfFirstModule + 1} à {Math.min(indexOfLastModule, filteredAndSortedModules.length)} sur {filteredAndSortedModules.length} templates
                </div>
              )}
            </div>
          </div>
        </div>
      </section>







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

      {/* Bouton flottant de gestion des modules seulement pour les admins */}
      {session && role === 'admin' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleAdminRedirect}
            className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full shadow-xl hover:bg-green-700 transition-all duration-200 transform hover:scale-110"
            title="Administration du site"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal pour l'iframe */}
      {iframeModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header de la modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {iframeModal.title}
              </h3>
              <button
                onClick={() => setIframeModal({isOpen: false, url: '', title: ''})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenu de l'iframe */}
            <div className="flex-1 p-4">
              <iframe
                src={iframeModal.url}
                className="w-full h-full border-0 rounded"
                title={iframeModal.title}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


