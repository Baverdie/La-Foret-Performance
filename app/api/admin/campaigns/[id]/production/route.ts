import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Ligne de production agregee : quantite totale a produire pour une variante donnee.
interface ProductionLine {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
}

// GET : agrege les quantites a produire par produit/variante pour une campagne de precommande.
// On ne compte que les commandes payees ou plus avancees (production reelle a lancer).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAuth(PERMISSIONS.CAMPAIGNS_VIEW);
  if (error) return error;

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          campaignId: id,
          status: { in: ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'] },
        },
      },
      select: {
        productId: true,
        productName: true,
        variantId: true,
        variantLabel: true,
        quantity: true,
      },
    });

    // Agregation par couple produit + variante.
    const grouped = new Map<string, ProductionLine>();
    for (const item of items) {
      const key = `${item.productId}::${item.variantId ?? 'base'}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        grouped.set(key, {
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
        });
      }
    }

    const production = [...grouped.values()].sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
    const totalUnits = production.reduce((sum, line) => sum + line.quantity, 0);

    return NextResponse.json({ campaign, production, totalUnits });
  } catch (error) {
    console.error('Error computing production:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
