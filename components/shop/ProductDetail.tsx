'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { PublicProduct, PublicVariant } from '@/lib/data';
import { formatEuros, CATEGORY_LABELS } from '@/lib/shop/format';
import { useCart } from './CartProvider';

// Formate une date ISO en date courte française.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Valeurs uniques non vides d'un axe (couleur ou taille) parmi les variantes.
function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

// Fiche produit : galerie, sélecteurs taille/couleur, détails, ajout au panier.
export default function ProductDetail({ product }: { product: PublicProduct }) {
  const { addLine } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const isPrecommande = product.availabilityMode === 'PRECOMMANDE';

  // Axes de variantes disponibles.
  const colors = useMemo(() => distinct(product.variants.map((v) => v.color)), [product.variants]);
  const sizes = useMemo(() => distinct(product.variants.map((v) => v.size)), [product.variants]);
  const structured = colors.length > 0 || sizes.length > 0;

  // Sélections (modèle structuré couleur/taille, ou repli sur l'id de variante).
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Variante effectivement sélectionnée.
  const selectedVariant: PublicVariant | null = useMemo(() => {
    if (!structured) {
      return product.variants.find((v) => v.id === selectedVariantId) || null;
    }
    return (
      product.variants.find(
        (v) =>
          (colors.length === 0 || v.color === selectedColor) &&
          (sizes.length === 0 || v.size === selectedSize)
      ) || null
    );
  }, [structured, product.variants, selectedVariantId, colors.length, sizes.length, selectedColor, selectedSize]);

  // Une option couleur est épuisée si toutes ses variantes le sont.
  const colorSoldOut = (color: string) =>
    product.variants.filter((v) => v.color === color).every((v) => v.isSoldOut);
  // Une option taille est épuisée si toutes ses variantes (couleur courante prise en compte) le sont.
  const sizeSoldOut = (size: string) =>
    product.variants
      .filter((v) => v.size === size && (colors.length === 0 || !selectedColor || v.color === selectedColor))
      .every((v) => v.isSoldOut);

  const currentPrice = product.basePrice + (selectedVariant?.priceDelta || 0);
  const canAdd = !product.hasVariants || (selectedVariant !== null && !selectedVariant.isSoldOut);

  // Texte du bouton selon l'état de sélection.
  const addLabel = added
    ? '✓ Ajouté au panier'
    : product.hasVariants && !selectedVariant
      ? 'Choisissez une variante'
      : isPrecommande
        ? 'Précommander'
        : 'Ajouter au panier';

  // Ajoute la variante sélectionnée au panier puis affiche un feedback temporaire.
  const handleAdd = () => {
    if (!canAdd) return;
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || null,
      category: product.category,
      variantId: selectedVariant?.id || null,
      variantLabel: selectedVariant?.label || null,
      unitPrice: currentPrice,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  // Style commun d'une pastille de sélection (carrée, direction dure).
  const optionClass = (active: boolean, soldOut: boolean) =>
    `px-4 py-2.5 text-sm border transition-colors cursor-pointer ${
      soldOut
        ? 'border-white/5 text-white/20 line-through cursor-not-allowed'
        : active
          ? 'border-lfp-amber bg-lfp-amber/10 text-white'
          : 'border-white/15 text-white/70 hover:border-white/40'
    }`;

  return (
    <main className="grain-bg max-w-6xl mx-auto px-6 md:px-12 py-8 md:py-12">
      <Link href="/shop" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs uppercase tracking-[0.2em] mb-8 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour au catalogue
      </Link>

      <div className="lg:grid lg:grid-cols-2 lg:gap-14 lg:items-start">
        {/* Galerie — collante au scroll */}
        <div className="lg:sticky lg:top-24">
          {/* Largeur plafonnée par la hauteur d'écran pour qu'un 4:5 tienne en entier */}
          <div
            className="relative aspect-4/5 w-full mx-auto overflow-hidden"
            style={{ maxWidth: 'calc(82vh * 4 / 5)' }}
          >
            {product.images[activeImage] ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20">Pas d'image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`relative w-16 h-16 overflow-hidden border transition-colors cursor-pointer ${
                    activeImage === index ? 'border-lfp-amber' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={image} alt={`${product.name} ${index + 1}`} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos — colonne compacte */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-10 lg:mt-0 max-w-md"
        >
          <p className="text-[11px] text-white/40 uppercase tracking-[0.3em]">
            {CATEGORY_LABELS[product.category] || product.category}
          </p>
          <h1 className="text-3xl md:text-4xl font-display tracking-wide uppercase text-white mt-2">{product.name}</h1>
          <p className="text-2xl text-white font-semibold mt-4">{formatEuros(currentPrice)}</p>

          {isPrecommande && product.campaign && (
            <div className="mt-5 border-l-2 border-lfp-amber pl-4 py-1">
              <p className="text-lfp-amber text-xs font-bold uppercase tracking-[0.2em]">Précommande</p>
              <p className="text-white/60 text-sm mt-1">
                Commande jusqu'au {formatDate(product.campaign.endDate)}. Production lancée à la clôture de la
                campagne « {product.campaign.name} ».
              </p>
            </div>
          )}

          {product.description && (
            <p className="text-gray-400 text-sm leading-relaxed mt-6 whitespace-pre-line">{product.description}</p>
          )}

          {/* Sélecteur couleur */}
          {colors.length > 0 && (
            <div className="mt-8">
              <p className="text-white/60 text-xs uppercase tracking-[0.25em] mb-3">
                Couleur{selectedColor ? <span className="text-white/40"> · {selectedColor}</span> : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const soldOut = colorSoldOut(color);
                  return (
                    <button
                      key={color}
                      disabled={soldOut}
                      onClick={() => setSelectedColor(color)}
                      className={optionClass(selectedColor === color, soldOut)}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sélecteur taille */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-white/60 text-xs uppercase tracking-[0.25em] mb-3">Taille</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const soldOut = sizeSoldOut(size);
                  return (
                    <button
                      key={size}
                      disabled={soldOut}
                      onClick={() => setSelectedSize(size)}
                      className={optionClass(selectedSize === size, soldOut)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sélecteur de repli (anciennes variantes sans couleur/taille structurées) */}
          {product.hasVariants && !structured && (
            <div className="mt-8">
              <p className="text-white/60 text-xs uppercase tracking-[0.25em] mb-3">Variante</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    disabled={variant.isSoldOut}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={optionClass(selectedVariantId === variant.id, variant.isSoldOut)}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ajout au panier */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={`mt-8 w-full md:w-auto px-10 py-4 font-semibold text-sm transition-colors cursor-pointer ${
              canAdd ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {addLabel}
          </button>

          {/* Détails produit — fiche technique */}
          {product.details.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-display">Détails produit</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <dl className="border-t border-b border-white/10 divide-y divide-white/10">
                {product.details.map((line, index) => {
                  const sep = line.indexOf(':');
                  const key = sep > 0 ? line.slice(0, sep).trim() : null;
                  const value = sep > 0 ? line.slice(sep + 1).trim() : line;
                  return key ? (
                    <div key={index} className="flex items-baseline justify-between gap-6 py-3">
                      <dt className="text-white/40 text-xs uppercase tracking-[0.2em]">{key}</dt>
                      <dd className="text-white text-sm text-right">{value}</dd>
                    </div>
                  ) : (
                    <div key={index} className="py-3 text-sm text-white/70">{value}</div>
                  );
                })}
              </dl>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
