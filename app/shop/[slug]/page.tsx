import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductDetail from '@/components/shop/ProductDetail';
import { getShopProductBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Genere les metadonnees SEO de la fiche produit.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);
  if (!product) {
    return { title: 'Produit introuvable — La Forêt Performance' };
  }
  return {
    title: `${product.name} — Boutique LFP`,
    description: product.description.slice(0, 160),
  };
}

// Page fiche produit (server component). 404 si le produit n'existe pas ou n'est pas achetable.
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
