'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartProvider';

// En-tete de la boutique : retour accueil, titre et acces au panier avec compteur.
export default function ShopHeader() {
  const { count, hydrated } = useCart();

  return (
    <header
      className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-none overflow-hidden border border-white/15">
            <Image
              src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
              alt="LFP"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          {/* Wordmark complet dès sm ; abrégé LFP en dessous (évite le header sur deux lignes) */}
          <span className="hidden sm:block text-white font-display tracking-[0.18em] text-sm md:text-base">LA FORÊT PERFORMANCE</span>
          <span className="sm:hidden text-white font-display tracking-[0.25em] text-base">LFP</span>
        </Link>

        <nav className="flex items-center gap-5 md:gap-8 text-xs uppercase tracking-[0.2em] whitespace-nowrap">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            Le site
          </Link>
          <Link
            href="/shop/panier"
            className="text-gray-400 hover:text-white transition-colors tabular-nums"
          >
            Panier
            {/* Emplacement de largeur fixe : le compteur ne décale plus le reste du menu */}
            <span className="inline-block w-6 text-left">{hydrated && count > 0 ? ` (${count})` : ''}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
