'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession, useUser } from '@supabase/auth-helpers-react';

export default function AdminPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    youtube_url: ''
  });
  const session = useSession();
  const user = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et a les droits admin
    if (!session) {
      console.log('Pas de session, redirection vers login');
      router.push('/login');
      return;
    }

    console.log('Session trouvée, utilisateur:', user?.email, 'ID:', user?.id);

    // Vérifier le rôle de l'utilisateur
    const checkUserRole = async () => {
      console.log('Vérification du rôle pour l\'utilisateur:', user?.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      console.log('Résultat de la vérification du rôle:', { data, error });

      if (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        
        // Si l'utilisateur n'a pas de profil, le créer avec le bon rôle
        if (error.code === 'PGRST116') { // Aucune ligne trouvée
          console.log('Aucun profil trouvé, création du profil...');
                         const newRole = 'admin'; // Tous les utilisateurs sont admin
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({ id: user?.id, role: newRole });
          
          if (insertError) {
            console.error('Erreur lors de la création du profil:', insertError);
            setMessage('Erreur lors de la création du profil');
            return;
          }
          
          console.log('Profil créé avec le rôle:', newRole);
          setUserRole(newRole);
          
          // Vérifier les droits d'accès
                     if (newRole === 'admin') {
            loadCards();
          } else {
            setMessage('Accès refusé. Vous devez être administrateur.');
            router.push('/');
          }
          return;
        }
        
        setMessage('Erreur lors de la vérification du rôle');
        router.push('/');
        return;
      }

      const role = data?.role;
      setUserRole(role);
      console.log('Rôle trouvé:', role);

      // Vérifier si l'utilisateur est admin ou formateur_tic@hotmail.com
                 if (role !== 'admin') {
        console.log('Accès refusé - rôle:', role, 'email:', user?.email);
        setMessage('Accès refusé. Vous devez être administrateur.');
        router.push('/');
        return;
      }

      console.log('Accès autorisé, chargement des cartes...');
      // Charger les cartes
      loadCards();
    };

    checkUserRole();
  }, [session, user, router]);

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cartes')
        .select('*')
        .order('title');

      if (error) {
        setMessage('Erreur lors du chargement des cartes: ' + error.message);
      } else {
        setCards(data || []);
      }
    } catch (error) {
      setMessage('Erreur lors du chargement des cartes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!newCard.title || !newCard.category || !newCard.price) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('cartes')
        .insert([{
          title: newCard.title,
          description: newCard.description,
          category: newCard.category,
          price: parseFloat(newCard.price),
          youtube_url: newCard.youtube_url
        }]);

      if (error) {
        setMessage('Erreur lors de l\'ajout de la carte: ' + error.message);
      } else {
        setMessage('Carte ajoutée avec succès !');
        setNewCard({ title: '', description: '', category: '', price: '', youtube_url: '' });
        loadCards();
      }
    } catch (error) {
      setMessage('Erreur lors de l\'ajout de la carte');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cartes')
        .delete()
        .eq('id', cardId);

      if (error) {
        setMessage('Erreur lors de la suppression: ' + error.message);
      } else {
        setMessage('Carte supprimée avec succès !');
        loadCards();
      }
    } catch (error) {
      setMessage('Erreur lors de la suppression');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded shadow">
          <p className="text-blue-900">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

     if (userRole && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded shadow">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-blue-900 mb-4">Vous devez être administrateur pour accéder à cette page.</p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-8 pt-16">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-4">Administration des Cartes</h1>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-blue-900">Connecté en tant que: <strong>{user?.email}</strong></span>
                         <span className="text-green-600 font-bold">Rôle: {userRole === 'admin' ? 'ADMIN' : userRole}</span>
            <button 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Ajouter une nouvelle carte</h2>
          <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Titre *"
              value={newCard.title}
              onChange={(e) => setNewCard({...newCard, title: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Catégorie *"
              value={newCard.category}
              onChange={(e) => setNewCard({...newCard, category: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prix *"
              value={newCard.price}
              onChange={(e) => setNewCard({...newCard, price: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="url"
              placeholder="URL YouTube"
              value={newCard.youtube_url}
              onChange={(e) => setNewCard({...newCard, youtube_url: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Description"
              value={newCard.description}
              onChange={(e) => setNewCard({...newCard, description: e.target.value})}
              className="border rounded px-3 py-2 md:col-span-2"
              rows="3"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 md:col-span-2"
            >
              Ajouter la carte
            </button>
          </form>
        </div>

        {/* Liste des cartes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Cartes existantes</h2>
          {message && (
            <div className={`p-3 rounded mb-4 ${message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          
          {loading ? (
            <p className="text-blue-900">Chargement des cartes...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-blue-900">{card.title}</h3>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{card.category}</span>
                    <span className="font-bold text-blue-900">€{card.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 