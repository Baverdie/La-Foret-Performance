'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartProvider';

// Ombre portée des liens, identique à la nav de la landing (lisibilité sur le dégradé).
const NAV_TEXT_SHADOW = { textShadow: '0 1px 8px rgba(0, 0, 0, 0.8)' } as const;

// En-tete de la boutique : lockup LFP, navigation explicite (site, boutique, panier).
// Même recette que la landing : barre pleine sur mobile, dégradé noir → transparent dès md.
export default function ShopHeader() {
  const { count, hydrated } = useCart();

  return (
    <header
      className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 md:bg-transparent md:backdrop-blur-none md:border-b-0"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
    >
      {/* Dégradé façon landing, débordant sous le contenu pour le fondu ; clics traversants */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
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
          {/* Lockup fidèle au logo : ligne — LA FORÊT PERFORMANCE — ligne, en Landasans.
              Les traits sont de vraies hairlines CSS (le letter-spacing écartait les caractères ──).
              Sous sm, seul le carré logo reste : la nav à trois liens prend la place du wordmark. */}
          <span className="hidden md:flex items-center gap-3 text-white font-landasans tracking-[0.18em] text-base">
            <span className="inline-block h-px w-8 bg-white/40" />
            LA FORÊT PERFORMANCE
            <span className="inline-block h-px w-8 bg-white/40" />
          </span>
          <span className="hidden sm:flex md:hidden items-center gap-2.5 text-white font-landasans tracking-[0.25em] text-base">
            <span className="inline-block h-px w-6 bg-white/40" />
            LFP
            <span className="inline-block h-px w-6 bg-white/40" />
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 md:gap-8 text-xs uppercase tracking-[0.2em] whitespace-nowrap">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors" style={NAV_TEXT_SHADOW}>
            Le site
          </Link>
          <Link href="/shop" className="text-gray-400 hover:text-white transition-colors" style={NAV_TEXT_SHADOW}>
            Boutique
          </Link>
          <Link
            href="/shop/panier"
            className="text-gray-400 hover:text-white transition-colors tabular-nums"
            style={NAV_TEXT_SHADOW}
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
