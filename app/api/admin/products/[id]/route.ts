import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/shop/slug';
import { composeVariantLabel } from '@/lib/shop/variant';

// Variante envoyee par l'admin lors d'une edition (id present = variante existante).
interface VariantInput {
  id?: string;
  label?: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  priceDelta?: number;
  stockLimit?: number | null;
  isActive?: boolean;
  order?: number;
}

// Genere un slug unique a partir d'un nom, en ignorant le produit en cours d'edition.
async function generateUniqueSlug(name: string, excludeId: string): Promise<string> {
  const base = slugify(name) || 'produit';
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) {
      return slug;
    }
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

// Synchronise les variantes d'un produit : met a jour les existantes (par id),
// cree les nouvelles, supprime celles absentes du payload (preserve les ids -> stats de vente).
async function syncVariants(productId: string, variants: VariantInput[]): Promise<void> {
  const existing = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((variant) => variant.id));
  const keptIds = new Set(variants.filter((variant) => variant.id).map((variant) => variant.id as string));

  // Suppression des variantes retirees.
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await prisma.productVariant.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Mise a jour ou creation.
  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const data = {
      label: composeVariantLabel(variant.color, variant.size, variant.label),
      size: variant.size?.trim() || null,
      color: variant.color?.trim() || null,
      sku: variant.sku ?? null,
      priceDelta: variant.priceDelta ?? 0,
      stockLimit: variant.stockLimit ?? null,
      isActive: variant.isActive ?? true,
      order: variant.order ?? index,
    };

    if (variant.id && existingIds.has(variant.id)) {
      await prisma.productVariant.update({ where: { id: variant.id }, data });
    } else {
      await prisma.productVariant.create({ data: { ...data, productId } });
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAuth(PERMISSIONS.PRODUCTS_VIEW);
  if (error) return error;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { order: 'asc' } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.PRODUCTS_EDIT);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      details,
      category,
      images,
      basePrice,
      weightGrams,
      availabilityMode,
      campaignId,
      hasVariants,
      variants,
      order,
      isActive,
    } = body;

    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    if (availabilityMode === 'PRECOMMANDE' && !campaignId) {
      return NextResponse.json({ error: 'Une campagne est requise en mode précommande' }, { status: 400 });
    }

    // Recalcule le slug seulement si le nom change.
    const slug = name && name !== current.name ? await generateUniqueSlug(name, id) : current.slug;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(Array.isArray(details) && { details: details.filter((d: string) => d && d.trim()) }),
        ...(category && { category }),
        ...(images && { images }),
        ...(basePrice !== undefined && { basePrice }),
        ...(weightGrams !== undefined && { weightGrams }),
        ...(availabilityMode && { availabilityMode }),
        ...(campaignId !== undefined && { campaignId: campaignId || null }),
        ...(hasVariants !== undefined && { hasVariants: Boolean(hasVariants) }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (Array.isArray(variants)) {
      await syncVariants(id, variants);
    }

    const withVariants = await prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { order: 'asc' } } },
    });

    await logAction(session!.user.id, 'UPDATE', 'PRODUCT', id, { name: product.name }, request);

    return NextResponse.json({ product: withVariants });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.PRODUCTS_DELETE);
  if (error) return error;

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Empeche la suppression si le produit a deja ete commande (conserve l'historique).
    const orderedCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderedCount > 0) {
      return NextResponse.json(
        { error: 'Produit déjà commandé : désactivez-le plutôt que de le supprimer' },
        { status: 409 }
      );
    }

    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    await logAction(session!.user.id, 'DELETE', 'PRODUCT', id, { name: product.name }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
