import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.EVENTS_VIEW);
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');

    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const eventsWithAutoStatus = events.map(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const autoStatus = eventDate < now ? 'past' : 'upcoming';
      return { ...event, status: autoStatus };
    });

    const filteredEvents = statusFilter
      ? eventsWithAutoStatus.filter(e => e.status === statusFilter)
      : eventsWithAutoStatus;

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.EVENTS_CREATE);
  if (error) return error;

  try {
    const body = await request.json();
    const { title, date, location, description, photo, order } = body;

    if (!title || !date || !location) {
      return NextResponse.json({ error: 'Titre, date et lieu requis' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        location,
        description: description || '',
        photo: photo || null,
        order: order || 0,
        isActive: true,
      },
    });

    await logAction(session!.user.id, 'CREATE', 'EVENT', event.id, { title }, request);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
