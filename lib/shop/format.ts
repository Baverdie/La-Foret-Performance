// Formate un montant en centimes vers une chaine en euros (ex. 2990 -> "29,90 €").
// Parametre: cents (entier, montant en centimes). Sortie: chaine formatee en français.
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// Libelles lisibles des categories de produits.
export const CATEGORY_LABELS: Record<string, string> = {
  TEXTILE: 'Textile',
  STICKER: 'Autocollant',
  PLATE: 'Cache-plaque',
  OTHER: 'Autre',
};

// Libelles lisibles des statuts de commande.
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de paiement',
  PAID: 'Payée',
  IN_PRODUCTION: 'En production',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

// Libelles lisibles des statuts de campagne de precommande.
export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  CLOSED: 'Fermée',
  IN_PRODUCTION: 'En production',
  COMPLETED: 'Terminée',
};
