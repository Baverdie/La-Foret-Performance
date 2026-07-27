import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findOrderByNumberAndEmail, toPublicOrderView } from '@/lib/shop/order-lookup';
import { CANCELLABLE_STATUSES, type OrderStatus } from '@/lib/shop/order-status';
import { sendCancelRequestAdminNotification } from '@/lib/email';
import { SHOP_ENABLED } from '@/lib/shop/flags';

export const runtime = 'nodejs';

// POST : demande d'annulation d'une commande par le client (page de suivi).
// Possible uniquement avant lancement de la production ; l'admin valide ensuite
// l'annulation (et le remboursement) depuis le panel. Corps : { orderNumber, email }.
export async function POST(request: NextRequest) {
  // Boutique désactivée (flag) : l'API d'annulation est inaccessible.
  if (!SHOP_ENABLED) {
    return NextResponse.json({ error: 'Boutique indisponible' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const order = await findOrderByNumberAndEmail(String(body.orderNumber || ''), String(body.email || ''));

    if (!order) {
      return NextResponse.json(
        { error: 'Aucune commande ne correspond à ce numéro et cet email' },
        { status: 404 }
      );
    }

    if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
      return NextResponse.json(
        { error: 'Cette commande ne peut plus être annulée (production lancée ou commande clôturée)' },
        { status: 400 }
      );
    }

    if (order.cancelRequestedAt) {
      return NextResponse.json(
        { error: 'Une demande d\'annulation est déjà en cours pour cette commande' },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { cancelRequestedAt: new Date() },
      include: { items: true },
    });

    // Notification admin non bloquante : la demande est enregistree quoi qu'il arrive.
    try {
      await sendCancelRequestAdminNotification(updated);
    } catch (emailError) {
      console.error('Error sending cancel request notification:', emailError);
    }

    return NextResponse.json({ order: toPublicOrderView(updated) });
  } catch (error) {
    console.error('Error requesting order cancellation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
