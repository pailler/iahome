'use client';
import { useEffect, useState } from "react";
import { validateAccessToken, hasPermission } from "../../../utils/accessToken";
import { useParams, useSearchParams } from "next/navigation";

export default function AccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Récupérer le token depuis les paramètres de query
  const token = searchParams.get('token') || params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessData, setAccessData] = useState<any>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        console.log('🔍 [PAGE] Début validation token:', token);
        console.log('🔍 [PAGE] Params token:', params.token);
        console.log('🔍 [PAGE] Search params token:', searchParams.get('token'));
        setLoading(true);
        
        if (!token) {
          console.log('❌ [PAGE] Token manquant');
          setError('Token d\'accès manquant');
          return;
        }

        console.log('🔍 [PAGE] Appel validateAccessToken...');
        
        // Valider le token de manière asynchrone
        const tokenData = await validateAccessToken(token);
        
        console.log('🔍 [PAGE] Résultat validateAccessToken:', tokenData);
        
        if (!tokenData) {
          console.log('❌ [PAGE] Token invalide ou expiré');
          setError('Token d\'accès invalide ou expiré');
          return;
        }

        console.log('🔍 [PAGE] Vérification permissions...');
        
        // Vérifier les permissions si nécessaire
        if (!hasPermission(tokenData, 'access')) {
          console.log('❌ [PAGE] Permissions insuffisantes');
          setError('Permissions insuffisantes');
          return;
        }

        console.log('✅ [PAGE] Accès validé avec succès!');
        setAccessData(tokenData);
        console.log('✅ Accès validé pour:', tokenData);

        // Rediriger vers le module après un court délai
        setTimeout(() => {
          const moduleUrls: { [key: string]: string } = {
            'IAmetube': 'https://metube.regispailler.fr',
            'IAphoto': 'https://iaphoto.regispailler.fr',
            'IAvideo': 'https://iavideo.regispailler.fr',
            'test-module': 'https://test.example.com', // URL de test
            'Google': 'https://www.google.com', // Ajout de Google
            'iatube': 'https://www.google.com', // Ajout de iatube (redirige vers Google)
          };

          const targetUrl = moduleUrls[tokenData.moduleName];
          if (targetUrl) {
            console.log('🔍 [PAGE] Redirection vers:', targetUrl);
            // Ouvrir dans un nouvel onglet avec le token
            window.open(`${targetUrl}?token=${token}`, '_blank');
          }
        }, 2000);

      } catch (error) {
        console.error('❌ [PAGE] Erreur validation token:', error);
        setError('Erreur lors de la validation du token');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, params.token, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validation de l'accès...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (accessData) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Accès autorisé</h2>
          <p className="text-gray-600 mb-4">
            Redirection vers {accessData.moduleName}...
          </p>
          <div className="animate-pulse">
            <div className="text-sm text-gray-500">
              Expire le: {accessData.expiresAt.toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 