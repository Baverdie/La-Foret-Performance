import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { sendOrderInProductionEmail } from '@/lib/email';

// Passe en production toutes les commandes payées d'une campagne (avec email client).
// Appelé quand la campagne passe au statut IN_PRODUCTION. Sortie : nombre de commandes.
async function launchCampaignOrdersProduction(campaignId: string): Promise<number> {
  const orders = await prisma.order.findMany({
    where: { campaignId, status: 'PAID' },
    include: { items: true },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'IN_PRODUCTION', productionStartedAt: new Date() },
    });
    // Email non bloquant : la bascule des commandes prime sur la notification.
    try {
      await sendOrderInProductionEmail(order);
    } catch (emailError) {
      console.error('Error sending production email:', emailError);
    }
  }
  return orders.length;
}

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

    const current = await prisma.campaign.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

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

    // Bascule groupee : passage de la campagne en production = toutes ses commandes
    // payees partent en production (avec email a chaque client).
    let ordersLaunched = 0;
    if (status === 'IN_PRODUCTION' && current.status !== 'IN_PRODUCTION') {
      ordersLaunched = await launchCampaignOrdersProduction(id);
    }

    await logAction(
      session!.user.id,
      'UPDATE',
      'CAMPAIGN',
      id,
      { status, ...(ordersLaunched ? { ordersLaunched } : {}) },
      request
    );

    return NextResponse.json({ campaign, ordersLaunched });
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
