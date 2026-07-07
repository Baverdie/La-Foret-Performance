// Frais de port forfaitaires (en centimes). Structure prete pour un calcul au poids ulterieur.
export const SHIPPING_FLAT_CENTS = 590;

// Seuil de franco de port en centimes (null = desactive). Ex. 8000 = livraison offerte des 80 €.
export const FREE_SHIPPING_THRESHOLD_CENTS: number | null = null;

// Calcule les frais de port d'une commande.
// Parametre: subtotalCents (sous-total des articles en centimes).
// Sortie: montant des frais de port en centimes (0 si franco de port atteint).
export function computeShippingCost(subtotalCents: number): number {
  if (
    FREE_SHIPPING_THRESHOLD_CENTS !== null &&
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
  ) {
    return 0;
  }
  return SHIPPING_FLAT_CENTS;
}
