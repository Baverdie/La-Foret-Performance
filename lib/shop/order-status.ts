// Machine à états des commandes : statuts, transitions autorisées et horodatages associés.
// Toute modification de statut (admin, webhook, page de succès) doit passer par canTransition.

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Transitions autorisées depuis chaque statut. CANCELLED et REFUNDED sont terminaux.
// Le cycle nominal est strictement séquentiel (tout est produit à la demande, donc
// rien ne peut être expédié sans être passé par la production).
// PAID → CANCELLED couvre l'annulation avant production (avec remboursement automatique) ;
// REFUNDED couvre le remboursement après lancement de production (rétractation, litige).
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

// Vérifie qu'une transition de statut est autorisée.
// Paramètres : from (statut actuel), to (statut cible).
// Sortie : true si la transition est permise par la machine à états.
export function canTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from as OrderStatus];
  return Array.isArray(allowed) && allowed.includes(to as OrderStatus);
}

// Champ d'horodatage à renseigner lors de l'entrée dans chaque statut.
export const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  PAID: 'paidAt',
  IN_PRODUCTION: 'productionStartedAt',
  SHIPPED: 'shippedAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
  REFUNDED: 'refundedAt',
};

// Statuts pour lesquels le client peut encore demander l'annulation
// (avant lancement de la production).
export const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'PAID'];

// Statuts dont la transition déclenche un remboursement Stripe automatique
// (commande déjà payée qui part en annulation ou remboursement).
export const REFUND_ON_TRANSITION: OrderStatus[] = ['CANCELLED', 'REFUNDED'];
