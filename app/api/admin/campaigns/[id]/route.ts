import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAuth(PERMISSIONS.CAMPAIGNS_VIEW);
  if (error) return error;

  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.CAMPAIGNS_EDIT);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate, status } = body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
    });

    await logAction(session!.user.id, 'UPDATE', 'CAMPAIGN', id, { status }, request);

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.CAMPAIGNS_DELETE);
  if (error) return error;

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Detache les produits rattaches et les bascule en made-to-order avant suppression.
    await prisma.product.updateMany({
      where: { campaignId: id },
      data: { campaignId: null, availabilityMode: 'MADE_TO_ORDER' },
    });

    await prisma.campaign.delete({ where: { id } });

    await logAction(session!.user.id, 'DELETE', 'CAMPAIGN', id, { name: campaign.name }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
