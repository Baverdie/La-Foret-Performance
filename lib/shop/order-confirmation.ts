import type Stripe from 'stripe';
import prisma from '@/lib/prisma';
import {
  sendOrderConfirmationEmail,
  sendNewOrderAdminNotification,
  sendOrderRefundedEmail,
} from '@/lib/email';

// Marque une commande comme payée (idempotent) puis envoie les emails de confirmation.
// Utilisée par le webhook Stripe ET par la page de succès (filet de sécurité si le
// webhook n'est pas joignable ou en retard). Paramètre : session Stripe Checkout payée.
export async function markOrderPaidFromSession(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  // Idempotence : on ne traite que les commandes encore en attente.
  if (!order || order.status !== 'PENDING') return;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', paidAt: new Date(), stripePaymentIntentId: paymentIntentId },
    include: { items: true },
  });

  // Emails non bloquants : un échec d'envoi ne doit pas faire échouer la confirmation.
  try {
    await sendOrderConfirmationEmail(updated);
    await sendNewOrderAdminNotification(updated);
  } catch (emailError) {
    console.error('Error sending order emails:', emailError);
  }
}

// Annule une commande dont la session de paiement a expiré (si toujours en attente).
export async function cancelOrderFromExpiredSession(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'PENDING') return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

// Synchronise un remboursement effectué hors admin (ex. dashboard Stripe) : passe la
// commande en REFUNDED si elle ne l'est pas déjà. Idempotent — les remboursements
// déclenchés depuis l'admin ont déjà changé le statut avant que l'événement n'arrive.
export async function syncRefundFromStripe(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (!order || order.status === 'REFUNDED' || order.status === 'CANCELLED') return;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
      stripeRefundId: charge.refunds?.data?.[0]?.id ?? null,
    },
    include: { items: true },
  });

  try {
    await sendOrderRefundedEmail(updated);
  } catch (emailError) {
    console.error('Error sending refund email:', emailError);
  }
}
