'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../utils/supabaseClient';
import StripeCheckout from '../../components/StripeCheckout';

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

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
    if (user) {
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setRole(data.role);
        });
    }
  }, [user]);

  useEffect(() => {
    // Vérifier le statut du paiement depuis les paramètres URL
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success) {
      setPaymentStatus('success');
      // Vider les cartes après un paiement réussi
      localStorage.removeItem('selectedCards');
      setCards([]);
    } else if (canceled) {
      setPaymentStatus('canceled');
    }
  }, [searchParams]);

  useEffect(() => {
    // Récupérer les cartes sélectionnées depuis le localStorage
    const saved = localStorage.getItem('selectedCards');
    console.log('localStorage selectedCards:', saved);
    
    if (saved) {
      try {
        const selectedCards = JSON.parse(saved);
        console.log('Cartes sélectionnées:', selectedCards);
        setCards(selectedCards);
      } catch (error) {
        console.error('Erreur parsing localStorage:', error);
        setCards([]);
      }
    } else {
      console.log('Aucune carte dans localStorage');
      setCards([]);
    }
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-blue-50 py-12 pt-16">
        <div className="bg-white p-8 rounded shadow flex flex-col gap-4 w-full max-w-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="text-blue-900 font-bold">Visiteur</div>
              <div className="text-xs text-gray-600">Non connecté</div>
            </div>
            <div className="flex gap-2">
              <button className="text-blue-900 font-medium px-4 py-2 rounded hover:bg-blue-100 border border-blue-200" onClick={() => router.push('/login')}>Se connecter</button>
              <button className="text-blue-900 font-medium px-4 py-2 rounded hover:bg-blue-100 border border-blue-200" onClick={() => router.push('/')}>Retour à l'accueil</button>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded shadow w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Mes abonnements</h2>
          
          {/* Affichage du statut de paiement */}
          {paymentStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✅ Paiement réussi ! Vos abonnements ont été confirmés.
            </div>
          )}
          
          {paymentStatus === 'canceled' && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              ⚠️ Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
            </div>
          )}
          
          {cards.length === 0 ? (
            <div className="text-blue-900/70">Aucune carte sélectionnée pour le moment.</div>
          ) : (
            <>
              <ul className="space-y-4 mb-6">
                {cards.map((card, idx) => (
                  <li key={idx} className="border border-blue-100 rounded-lg p-4 flex flex-col gap-1 bg-blue-50">
                    <div className="font-semibold text-blue-900">{card.title || 'Carte sans titre'}</div>
                    {card.description && <div className="text-blue-900/80 text-sm">{card.description}</div>}
                    {card.category && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded w-fit mb-1">{card.category}</span>}
                    {card.price && <div className="text-blue-900 font-bold">Prix : {card.price} €</div>}
                  </li>
                ))}
              </ul>
              
              {/* Total des abonnements */}
              <div className="border-t border-blue-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-blue-900">Total des abonnements :</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {cards.reduce((total, card) => total + (card.price || 0), 0)} €
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-blue-900/70 mb-4">
                  <span>{cards.length} abonnement{cards.length > 1 ? 's' : ''}</span>
                  <span>Prix total</span>
                </div>
                <div className="flex gap-3">
                  {session ? (
                    <StripeCheckout
                      items={cards}
                      customerEmail={user?.email}
                      onSuccess={() => {
                        setPaymentStatus('success');
                        localStorage.removeItem('selectedCards');
                        setCards([]);
                      }}
                      onError={(error) => {
                        alert(`Erreur de paiement: ${error}`);
                      }}
                    />
                  ) : (
                    <button
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      onClick={() => router.push('/login')}
                    >
                      Se connecter pour payer
                    </button>
                  )}
                  <button
                    className="px-4 py-3 text-blue-900 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                    onClick={() => router.push('/')}
                  >
                    Continuer
                  </button>
                  <button
                    className="px-4 py-3 text-red-600 font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      localStorage.removeItem('selectedCards');
                      setCards([]);
                      alert('Abonnements vidés !');
                    }}
                  >
                    Vider mes abonnements
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 py-12">
      <div className="bg-white p-8 rounded shadow flex flex-col gap-4 w-full max-w-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-blue-900 font-bold">{user?.email}</div>
            <div className="text-xs text-gray-600">ID: {user?.id}</div>
            <div className="text-xs text-green-700 font-bold">{role === 'admin' ? 'ADMIN' : role || 'USER'}</div>
          </div>
          <button className="text-blue-900 font-medium px-4 py-2 rounded hover:bg-blue-100 border border-blue-200" onClick={() => router.push('/')}>Retour à l'accueil</button>
        </div>
      </div>
      <div className="bg-white p-8 rounded shadow w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Mes abonnements</h2>
        {cards.length === 0 ? (
          <div className="text-blue-900/70">Aucune carte sélectionnée pour le moment.</div>
        ) : (
          <>
            <ul className="space-y-4 mb-6">
              {cards.map((card, idx) => (
                <li key={idx} className="border border-blue-100 rounded-lg p-4 flex flex-col gap-1 bg-blue-50">
                  <div className="font-semibold text-blue-900">{card.title || 'Carte sans titre'}</div>
                  {card.description && <div className="text-blue-900/80 text-sm">{card.description}</div>}
                  {card.category && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded w-fit mb-1">{card.category}</span>}
                  {card.price && <div className="text-blue-900 font-bold">Prix : {card.price} €</div>}
                </li>
              ))}
            </ul>
            
            {/* Total des abonnements */}
            <div className="border-t border-blue-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-blue-900">Total des abonnements :</span>
                <span className="text-2xl font-bold text-blue-900">
                  {cards.reduce((total, card) => total + (card.price || 0), 0)} €
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-blue-900/70 mb-4">
                <span>{cards.length} abonnement{cards.length > 1 ? 's' : ''}</span>
                <span>Prix total</span>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    if (!session) {
                      router.push('/login');
                    } else {
                      alert('Abonnements confirmés !');
                    }
                  }}
                >
                  Confirmer mes abonnements
                </button>
                <button
                  className="px-4 py-3 text-blue-900 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  onClick={() => router.push('/')}
                >
                  Continuer
                </button>
                <button
                  className="px-4 py-3 text-red-600 font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    localStorage.removeItem('selectedCards');
                    setCards([]);
                    alert('Abonnements vidés !');
                  }}
                >
                  Vider mes abonnements
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 