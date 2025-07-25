'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function DebugPage() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Récupérer la session actuelle
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Session actuelle (debug):', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user || null);
    };

    getSession();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Changement d\'état d\'auth (debug):', event, session);
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      const info = {
        session: !!session,
        user: !!user,
        userEmail: user?.email,
        userId: user?.id,
        sessionData: session,
        userData: user,
        timestamp: new Date().toISOString()
      };

      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            info.userProfileError = error;
          } else {
            info.userProfile = data;
            setUserRole(data.role);
          }
        } catch (err) {
          info.userProfileError = err;
        }
      }

      setDebugInfo(info);
    };

    fetchDebugInfo();
  }, [session, user]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 pt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Page de Debug - IAHome</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* État de l'authentification */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">État de l'authentification</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${session ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Session active:</span>
                <span className={session ? 'text-green-600' : 'text-red-600'}>
                  {session ? 'Oui' : 'Non'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Utilisateur connecté:</span>
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? 'Oui' : 'Non'}
                </span>
              </div>
              
              {user && (
                <>
                  <div className="border-t pt-3">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Rôle:</strong> <span className="font-bold text-blue-600">{userRole || 'Chargement...'}</span></p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                🔄 Recharger la page
              </button>
              
              {session && (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  🚪 Se déconnecter
                </button>
              )}
              
              <a
                href="/"
                className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
              >
                🏠 Retour à l'accueil
              </a>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations détaillées</h2>
          
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm text-gray-800">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        {/* Variables d'environnement */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
          
          <div className="space-y-2">
            <p><strong>URL Supabase:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante'}</p>
            <p><strong>Clé Supabase:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante'}</p>
            <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 