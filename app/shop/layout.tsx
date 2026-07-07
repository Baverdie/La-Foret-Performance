import type { Metadata } from 'next';
import { CartProvider } from '@/components/shop/CartProvider';
import ShopHeader from '@/components/shop/ShopHeader';

export const metadata: Metadata = {
  title: 'Boutique — La Forêt Performance',
  description: 'Le merch officiel du crew La Forêt Performance : textile, autocollants et cache-plaques.',
};

// Layout de la boutique : fournit le panier et l'en-tete a toutes les pages /shop.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen grain-bg bg-[#1a1a1a] text-white">
        <ShopHeader />
        {children}
      </div>
    </CartProvider>
  );
}
