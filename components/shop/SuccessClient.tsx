'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/shop/CartProvider';

// Ecran de remerciement apres paiement reussi. Vide le panier local au montage.
export default function SuccessClient() {
  const { clear } = useCart();

  // Le paiement etant confirme par Stripe, on vide le panier local.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 py-24 text-center">
      <div className="w-16 h-16 mx-auto rounded-none bg-lfp-amber/15 border border-lfp-amber/40 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-lfp-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-display tracking-wider uppercase text-white">Merci pour ta commande !</h1>
      <p className="text-white/50 text-sm mt-4 leading-relaxed">
        Ton paiement a bien été reçu. Un email de confirmation vient de t'être envoyé avec le récapitulatif de ta
        commande et un lien pour la suivre. On te préviendra dès qu'elle sera expédiée.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/shop" className="px-8 py-3 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all">
          Retour à la boutique
        </Link>
        <Link href="/" className="px-8 py-3 rounded-none border border-white/15 text-white/70 font-semibold text-sm hover:border-white/40 hover:text-white transition-all">
          Accueil
        </Link>
      </div>
    </main>
  );
}
