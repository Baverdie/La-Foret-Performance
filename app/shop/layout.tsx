import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/components/shop/CartProvider';
import ShopHeader from '@/components/shop/ShopHeader';
import { SHOP_ENABLED } from '@/lib/shop/flags';

export const metadata: Metadata = {
  title: 'Boutique — La Forêt Performance',
  description: 'Le merch officiel du crew La Forêt Performance : textile, autocollants et cache-plaques.',
};

// Layout de la boutique : fournit le panier, l'en-tete et la barre légale a toutes les pages /shop.
// Si la boutique est désactivée (flag), toutes les pages /shop renvoient une 404.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  if (!SHOP_ENABLED) {
    notFound();
  }

  return (
    <CartProvider>
      <div className="min-h-screen grain-bg bg-[#1a1a1a] text-white flex flex-col">
        <ShopHeader />
        <div className="flex-1">{children}</div>
        {/* Barre légale de la boutique */}
        <footer className="border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs uppercase tracking-[0.15em] text-gray-500">
            <span>© La Forêt Performance</span>
            <nav className="flex items-center gap-4">
              <a href="/shop/commande" className="hover:text-white transition-colors">Suivre ma commande</a>
              <span className="text-white/15">·</span>
              <a href="/cgv" className="hover:text-white transition-colors">CGV</a>
              <span className="text-white/15">·</span>
              <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
              <span className="text-white/15">·</span>
              <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
            </nav>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
