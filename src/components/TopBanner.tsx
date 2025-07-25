'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function TopBanner() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

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

  useEffect(() => {
    // Charger le rôle de l'utilisateur
    const fetchUserRole = async () => {
      if (session && user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setRole(data.role);
        }
      }
    };
    
    fetchUserRole();
  }, [session, user]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white py-2 px-8 flex items-center justify-between text-sm">
      <div className="font-bold tracking-wide">IAHome</div>
      <div className="flex items-center gap-6">
        <nav className="flex gap-6">
          <a href="/" className="hover:underline">Accueil</a>
          <a href="#" className="hover:underline">À propos</a>
          <a href="#" className="hover:underline">Fonctionnalités</a>
          <a href="#" className="hover:underline">Tarifs</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
        {session && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-blue-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">
              {role === 'admin' ? '👑 Admin connecté' : '👤 Utilisateur connecté'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 