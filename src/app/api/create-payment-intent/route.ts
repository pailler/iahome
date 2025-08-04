import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug - API create-payment-intent appelée');
    
    // Vérifier la clé Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ Erreur - STRIPE_SECRET_KEY manquante');
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    console.log('🔍 Debug - STRIPE_SECRET_KEY existe:', !!process.env.STRIPE_SECRET_KEY);
    console.log('🔍 Debug - STRIPE_SECRET_KEY commence par:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));

    // Initialiser Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
    
    const body = await request.json();
    const { items, customerEmail, type } = body;

    console.log('🔍 Debug - Création session Stripe:', { items, customerEmail, type });
    console.log('🔍 Debug - Body complet:', body);

    if (!customerEmail) {
      console.error('❌ Erreur - Email client manquant');
      return NextResponse.json(
        { error: 'Email client requis' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      console.error('❌ Erreur - Items manquants');
      return NextResponse.json(
        { error: 'Items requis' },
        { status: 400 }
      );
    }

    // Fonction pour extraire le prix numérique d'une chaîne
    const extractPrice = (priceString: string): number => {
      if (typeof priceString === 'number') return priceString;
      if (!priceString) return 0;
      
      // Chercher un nombre avec décimales (ex: 9.99, 19.99)
      const priceMatch = priceString.match(/(\d+\.?\d*)/);
      if (priceMatch) {
        return parseFloat(priceMatch[1]);
      }
      
      // Chercher un nombre entier
      const intMatch = priceString.match(/(\d+)/);
      if (intMatch) {
        return parseInt(intMatch[1]);
      }
      
      return 0;
    };

    // Calculer le montant total à partir des items
    const totalAmount = items.reduce((total: number, item: any) => {
      const itemPrice = extractPrice(item.price);
      console.log(`🔍 Debug - Prix extrait pour ${item.title}: "${item.price}" -> ${itemPrice}`);
      return total + itemPrice;
    }, 0);
    
    if (totalAmount <= 0) {
      console.error('❌ Erreur - Montant total invalide:', totalAmount);
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      );
    }

    console.log('🔍 Debug - Validation OK, création session...');
    console.log('🔍 Debug - Montant total:', totalAmount);
    console.log('🔍 Debug - Items:', items.map(item => ({ title: item.title, price: item.price })));

    // Vérifier l'URL de l'application
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8021';
    console.log('🔍 Debug - URL de l\'application:', appUrl);

    // Préparer les métadonnées limitées (max 500 caractères)
    const limitedItems = items.map((item: any) => ({
      id: item.id,
      title: item.title?.substring(0, 50) || 'Module IA', // Limiter le titre
      price: item.price || 0
    }));

    const metadata = {
      customer_email: customerEmail,
      items_count: items.length.toString(),
      total_amount: totalAmount.toString(),
      type: type || 'payment',
      // Stocker seulement les IDs des items pour éviter de dépasser la limite
      items_ids: items.map((item: any) => item.id).join(',')
    };

    console.log('🔍 Debug - Métadonnées:', metadata);

    // Créer une session de paiement avec les métadonnées limitées
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => {
        const itemPrice = extractPrice(item.price);
        console.log(`🔍 Debug - Prix pour Stripe ${item.title}: ${itemPrice}€ -> ${Math.round(itemPrice * 100)} centimes`);
        
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.title || 'Module IA',
              description: item.description?.substring(0, 100) || 'Module d\'intelligence artificielle',
            },
            unit_amount: Math.round(itemPrice * 100), // Convertir en centimes
          },
          quantity: 1,
        };
      }),
      mode: type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${appUrl}/success?success=true`,
      cancel_url: `${appUrl}/cancel?canceled=true`,
      customer_email: customerEmail,
      metadata: metadata,
    });

    console.log('🔍 Debug - Session créée:', session.id);
    console.log('🔍 Debug - URL session:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    
    // Log plus détaillé de l'erreur
    if (error instanceof Error) {
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack trace:', error.stack);
    }
    
    // Vérifier si c'est une erreur Stripe
    if (error && typeof error === 'object' && 'type' in error) {
      console.error('❌ Type d\'erreur Stripe:', (error as any).type);
      console.error('❌ Code d\'erreur Stripe:', (error as any).code);
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la session',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 