import ShopClient from '@/components/shop/ShopClient';
import { getShopProducts, getActiveCampaigns } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Page catalogue de la boutique (server component).
export default async function ShopPage() {
  const [products, campaigns] = await Promise.all([getShopProducts(), getActiveCampaigns()]);

  return <ShopClient products={products} campaigns={campaigns} />;
}
