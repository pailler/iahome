'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

interface AuthGuardProps {
  children: React.ReactNode;
  moduleName?: string;
  requireSubscription?: boolean;
}

export default function AuthGuard({ children, moduleName, requireSubscription = true }: AuthGuardProps) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user && moduleName && requireSubscription) {
          await checkSubscription(currentSession.user.id, moduleName);
        } else if (currentSession?.user) {
          setHasSubscription(true);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user && moduleName && requireSubscription) {
          await checkSubscription(session.user.id, moduleName);
        } else if (session?.user) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [moduleName, requireSubscription]);

  const checkSubscription = async (userId: string, module: string) => {
    setCheckingSubscription(true);
    try {
      const response = await fetch(`/api/check-subscription?module=${module}&userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.hasActiveSubscription);
      } else {
        setHasSubscription(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
      setHasSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  // Affichage de chargement
  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Pas d'authentification
  if (!session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès protégé</h2>
            <p className="text-gray-600">Vous devez être connecté pour accéder à ce module.</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
            
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pas d'abonnement requis ou abonnement valide
  if (!requireSubscription || hasSubscription) {
    return <>{children}</>;
  }

  // Pas d'abonnement actif
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Abonnement requis</h2>
          <p className="text-gray-600">
            Vous devez avoir un abonnement actif pour accéder au module {moduleName}.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/card/${moduleName}`)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voir le module
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
} 