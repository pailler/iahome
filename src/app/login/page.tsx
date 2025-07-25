'use client';
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession, useUser } from '@supabase/auth-helpers-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const session = useSession();
  const user = useUser();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    
    if (isRegister) {
      console.log('Tentative d\'inscription avec:', email);
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
    } else {
      console.log('Tentative de connexion avec:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Résultat signin:', { data, error });
      
      if (error) {
        console.error('Erreur de connexion:', error);
        
        // Messages d'erreur plus clairs
        if (error.message.includes('Invalid login credentials')) {
          setMessage('❌ Email ou mot de passe incorrect. Vérifiez vos identifiants.');
        } else if (error.message.includes('Email not confirmed')) {
          setMessage('⚠️ Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.');
        } else {
          setMessage(`❌ Erreur de connexion: ${error.message}`);
        }
      } else {
        console.log('Connexion réussie, utilisateur:', data.user);
        console.log('Session créée:', !!data.session);
        
        // Vérifier si le profil existe
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Erreur lors de la vérification du profil:', profileError);
          setMessage('⚠️ Connexion réussie mais problème avec le profil utilisateur.');
        } else {
          console.log('Profil trouvé avec le rôle:', profileData.role);
          setMessage(`✅ Connexion réussie ! Rôle: ${profileData.role}`);
        }
        
        // Rediriger vers la page d'accueil
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded shadow flex flex-col gap-4 w-full max-w-sm">
          <div className="text-blue-900 mb-2">Connecté en tant que <b>{user?.email}</b></div>
          <button className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 pt-16">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col gap-6 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            {isRegister ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="text-gray-600">
            {isRegister ? "Rejoignez IAHome pour accéder aux outils IA" : "Connectez-vous à votre compte IAHome"}
          </p>
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
            {isRegister ? "Créer un compte" : "Se connecter"}
          </button>
        </form>
        
        <div className="text-center">
          <button 
            type="button" 
            className="text-blue-600 hover:text-blue-800 underline text-sm" 
            onClick={() => setIsRegister(r => !r)}
          >
            {isRegister ? "Déjà inscrit ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : message.includes('⚠️')
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
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