'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { PublicProduct, PublicCampaign } from '@/lib/data';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

interface ShopClientProps {
  products: PublicProduct[];
  campaigns: PublicCampaign[];
}

// Formate une date ISO en date courte française (ex. "15 juillet 2026").
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Nombre de jours restants jusqu'à une date ISO (>= 0).
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// Regroupe une catégorie produit en famille de filtre : Textile vs Accessoires (le reste).
function groupOf(category: string): string {
  return category === 'TEXTILE' ? 'TEXTILE' : 'ACCESSOIRES';
}

// Libellés des onglets de filtre.
const FILTER_LABELS: Record<string, string> = {
  ALL: 'Tout',
  PRECOMMANDE: 'Précommande',
  TEXTILE: 'Textile',
  ACCESSOIRES: 'Accessoires',
};

// Page catalogue : banniere de campagne, filtre par categorie et grille de produits.
export default function ShopClient({ products, campaigns }: ShopClientProps) {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Y a-t-il au moins un produit en précommande (pour afficher le filtre dédié) ?
  const hasDrop = useMemo(
    () => products.some((p) => p.availabilityMode === 'PRECOMMANDE'),
    [products]
  );

  // Filtres : Tout, Précommande (si drop), puis les familles présentes (Textile / Accessoires).
  const filters = useMemo(() => {
    const groups = new Set(products.map((product) => groupOf(product.category)));
    const ordered = ['TEXTILE', 'ACCESSOIRES'].filter((group) => groups.has(group));
    return ['ALL', ...(hasDrop ? ['PRECOMMANDE'] : []), ...ordered];
  }, [products, hasDrop]);

  // Liste filtrée puis triée pour faire remonter les produits du drop en premier.
  const filtered = useMemo(() => {
    let list = products;
    if (activeFilter === 'PRECOMMANDE') {
      list = products.filter((p) => p.availabilityMode === 'PRECOMMANDE');
    } else if (activeFilter !== 'ALL') {
      list = products.filter((p) => groupOf(p.category) === activeFilter);
    }
    return [...list].sort(
      (a, b) =>
        (b.availabilityMode === 'PRECOMMANDE' ? 1 : 0) - (a.availabilityMode === 'PRECOMMANDE' ? 1 : 0)
    );
  }, [products, activeFilter]);

  // Libellé d'un filtre.
  const filterLabel = (key: string): string => FILTER_LABELS[key] || key;

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
      {/* En-tete */}
      <SectionHeading title="LA BOUTIQUE" subtitle="Le merch du crew" />

      {/* Précommande active — ligne sobre, nom souligné ambre (direction C) */}
      {campaigns.length > 0 && (
        <div className="mb-12 border-t border-b border-white/10 divide-y divide-white/10">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
              className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left py-4"
            >
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/50 font-display shrink-0">
                  Précommande
                </span>
                <span className="text-white/20">/</span>
                <span className="text-sm uppercase tracking-[0.2em] text-white">{campaign.name}</span>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                <span className="text-lfp-amber">J–{daysUntil(campaign.endDate)}</span> · clôture {formatDate(campaign.endDate)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filtres — bande défilante pleine largeur en mobile, onglets centrés dès sm.
          Structure à deux couches : le conteneur overflow-x clippe son contenu,
          la page ne peut donc jamais déborder horizontalement. */}
      {filters.length > 2 && (
        <>
          <div className="sm:hidden mb-12 -mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-6 px-6 text-sm uppercase tracking-[0.2em]">
              {filters.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`pb-1 border-b-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    activeFilter === key
                      ? 'border-lfp-amber text-white'
                      : 'border-transparent text-white/40'
                  }`}
                >
                  {filterLabel(key)}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex flex-wrap justify-center gap-6 md:gap-8 mb-12 text-sm uppercase tracking-[0.2em]">
            {filters.map((key) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeFilter === key
                    ? 'border-lfp-amber text-white'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                {filterLabel(key)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Grille produits — flux unique, drops en premier */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center text-white/30">
          Aucun produit disponible pour le moment. Revenez bientôt !
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-12">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </main>
  );
}
