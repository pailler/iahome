'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from 'next/navigation';

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
    console.log('Session changée:', { 
      hasSession: !!session, 
      userEmail: user?.email,
      userId: user?.id 
    });
  }, [session, user]);

  useEffect(() => {
    if (user) {
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) setRole(data.role);
        });
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
          
          // Ajouter des rôles aléatoires aux cartes
          const cardsWithRoles = (data || []).map(card => ({
            ...card,
            role: getRandomRole(),
            usage_count: Math.floor(Math.random() * 1000) + 1, // Nombre d'utilisations aléatoire
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
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erreur lors du chargement du rôle:', error);
        } else {
          console.log('Rôle trouvé:', data.role);
          setRole(data.role);
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

      return matchesSearch && matchesPrice && matchesExperience;
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

  const handleSaveCard = async (cardData: any) => {
    try {
      if (isAddingCard) {
        // Ajouter une nouvelle carte
        const { error } = await supabase
          .from('cartes')
          .insert([cardData]);
        
        if (error) {
          console.error('Erreur lors de l\'ajout:', error);
          alert('Erreur lors de l\'ajout de la carte');
        } else {
          alert('Carte ajoutée avec succès');
        }
      } else {
        // Modifier une carte existante
        const { error } = await supabase
          .from('cartes')
          .update(cardData)
          .eq('id', editingCard.id);
        
        if (error) {
          console.error('Erreur lors de la modification:', error);
          alert('Erreur lors de la modification de la carte');
        } else {
          alert('Carte modifiée avec succès');
        }
      }
      
      // Recharger les cartes
      const { data } = await supabase.from('cartes').select('*');
      if (data) {
        const cardsWithRoles = data.map(card => ({
          ...card,
          role: getRandomRole(),
          usage_count: Math.floor(Math.random() * 1000) + 1,
          experience_level: getRandomExperienceLevel()
        }));
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
    <div className="min-h-screen bg-blue-50 font-sans flex flex-col min-h-screen">

      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm mt-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-2">
            b
          </div>
          <nav className="hidden md:flex gap-6 text-blue-900 font-medium">
            <a className="hover:underline cursor-default">Product</a>
            <a className="hover:underline cursor-default">Resources</a>
            <a className="hover:underline cursor-default">Community</a>
            <a className="hover:underline cursor-default">Examples</a>
            <a className="hover:underline cursor-default">Pricing</a>
            <a className="hover:underline cursor-default">Enterprise</a>
          </nav>
        </div>
        <div className="flex gap-3 items-center">
          <button className="text-blue-900 font-medium px-4 py-2 rounded hover:bg-blue-100" onClick={() => router.push('/abonnements')}>Mes abonnements</button>
          {session && role === 'admin' && (
            <button className="text-red-600 font-medium px-4 py-2 rounded hover:bg-red-100" onClick={() => router.push('/admin')}>Admin</button>
          )}
          {!session && (
            <>
              <button className="text-blue-900 font-medium px-4 py-2 rounded hover:bg-blue-100" onClick={() => router.push('/login')}>Log in</button>
              <button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700" onClick={() => router.push('/register')}>Get started</button>
            </>
          )}
          {session && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-900 text-sm font-medium">{user?.email}</span>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  role === 'admin' 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}>
                  {role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Connecté</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <button 
                  className="text-blue-900 font-medium px-3 py-1 rounded hover:bg-blue-100 text-sm" 
                  onClick={async () => { 
                    await supabase.auth.signOut(); 
                    router.push('/login'); 
                  }}
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 py-16 max-w-7xl mx-auto gap-12">
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 leading-tight">
            Accès direct à la puissance et aux outils IA
          </h1>
          <p className="text-lg text-blue-900/80">
            Découvrez ce que l’IA peut faire pour vous, directement depuis votre navigateur.
          </p>
          <div className="flex items-center w-full max-w-xl mt-4">
            <input
              type="text"
              placeholder="Recherchez votre IA"
              className="flex-1 px-5 py-3 rounded-l-lg border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={e => { setSearch(e.target.value); console.log('Recherche:', e.target.value); }}
            />
            <span className="bg-blue-600 px-4 py-3 rounded-r-lg text-white flex items-center cursor-default">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          {/* Illustration abstraite */}
          <div className="w-80 h-64 bg-gradient-to-tr from-blue-200 via-yellow-200 to-red-200 rounded-3xl flex items-center justify-center relative">
            <svg width="120" height="120" className="absolute left-8 top-8">
              <circle cx="60" cy="60" r="40" fill="#2563eb" fillOpacity="0.7" />
            </svg>
            <svg width="80" height="80" className="absolute right-8 bottom-8">
              <rect width="60" height="60" rx="15" fill="#facc15" fillOpacity="0.7" />
            </svg>
            <svg width="60" height="60" className="absolute right-16 top-12">
              <polygon points="30,0 60,60 0,60" fill="#ef4444" fillOpacity="0.7" />
            </svg>
            <span className="z-10 text-5xl font-bold text-blue-900/20">IA</span>
          </div>
        </div>
      </section>

      {/* Filtres et contenu principal */}
      <section className="max-w-7xl mx-auto flex gap-8 px-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Category</h2>
          <div className="flex flex-wrap gap-2">
            {['AI','Blog','Booking','Building blocks','Chat','CRM','Dashboard','Directory & listings','Finance','Game','Landing page','Marketplace','Mobile','On-demand services','Online store','Portfolio'].map((cat) => (
              <span key={cat} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-blue-900 text-sm font-medium cursor-default hover:bg-blue-100">{cat}</span>
            ))}
          </div>
        </aside>
        <div className="flex-1">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex gap-3">
              <select 
                className="px-4 py-2 rounded border border-blue-200 bg-white text-blue-900 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <option value="all">Gratuit et payant</option>
                <option value="free">Gratuit uniquement</option>
                <option value="paid">Payant uniquement</option>
              </select>
              <select 
                className="px-4 py-2 rounded border border-blue-200 bg-white text-blue-900 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="md:ml-auto flex gap-3">
              {session && role === 'admin' && (
                <button 
                  onClick={handleAddCard}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-green-600 bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Ajouter une carte
                </button>
              )}
              <select 
                className="flex items-center gap-2 px-4 py-2 rounded border border-blue-200 bg-white text-blue-900 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="most_used">Trier par : Plus utilisés</option>
                <option value="least_used">Trier par : Moins utilisés</option>
                <option value="price_high">Trier par : Prix élevé</option>
                <option value="price_low">Trier par : Prix bas</option>
                <option value="name_az">Trier par : Nom A-Z</option>
                <option value="name_za">Trier par : Nom Z-A</option>
              </select>
            </div>
          </div>
          {/* Grille de templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-3 text-blue-900/70 text-center py-12">Chargement des cartes...</div>
            ) : filteredAndSortedCards.length === 0 ? (
              <div className="col-span-3 text-blue-900/70 text-center py-12">Aucun résultat pour "{search}"</div>
            ) : (
              filteredAndSortedCards.map((card) => (
                <div key={card.id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
                  {/* Titre et catégorie en haut */}
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded w-fit">{card.category}</span>
                    <h3 className="text-lg font-semibold text-blue-900">{card.title}</h3>
                  </div>
                  
                  <div className="w-full aspect-video bg-blue-100 rounded-lg flex items-center justify-center">
                    {/* Embbed Youtube depuis Supabase */}
                    {card.youtube_url ? (
                      <iframe
                        className="rounded-lg"
                        width="100%"
                        height="100%"
                        src={card.youtube_url}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="flex items-center justify-center text-blue-900/60">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-blue-900/80">{card.description}</p>
                    
                    {/* Informations supplémentaires */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {card.role && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          👤 {card.role}
                        </span>
                      )}
                      {card.experience_level && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          📚 {card.experience_level}
                        </span>
                      )}
                      {card.usage_count && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          📊 {card.usage_count} utilisations
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 justify-between">
                      <div>
                        <span className="text-base font-bold text-blue-900">€{card.price}</span>
                      </div>
                      <div className="flex gap-2">
                        {session && role === 'admin' && (
                          <>
                            <button 
                              onClick={() => handleEditCard(card)}
                              className="px-3 py-2 rounded-lg font-semibold text-sm shadow transition-colors bg-yellow-500 hover:bg-yellow-600 text-white"
                              title="Modifier cette carte"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteCard(card.id)}
                              className="px-3 py-2 rounded-lg font-semibold text-sm shadow transition-colors bg-red-500 hover:bg-red-600 text-white"
                              title="Supprimer cette carte"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button 
                          className={`px-4 py-2 rounded-lg font-semibold text-sm shadow transition-colors ${
                            isCardSelected(card.id) 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          onClick={() => handleSubscribe(card)}
                        >
                          {isCardSelected(card.id) ? 'Abonné' : 'S\'abonner'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {/* Footer Bannière */}
      <footer className="w-full bg-white text-blue-900 py-4 px-8 flex items-center justify-end text-sm mt-12 border-t border-blue-100 text-right">
        © 2025 iIAhome Tous droits réservés
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
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description de la carte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: BUILDING BLOCKS"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
