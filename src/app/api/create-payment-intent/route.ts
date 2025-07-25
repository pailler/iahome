import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier si Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe n\'est pas configuré côté serveur' },
        { status: 500 }
      );
    }

    const { amount, items, customerEmail } = await request.json();

    // Vérifier si des articles sont présents
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article fourni' },
        { status: 400 }
      );
    }

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title || 'Article sans titre',
            description: item.description || 'Aucune description',
          },
          unit_amount: Math.round((item.price || 0) * 100), // Stripe utilise les centimes
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/abonnements?success=true`,
      cancel_url: `${request.nextUrl.origin}/abonnements?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        items: JSON.stringify(items.map((item: any) => ({ id: item.id, title: item.title }))),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
} 