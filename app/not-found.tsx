import Link from 'next/link';
import Image from 'next/image';
import { SHOP_ENABLED } from '@/lib/shop/flags';

// Page 404 globale : reprend la DA du site (fond sombre, lockup hairlines, angles droits,
// ambre en signal rare). Propose un retour vers l'accueil et la boutique.
export default function NotFound() {
  return (
    <main className="min-h-screen bg-lfp-gray flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-3 mb-10">
        <div className="relative w-9 h-9 rounded-none overflow-hidden border border-white/15">
          <Image
            src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
            alt="LFP"
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <span className="flex items-center gap-2.5 text-white font-landasans tracking-[0.25em] text-base">
          <span className="inline-block h-px w-6 bg-white/40" />
          LFP
          <span className="inline-block h-px w-6 bg-white/40" />
        </span>
      </div>

      <p className="font-display text-7xl md:text-8xl tracking-wider text-white">
        4<span className="text-lfp-amber">0</span>4
      </p>
      <p className="mt-4 text-white/50 text-sm uppercase tracking-[0.3em]">Page introuvable</p>
      <p className="mt-6 text-white/60 text-sm leading-relaxed max-w-md">
        La page que tu cherches n'existe pas ou a été déplacée. Reprends la route par ici.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-8 py-3 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all"
        >
          Retour à l'accueil
        </Link>
        {SHOP_ENABLED && (
          <Link
            href="/shop"
            className="px-8 py-3 rounded-none border border-white/15 text-white/70 font-semibold text-sm hover:border-white/40 hover:text-white transition-all"
          >
            La boutique
          </Link>
        )}
      </div>
    </main>
  );
}
