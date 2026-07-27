import prisma from '@/lib/prisma';
import { CANCELLABLE_STATUSES, type OrderStatus } from '@/lib/shop/order-status';
import type { Order, OrderItem } from '@prisma/client';

// Vue publique d'une commande : uniquement les champs necessaires a la page de suivi.
export interface PublicOrderView {
  orderNumber: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  productionStartedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  cancelRequestedAt: string | null;
  trackingNumber: string | null;
  subtotal: number;
  shippingCost: number;
  processingFee: number;
  total: number;
  items: { productName: string; variantLabel: string | null; quantity: number; lineTotal: number }[];
  shipping: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
  canRequestCancel: boolean;
}

// Transforme une commande DB en vue publique (aucune donnee interne exposee).
// Parametre: order (commande avec ses articles).
export function toPublicOrderView(order: Order & { items: OrderItem[] }): PublicOrderView {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    productionStartedAt: order.productionStartedAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    refundedAt: order.refundedAt?.toISOString() ?? null,
    cancelRequestedAt: order.cancelRequestedAt?.toISOString() ?? null,
    trackingNumber: order.trackingNumber,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    processingFee: order.processingFee,
    total: order.total,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    shipping: {
      firstName: order.firstName,
      lastName: order.lastName,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      postalCode: order.postalCode,
      city: order.city,
      country: order.country,
    },
    canRequestCancel:
      CANCELLABLE_STATUSES.includes(order.status as OrderStatus) && !order.cancelRequestedAt,
  };
}

// Retrouve une commande a partir du couple numero + email (authentification legere
// du checkout invite). Renvoie null si le couple ne correspond a rien.
// Parametres: orderNumber (ex. LFP-2026-0004), email (email de commande).
export async function findOrderByNumberAndEmail(orderNumber: string, email: string) {
  const normalizedNumber = orderNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedNumber || !normalizedEmail) return null;

  const order = await prisma.order.findUnique({
    where: { orderNumber: normalizedNumber },
    include: { items: true },
  });
  if (!order || order.email !== normalizedEmail) return null;
  return order;
}
