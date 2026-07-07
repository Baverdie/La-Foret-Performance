import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/shop/slug';
import { composeVariantLabel } from '@/lib/shop/variant';

// Variante envoyee par l'admin lors de la creation d'un produit.
interface VariantInput {
  label?: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  priceDelta?: number;
  stockLimit?: number | null;
  isActive?: boolean;
  order?: number;
}

// Genere un slug unique a partir d'un nom, en suffixant si necessaire.
// Parametres: name (nom du produit), excludeId (id a ignorer lors de l'edition).
// Sortie: slug unique en base.
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
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

export async function GET(request: NextRequest) {
  const { error } = await checkAuth(PERMISSIONS.PRODUCTS_VIEW);
  if (error) return error;

  try {
    const products = await prisma.product.findMany({
      include: {
        variants: { orderBy: { order: 'asc' } },
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.PRODUCTS_CREATE);
  if (error) return error;

  try {
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
    } = body;

    if (!name || basePrice === undefined || basePrice === null) {
      return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 });
    }

    if (availabilityMode === 'PRECOMMANDE' && !campaignId) {
      return NextResponse.json({ error: 'Une campagne est requise en mode précommande' }, { status: 400 });
    }

    const slug = await generateUniqueSlug(name);

    let productOrder = order;
    if (productOrder === undefined || productOrder === null) {
      const maxOrder = await prisma.product.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      productOrder = maxOrder ? maxOrder.order + 1 : 0;
    }

    const variantList: VariantInput[] = Array.isArray(variants) ? variants : [];

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        details: Array.isArray(details) ? details.filter((d: string) => d && d.trim()) : [],
        category: category || 'OTHER',
        images: images || [],
        basePrice,
        weightGrams: weightGrams ?? null,
        availabilityMode: availabilityMode || 'MADE_TO_ORDER',
        campaignId: campaignId || null,
        hasVariants: Boolean(hasVariants),
        order: productOrder,
        variants: {
          create: variantList.map((variant, index) => ({
            label: composeVariantLabel(variant.color, variant.size, variant.label),
            size: variant.size?.trim() || null,
            color: variant.color?.trim() || null,
            sku: variant.sku ?? null,
            priceDelta: variant.priceDelta ?? 0,
            stockLimit: variant.stockLimit ?? null,
            isActive: variant.isActive ?? true,
            order: variant.order ?? index,
          })),
        },
      },
      include: { variants: true },
    });

    await logAction(session!.user.id, 'CREATE', 'PRODUCT', product.id, { name, slug }, request);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
