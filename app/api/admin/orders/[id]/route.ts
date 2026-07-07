import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Statuts modifiables manuellement par l'admin (le passage a PAID est gere par le webhook Stripe).
const EDITABLE_STATUSES = ['IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PAID'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAuth(PERMISSIONS.ORDERS_VIEW);
  if (error) return error;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.ORDERS_EDIT);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !EDITABLE_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, campaign: { select: { id: true, name: true } } },
    });

    await logAction(session!.user.id, 'UPDATE', 'ORDER', id, { from: current.status, to: status }, request);

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
