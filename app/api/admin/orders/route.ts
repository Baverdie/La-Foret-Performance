import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Statuts de commande valides pour le filtre.
const VALID_STATUSES = ['PENDING', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export async function GET(request: NextRequest) {
  const { error } = await checkAuth(PERMISSIONS.ORDERS_VIEW);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');

    const orders = await prisma.order.findMany({
      where: {
        ...(status && VALID_STATUSES.includes(status) ? { status } : {}),
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        items: true,
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
