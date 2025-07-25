'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Récupérer la session actuelle
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
    };

    getSession();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    
    console.log('Tentative d\'inscription avec:', email);
    
    // Créer le compte
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    console.log('Résultat signup:', { data, error });
    
    if (error) {
      setMessage(`Erreur lors de l'inscription: ${error.message}`);
    } else {
      setMessage("✅ Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.");
      // Le trigger handle_new_user va automatiquement créer le profil
    }
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 pt-16">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col gap-6 w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">Déjà connecté</h1>
            <p className="text-gray-600">Vous êtes connecté en tant que <b>{user?.email}</b></p>
          </div>
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors" 
              onClick={() => router.push('/')}
            >
              Aller à l'accueil
            </button>
            <button 
              className="flex-1 bg-gray-600 text-white py-3 rounded-md font-semibold hover:bg-gray-700 transition-colors" 
              onClick={async () => { 
                await supabase.auth.signOut(); 
                router.push('/login'); 
              }}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 pt-16">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col gap-6 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez IAHome pour accéder aux outils IA</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            type="submit"
          >
            Créer un compte
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
            onClick={() => router.push('/login')}
          >
            Déjà inscrit ? Se connecter
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('✅')
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          <p>IAHome - Plateforme d'outils IA</p>
        </div>
      </div>
    </div>
  );
} 