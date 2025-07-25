'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error);
        router.push('/login');
        return;
      }

      if (data.session) {
        console.log('Session trouvée, redirection vers la page d\'accueil');
        router.push('/');
      } else {
        console.log('Pas de session, redirection vers login');
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Confirmation en cours...</h1>
        <p className="text-blue-900">Veuillez patienter pendant que nous confirmons votre compte.</p>
      </div>
    </div>
  );
} 