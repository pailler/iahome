'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useSession, useUser } from '@supabase/auth-helpers-react';

export default function TestPage() {
  const [testResults, setTestResults] = useState([]);
  const session = useSession();
  const user = useUser();

  const addResult = (message, data = null) => {
    setTestResults(prev => [...prev, { message, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    // Test 1: Vérifier la session
    addResult('Test 1: Vérification de la session');
    addResult(`Session existe: ${!!session}`, session);
    addResult(`Utilisateur: ${user?.email || 'Aucun'}`, user);

    if (!session) {
      addResult('❌ Pas de session - Impossible de continuer les tests');
      return;
    }

    // Test 2: Vérifier le profil
    addResult('Test 2: Vérification du profil');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        addResult(`❌ Erreur profil: ${error.message}`, error);
      } else {
        addResult(`✅ Profil trouvé avec le rôle: ${data.role}`, data);
      }
    } catch (error) {
      addResult(`❌ Exception profil: ${error.message}`, error);
    }

    // Test 3: Vérifier les cartes
    addResult('Test 3: Vérification des cartes');
    try {
      const { data, error } = await supabase
        .from('cartes')
        .select('*')
        .limit(5);
      
      if (error) {
        addResult(`❌ Erreur cartes: ${error.message}`, error);
      } else {
        addResult(`✅ Cartes trouvées: ${data?.length || 0}`, data);
      }
    } catch (error) {
      addResult(`❌ Exception cartes: ${error.message}`, error);
    }

    // Test 4: Vérifier les droits admin
    addResult('Test 4: Vérification des droits admin');
    const isAdmin = user?.email === 'formateur_tic@hotmail.com';
    addResult(`Email admin: ${isAdmin}`, { email: user?.email, isAdmin });
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-4">Page de Test - Diagnostic</h1>
          
          <div className="mb-4">
            <button 
              onClick={runTests}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Lancer les tests
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">État actuel :</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Session:</strong> {session ? '✅ Connecté' : '❌ Non connecté'}</p>
              <p><strong>Email:</strong> {user?.email || 'Aucun'}</p>
              <p><strong>ID:</strong> {user?.id || 'Aucun'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Résultats des tests :</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-600">Cliquez sur "Lancer les tests" pour commencer le diagnostic</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-semibold text-blue-900">{result.message}</div>
                  <div className="text-sm text-gray-600">{result.timestamp}</div>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600">Voir les détails</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 