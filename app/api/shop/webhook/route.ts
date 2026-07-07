import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { sendOrderConfirmationEmail, sendNewOrderAdminNotification } from '@/lib/email';

export const runtime = 'nodejs';

// Marque une commande comme payee (idempotent) puis envoie les emails de confirmation.
// Parametre: session (session Stripe Checkout completee).
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  // Idempotence : on ne traite que les commandes encore en attente.
  if (!order || order.status !== 'PENDING') return;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', stripePaymentIntentId: paymentIntentId },
    include: { items: true },
  });

  // Emails non bloquants : un echec d'envoi ne doit pas faire echouer le webhook.
  try {
    await sendOrderConfirmationEmail(updated);
    await sendNewOrderAdminNotification(updated);
  } catch (emailError) {
    console.error('Error sending order emails:', emailError);
  }
}

// Annule une commande dont la session de paiement a expire (si toujours en attente).
async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'PENDING') return;

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
}

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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
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
