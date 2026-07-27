import { getStripe } from '@/lib/stripe';
import { markOrderPaidFromSession } from '@/lib/shop/order-confirmation';
import SuccessClient from '@/components/shop/SuccessClient';

// Filet de sécurité : confirme la commande dès l'arrivée sur la page de succès sans
// attendre le webhook (utile si celui-ci est bloqué ou en retard). Idempotent : si le
// webhook est déjà passé, la commande n'est plus PENDING et rien n'est refait.
// Paramètre : sessionId (identifiant de session Stripe Checkout issu de l'URL de retour).
async function confirmFromSessionId(sessionId: string): Promise<void> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await markOrderPaidFromSession(session);
    }
  } catch (error) {
    console.error('Error confirming checkout session:', error);
  }
}

// Page de confirmation après paiement : vérifie la session côté serveur puis affiche le merci.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (sessionId) {
    await confirmFromSessionId(sessionId);
  }
  return <SuccessClient />;
}
