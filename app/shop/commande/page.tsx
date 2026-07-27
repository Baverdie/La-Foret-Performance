'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatEuros } from '@/lib/shop/format';
import type { PublicOrderView } from '@/lib/shop/order-lookup';

// Etapes du cycle de vie normal d'une commande, dans l'ordre d'affichage de la timeline.
const TIMELINE_STEPS: { key: keyof PublicOrderView; label: string }[] = [
  { key: 'createdAt', label: 'Commandée' },
  { key: 'paidAt', label: 'Payée' },
  { key: 'productionStartedAt', label: 'En production' },
  { key: 'shippedAt', label: 'Expédiée' },
  { key: 'deliveredAt', label: 'Livrée' },
];

// Formate une date ISO en date française courte (ex. 9 juillet 2026).
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Timeline verticale des etapes de la commande : etapes franchies en blanc,
// etape courante soulignee a l'ambre, etapes a venir en gris. Le cycle est desormais
// strictement sequentiel, mais l'etape courante reste la DERNIERE etape datee (et non
// la n-ieme) par robustesse envers d'anciennes commandes aux etapes sautees.
function OrderTimeline({ order }: { order: PublicOrderView }) {
  const lastReachedIndex = TIMELINE_STEPS.reduce(
    (last, step, index) => (order[step.key] ? index : last),
    -1
  );

  return (
    <ol className="space-y-0">
      {TIMELINE_STEPS.map((step, index) => {
        const date = order[step.key] as string | null;
        const isDone = Boolean(date);
        const isCurrent = index === lastReachedIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;
        return (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`w-3 h-3 rounded-full border ${
                  isCurrent
                    ? 'bg-lfp-amber border-lfp-amber'
                    : isDone
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/25'
                }`}
              />
              {!isLast && <span className={`w-px flex-1 min-h-8 ${index < lastReachedIndex ? 'bg-white/60' : 'bg-white/15'}`} />}
            </div>
            <div className="pb-6 -mt-0.5">
              <p
                className={`text-sm uppercase tracking-[0.2em] ${
                  isCurrent ? 'text-lfp-amber' : isDone ? 'text-white' : 'text-white/30'
                }`}
              >
                {step.label}
              </p>
              {date && <p className="text-white/40 text-xs mt-1">{formatDate(date)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Détail complet d'une commande retrouvée : timeline ou bandeau terminal,
// suivi colis, articles, totaux, adresse et demande d'annulation.
function OrderResult({
  order,
  onCancelRequest,
  cancelPending,
}: {
  order: PublicOrderView;
  onCancelRequest: () => void;
  cancelPending: boolean;
}) {
  const isTerminated = order.status === 'CANCELLED' || order.status === 'REFUNDED';

  return (
    <div className="mt-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-white/10 pb-4">
        <h2 className="text-white font-display uppercase tracking-wider text-xl">{order.orderNumber}</h2>
        <p className="text-white/40 text-xs">Commandée le {formatDate(order.createdAt)}</p>
      </div>

      {isTerminated ? (
        <div className="rounded-none border border-white/15 bg-[#141414] p-5">
          <p className="text-white text-sm uppercase tracking-[0.2em]">
            {order.status === 'CANCELLED' ? 'Commande annulée' : 'Commande remboursée'}
          </p>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            {order.status === 'CANCELLED'
              ? `Cette commande a été annulée le ${formatDate(order.cancelledAt!)}. Si un paiement avait été effectué, il a été intégralement remboursé.`
              : `Cette commande a été remboursée le ${formatDate(order.refundedAt!)} à hauteur de ${formatEuros(order.total)}. Le montant apparaît sous 5 à 10 jours ouvrés.`}
          </p>
        </div>
      ) : (
        <OrderTimeline order={order} />
      )}

      {order.trackingNumber && (
        <div className="rounded-none border border-white/10 border-l-2 border-l-lfp-amber bg-[#141414] p-5">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] mb-2">Numéro de suivi</p>
          <p className="text-white text-base tracking-wider">{order.trackingNumber}</p>
          <a
            href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-lfp-amber text-xs underline underline-offset-4 hover:text-white transition-colors"
          >
            Suivre le colis sur laposte.fr
          </a>
        </div>
      )}

      <div>
        <h3 className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">Articles</h3>
        <div className="space-y-2 text-sm">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-3">
              <span className="text-white/60">
                {item.productName}
                {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
              </span>
              <span className="text-white/80 whitespace-nowrap">{formatEuros(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm pt-4 mt-4 border-t border-white/10">
          <div className="flex justify-between text-white/60">
            <span>Sous-total</span>
            <span>{formatEuros(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Frais de port</span>
            <span>{formatEuros(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Frais de traitement</span>
            <span>{formatEuros(order.processingFee)}</span>
          </div>
          <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
            <span>Total</span>
            <span>{formatEuros(order.total)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white/60 text-xs uppercase tracking-[0.3em] mb-3">Livraison</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {order.shipping.firstName} {order.shipping.lastName}
          <br />
          {order.shipping.addressLine1}
          {order.shipping.addressLine2 && (
            <>
              <br />
              {order.shipping.addressLine2}
            </>
          )}
          <br />
          {order.shipping.postalCode} {order.shipping.city}, {order.shipping.country}
        </p>
      </div>

      {order.cancelRequestedAt && (
        <div className="rounded-none border border-lfp-amber/30 bg-lfp-amber/5 p-4">
          <p className="text-lfp-amber text-sm">
            Demande d'annulation envoyée le {formatDate(order.cancelRequestedAt)} — on la traite au plus vite.
          </p>
        </div>
      )}

      {order.canRequestCancel && (
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/40 text-xs leading-relaxed mb-3">
            Ta commande n'est pas encore partie en production : tu peux encore demander son annulation. Elle sera
            annulée et intégralement remboursée après validation.
          </p>
          <button
            type="button"
            onClick={onCancelRequest}
            disabled={cancelPending}
            className="px-6 py-3 rounded-none border border-white/15 text-white/70 text-sm font-semibold hover:border-white/40 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelPending ? 'Envoi…' : "Demander l'annulation"}
          </button>
        </div>
      )}
    </div>
  );
}

// Contenu de la page de suivi : formulaire numero + email, pre-rempli et auto-soumis
// via les parametres d'URL (liens des emails), puis affichage du detail de commande.
function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('numero') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [order, setOrder] = useState<PublicOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  // Interroge l'API de lookup et met a jour l'affichage.
  const lookup = useCallback(async (number: string, mail: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shop/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: number, email: mail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOrder(null);
        setError(data.error || 'Erreur lors de la recherche');
      } else {
        setOrder(data.order);
      }
    } catch {
      setOrder(null);
      setError('Erreur réseau — réessaie dans un instant');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-lookup a l'arrivee via un lien d'email (les deux parametres presents).
  useEffect(() => {
    const numero = searchParams.get('numero');
    const mail = searchParams.get('email');
    if (numero && mail) {
      lookup(numero, mail);
    }
  }, [searchParams, lookup]);

  // Envoie la demande d'annulation puis rafraichit la vue de la commande.
  const requestCancel = useCallback(async () => {
    if (!order) return;
    setCancelPending(true);
    setError(null);
    try {
      const response = await fetch('/api/shop/orders/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.orderNumber, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erreur lors de la demande');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('Erreur réseau — réessaie dans un instant');
    } finally {
      setCancelPending(false);
    }
  }, [order, email]);

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <h1 className="text-3xl md:text-4xl font-display tracking-wider uppercase text-white">Suivre ma commande</h1>
      <p className="text-white/50 text-sm mt-3 leading-relaxed">
        Entre ton numéro de commande (dans ton email de confirmation) et l'email utilisé lors de l'achat.
      </p>

      <form
        className="mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          lookup(orderNumber, email);
        }}
      >
        <div>
          <label htmlFor="orderNumber" className="block text-gray-400 text-xs mb-1.5">
            Numéro de commande <span className="text-lfp-amber">*</span>
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="LFP-2026-0001"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-white text-sm focus:border-lfp-amber focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="lookupEmail" className="block text-gray-400 text-xs mb-1.5">
            Email <span className="text-lfp-amber">*</span>
          </label>
          <input
            id="lookupEmail"
            name="lookupEmail"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ton@email.fr"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-white text-sm focus:border-lfp-amber focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-none border border-red-500/30 bg-red-500/5 p-4 text-red-300 text-sm">{error}</div>
      )}

      {order && <OrderResult order={order} onCancelRequest={requestCancel} cancelPending={cancelPending} />}
    </main>
  );
}

// Page « Suivre ma commande » (useSearchParams impose une frontiere Suspense).
export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
