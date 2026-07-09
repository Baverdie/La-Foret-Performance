'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { PublicProduct } from '@/lib/data';
import { formatEuros, CATEGORY_LABELS } from '@/lib/shop/format';

// Carte produit — direction C (éditorial) : image carrée, numéro, légende sous filet, hover scale.
// Parametres: product (produit public), index (numéro + délai d'apparition).
export default function ProductCard({ product, index }: { product: PublicProduct; index: number }) {
  const cover = product.images[0] || null;
  const isPrecommande = product.availabilityMode === 'PRECOMMANDE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="relative aspect-4/5 overflow-hidden bg-[#161616]">
          {cover ? (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
              Pas d'image
            </div>
          )}
          {/* Vignettage : assombrit les bords pour la lisibilité du numéro et du badge */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_70px_rgba(0,0,0,0.5)]" />
          <span className="absolute top-3 left-3 text-xs font-display text-white/80">
            {String(index + 1).padStart(2, '0')}
          </span>
          {isPrecommande && (
            <span className="absolute top-3 right-3 bg-lfp-amber text-black text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
              Précommande
            </span>
          )}
        </div>
        {/* Légende : empilée en mobile (cartes étroites), catégorie/nom + prix en ligne dès sm */}
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 border-t border-white/10 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">
              {CATEGORY_LABELS[product.category] || product.category}
            </p>
            <h3 className="text-sm sm:text-base uppercase tracking-wide text-white mt-1 line-clamp-2">{product.name}</h3>
          </div>
          <span className="text-sm text-white whitespace-nowrap">{formatEuros(product.basePrice)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
