import { getStripe } from '@/lib/stripe';

// Rembourse intégralement le paiement d'une commande via l'API Stripe.
// Paramètres : paymentIntentId (identifiant du paiement Stripe), orderNumber (traçabilité).
// Sortie : identifiant du remboursement Stripe créé.
// Lève une erreur si Stripe refuse (déjà remboursé, paiement introuvable…) — l'appelant
// ne doit PAS changer le statut de la commande dans ce cas.
export async function refundOrderPayment(
  paymentIntentId: string,
  orderNumber: string
): Promise<string> {
  const refund = await getStripe().refunds.create({
    payment_intent: paymentIntentId,
    metadata: { orderNumber },
  });
  return refund.id;
}
