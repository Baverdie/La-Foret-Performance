'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useCart } from '@/components/shop/CartProvider';
import { formatEuros } from '@/lib/shop/format';
import { computeShippingCost } from '@/lib/shop/shipping';

// Contenu du panier (separe pour permettre l'usage de useSearchParams sous Suspense).
function PanierContent() {
  const { items, subtotal, setQuantity, removeLine, hydrated } = useCart();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled') === '1';

  const shipping = computeShippingCost(subtotal);
  const total = subtotal + shipping;

  if (!hydrated) {
    return <div className="py-24 text-center text-white/30">Chargement du panier…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-white/40 mb-6">Votre panier est vide.</p>
        <Link href="/shop" className="inline-block px-8 py-3 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-10">
      {/* Lignes */}
      <div className="lg:col-span-2 space-y-4">
        {canceled && (
          <div className="rounded-none border border-yellow-500/30 bg-yellow-500/5 p-4 text-yellow-200/80 text-sm">
            Paiement annulé. Votre panier a été conservé.
          </div>
        )}
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? 'base'}`}
            className="flex gap-4 rounded-none border border-white/10 bg-[#141414] p-4"
          >
            <div className="relative w-20 h-20 rounded-none overflow-hidden bg-black/40 shrink-0">
              {item.image && (
                <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/shop/${item.slug}`} className="text-white text-sm font-medium hover:text-lfp-amber transition-colors">
                {item.name}
              </Link>
              {item.variantLabel && <p className="text-white/40 text-xs mt-0.5">{item.variantLabel}</p>}
              <p className="text-white/60 text-sm mt-1">{formatEuros(item.unitPrice)}</p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-white/15 rounded-none">
                  <button
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="px-3 py-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                    aria-label="Diminuer"
                  >
                    −
                  </button>
                  <span className="px-3 text-white text-sm tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="px-3 py-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeLine(item.productId, item.variantId)}
                  className="text-white/30 hover:text-red-400 text-xs transition-colors cursor-pointer"
                >
                  Retirer
                </button>
              </div>
            </div>
            <div className="text-white text-sm font-semibold whitespace-nowrap">
              {formatEuros(item.unitPrice * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Recapitulatif */}
      <div className="lg:col-span-1">
        <div className="rounded-none border border-white/10 bg-[#141414] p-6 sticky top-24">
          <h2 className="text-white font-medium mb-4">Récapitulatif</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Sous-total</span>
              <span>{formatEuros(subtotal)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Frais de port</span>
              <span>{formatEuros(shipping)}</span>
            </div>
            <div className="flex justify-between text-white font-semibold pt-3 border-t border-white/10">
              <span>Total</span>
              <span>{formatEuros(total)}</span>
            </div>
          </div>
          <Link
            href="/shop/checkout"
            className="mt-6 block text-center px-6 py-3.5 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all"
          >
            Passer commande
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-white/40 hover:text-white text-xs transition-colors">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}

// Page panier.
export default function PanierPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-white mb-8">Votre panier</h1>
      <Suspense fallback={<div className="py-24 text-center text-white/30">Chargement…</div>}>
        <PanierContent />
      </Suspense>
    </main>
  );
}
