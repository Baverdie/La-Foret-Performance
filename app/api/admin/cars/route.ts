import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.CARS_VIEW);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');

    const cars = await prisma.car.findMany({
      where: memberId ? { memberId } : undefined,
      include: {
        member: {
          select: { id: true, name: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.CARS_CREATE);
  if (error) return error;

  try {
    const body = await request.json();
    const { model, year, photos, containPhotos, engine, power, modifications, story, memberId, order } = body;

    if (!model || !year || !memberId) {
      return NextResponse.json({ error: 'Modèle, année et membre requis' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    let carOrder = order;
    if (carOrder === undefined || carOrder === null) {
      const maxOrderCar = await prisma.car.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      carOrder = maxOrderCar ? maxOrderCar.order + 1 : 0;
    }

    const car = await prisma.car.create({
      data: {
        model,
        year,
        photos: photos || [],
        containPhotos: containPhotos || [],
        engine: engine || '',
        power: power || '',
        modifications: modifications || '',
        story: story || '',
        memberId,
        order: carOrder,
      },
    });

    await logAction(session!.user.id, 'CREATE', 'CAR', car.id, { model, memberId }, request);

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
