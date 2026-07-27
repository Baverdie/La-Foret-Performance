import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, logAction } from '@/lib/api-utils';
import { PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { canTransition, STATUS_TIMESTAMP_FIELD, REFUND_ON_TRANSITION, type OrderStatus } from '@/lib/shop/order-status';
import { refundOrderPayment } from '@/lib/shop/refunds';
import {
  sendOrderInProductionEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendOrderRefundedEmail,
} from '@/lib/email';

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

// Envoie l'email client correspondant au nouveau statut (non bloquant pour la reponse).
// Parametres: status (statut cible), order (commande mise a jour avec ses articles),
// refunded (true si un remboursement Stripe vient d'etre emis).
async function sendStatusEmail(
  status: OrderStatus,
  order: Parameters<typeof sendOrderShippedEmail>[0],
  refunded: boolean
): Promise<void> {
  try {
    switch (status) {
      case 'IN_PRODUCTION':
        await sendOrderInProductionEmail(order);
        break;
      case 'SHIPPED':
        await sendOrderShippedEmail(order);
        break;
      case 'CANCELLED':
        await sendOrderCancelledEmail(order, refunded);
        break;
      case 'REFUNDED':
        await sendOrderRefundedEmail(order);
        break;
      default:
        break;
    }
  } catch (emailError) {
    console.error('Error sending status email:', emailError);
  }
}

// PUT : transition de statut d'une commande, verrouillee par la machine a etats.
// Effets automatiques : horodatage, numero de suivi (SHIPPED), remboursement Stripe
// (CANCELLED sur commande payee, REFUNDED), email client adapte au statut.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkAuth(PERMISSIONS.ORDERS_EDIT);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const status: string | undefined = body.status;
    const trackingNumber: string | undefined = body.trackingNumber;

    if (!status) {
      return NextResponse.json({ error: 'Statut manquant' }, { status: 400 });
    }

    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (!canTransition(current.status, status)) {
      return NextResponse.json(
        { error: `Transition impossible : ${current.status} → ${status}` },
        { status: 400 }
      );
    }

    // Remboursement Stripe AVANT le changement de statut : si Stripe refuse,
    // la commande reste dans son etat actuel (pas de statut menteur).
    let refundId: string | null = null;
    if (REFUND_ON_TRANSITION.includes(status as OrderStatus) && current.stripePaymentIntentId) {
      try {
        refundId = await refundOrderPayment(current.stripePaymentIntentId, current.orderNumber);
      } catch (refundError) {
        console.error('Stripe refund failed:', refundError);
        return NextResponse.json(
          { error: 'Le remboursement Stripe a échoué — statut inchangé' },
          { status: 502 }
        );
      }
    }

    const timestampField = STATUS_TIMESTAMP_FIELD[status as OrderStatus];
    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        ...(status === 'SHIPPED' && trackingNumber?.trim()
          ? { trackingNumber: trackingNumber.trim() }
          : {}),
        ...(refundId ? { stripeRefundId: refundId } : {}),
        // Une demande d'annulation est soldee des que la commande change d'etat.
        ...(current.cancelRequestedAt ? { cancelRequestedAt: null } : {}),
      },
      include: { items: true, campaign: { select: { id: true, name: true } } },
    });

    await sendStatusEmail(status as OrderStatus, order, refundId !== null);

    await logAction(
      session!.user.id,
      'UPDATE',
      'ORDER',
      id,
      { from: current.status, to: status, ...(refundId ? { refundId } : {}) },
      request
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
