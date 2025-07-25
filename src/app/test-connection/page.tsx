'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function TestConnectionPage() {
  const [status, setStatus] = useState('Test en cours...');
  const [error, setError] = useState('');
  const [tables, setTables] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Test de connexion...');
      
      // Test 1: Vérifier les variables d'environnement
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('URL Supabase:', supabaseUrl);
      console.log('Clé Supabase:', supabaseKey ? 'Présente' : 'Manquante');
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Variables d\'environnement manquantes');
        return;
      }

      // Test 2: Test de connexion simple
      setStatus('Test de la base de données...');
      
      // Test d'abord si la table existe
      const { data: tableTest, error: tableError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('Erreur de base de données:', tableError);
        setError(`Erreur de base de données: ${tableError.message} (Code: ${tableError.code})`);
        return;
      }
      
      console.log('Test de table réussi:', tableTest);

      // Test 3: Lister les tables
      setStatus('Récupération des tables...');
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_tables');

      if (tablesError) {
        // Fallback: essayer une requête simple
        const { data: simpleData, error: simpleError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (simpleError) {
          setError(`Erreur lors de l'accès aux tables: ${simpleError.message}`);
          return;
        }
      } else {
        setTables(tablesData || []);
      }

      setStatus('Connexion réussie !');
      
    } catch (err) {
      console.error('Erreur générale:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Test de Connexion Supabase
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold text-gray-800">Status:</h2>
            <p className="text-gray-600">{status}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded">
              <h2 className="font-semibold text-red-800">Erreur:</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {tables.length > 0 && (
            <div className="p-4 bg-green-100 border border-green-300 rounded">
              <h2 className="font-semibold text-green-800">Tables trouvées:</h2>
              <ul className="text-green-600">
                {tables.map((table, index) => (
                  <li key={index}>• {table}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-blue-100 border border-blue-300 rounded">
            <h2 className="font-semibold text-blue-800">Instructions:</h2>
            <ol className="text-blue-600 list-decimal list-inside space-y-1">
              <li>Vérifiez que votre fichier .env.local contient les bonnes variables</li>
              <li>Exécutez le script test-connection.sql dans Supabase</li>
              <li>Vérifiez que la table users existe</li>
              <li>Si la table n'existe pas, elle sera créée automatiquement</li>
            </ol>
          </div>

          <button
            onClick={testConnection}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Retester la connexion
          </button>
        </div>
      </div>
    </div>
  );
} 