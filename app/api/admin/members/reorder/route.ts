import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  const { error, session } = await checkAuth(PERMISSIONS.MEMBERS_EDIT);
  if (error) return error;

  try {
    const body = await request.json();
    const { orders } = body as { orders: { id: string; order: number }[] };

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'orders requis' }, { status: 400 });
    }

    await Promise.all(
      orders.map(({ id, order }) =>
        prisma.member.update({ where: { id }, data: { order } })
      )
    );

    await logAction(session!.user.id, 'UPDATE', 'MEMBER', undefined, { count: orders.length }, request);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error reordering members:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
