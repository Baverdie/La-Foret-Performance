import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error } = await checkAuth(PERMISSIONS.CAMPAIGNS_VIEW);
  if (error) return error;

  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.CAMPAIGNS_CREATE);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, startDate, endDate, status } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Nom, date de début et de fin requis' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: description || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'DRAFT',
      },
    });

    await logAction(session!.user.id, 'CREATE', 'CAMPAIGN', campaign.id, { name }, request);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
