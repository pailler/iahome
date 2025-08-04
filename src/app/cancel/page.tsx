'use client';

import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ❌ Paiement Annulé
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.
            </p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              🛒 Voir les modules
            </Link>
            
            <Link 
              href="/"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors ml-4"
            >
              🏠 Retour à l'accueil
            </Link>
          </div>

          <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Besoin d'aide ?</h3>
            <p className="text-sm text-yellow-700">
              Si vous rencontrez des problèmes avec le paiement, 
              n'hésitez pas à nous contacter pour obtenir de l'aide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 