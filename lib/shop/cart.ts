import { computeShippingCost } from './shipping';

// Ligne de panier telle que stockee cote client (localStorage) — sert uniquement a l'affichage.
// Les prix sont systematiquement recalcules cote serveur au checkout (jamais de confiance au client).
export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  category: string;
  variantId: string | null;
  variantLabel: string | null;
  unitPrice: number; // centimes, indicatif (affichage)
  quantity: number;
}

// Entree minimale envoyee par le client au endpoint de checkout.
export interface CheckoutItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

// Ligne resolue cote serveur a partir des donnees DB (prix de confiance).
export interface ResolvedOrderLine {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  unitPrice: number; // centimes
  quantity: number;
  lineTotal: number; // centimes
}

// Totaux d'une commande.
export interface OrderTotals {
  subtotal: number;
  shippingCost: number;
  total: number;
}

// Calcule les totaux d'une commande a partir des lignes resolues cote serveur.
// Parametre: lines (lignes resolues avec prix de confiance).
// Sortie: sous-total, frais de port et total, en centimes.
export function computeOrderTotals(lines: ResolvedOrderLine[]): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingCost = computeShippingCost(subtotal);
  return {
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
}
