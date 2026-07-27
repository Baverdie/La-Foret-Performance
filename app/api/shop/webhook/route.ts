import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  markOrderPaidFromSession,
  cancelOrderFromExpiredSession,
  syncRefundFromStripe,
} from '@/lib/shop/order-confirmation';

export const runtime = 'nodejs';

// POST : point d'entree du webhook Stripe. Verifie la signature sur le corps brut.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await markOrderPaidFromSession(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await cancelOrderFromExpiredSession(event.data.object as Stripe.Checkout.Session);
        break;
      case 'charge.refunded':
        await syncRefundFromStripe(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
