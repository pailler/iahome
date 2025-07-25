'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Vérifier si un admin existe déjà
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      console.log('Vérification de l\'existence d\'un admin...');
      
      // Utiliser la fonction RPC pour vérifier les admins
      const { data, error } = await supabase
        .rpc('check_admin_exists');

      if (error) {
        console.error('Erreur lors de la vérification des admins:', error);
        setMessage('Erreur lors de la vérification: ' + error.message);
        return;
      }

      console.log('Résultat de la vérification:', data);

      if (data && data.admin_exists) {
        setAdminExists(true);
        setMessage('Un administrateur existe déjà. Redirection vers la page de connexion...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        console.log('Aucun admin trouvé, création possible');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des admins:', error);
      setMessage('Erreur générale: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      // Créer l'utilisateur
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage('Erreur lors de la création du compte: ' + error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log('Utilisateur créé avec succès, ID:', data.user.id);
        
        // Créer le profil admin avec la nouvelle fonction RPC
        console.log('Tentative de création du profil admin...');
        const { data: insertData, error: profileError } = await supabase
          .rpc('create_admin_profile', {
            user_id: data.user.id,
            user_email: email
          });

        console.log('Résultat de l\'insertion:', { insertData, profileError });

        if (profileError) {
          console.error('Erreur détaillée:', profileError);
          setMessage('Erreur lors de la création du profil admin: ' + profileError.message);
          setIsLoading(false);
          return;
        }

        if (insertData && insertData.error) {
          console.error('Erreur de la fonction RPC:', insertData.error);
          setMessage('Erreur lors de la création du profil admin: ' + insertData.error);
          setIsLoading(false);
          return;
        }

        setMessage('Compte administrateur créé avec succès ! Vérifiez votre email pour confirmer votre compte, puis connectez-vous.');
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      setMessage('Erreur lors de la création du compte: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (adminExists) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 pt-16">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">Configuration terminée</h1>
          <p className="text-gray-600 text-center mb-4">{message}</p>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 pt-16">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">Configuration du premier administrateur</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création en cours...' : 'Créer le compte administrateur'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('succès') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Cette page ne sera accessible qu'une seule fois pour créer le premier administrateur.
          </p>
        </div>
      </div>
    </div>
  );
} 