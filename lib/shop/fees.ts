// Barème de la commission Stripe pour les cartes standard EEE : 1,5 % + 0,25 €.
// Les frais de traitement sont identiques quel que soit le moyen de paiement
// (la surfacturation par moyen de paiement est interdite en France, art. L112-12 CMF).
export const PROCESSING_FEE_RATE = 0.015;
export const PROCESSING_FEE_FIXED_CENTS = 25;

// Calcule les frais de traitement répercutés au client pour couvrir la commission
// Stripe sur le montant total encaissé. Calcul en « gross-up » : la commission
// s'applique aussi aux frais eux-mêmes, d'où total = (base + fixe) / (1 - taux),
// arrondi au centime supérieur.
// Paramètre : baseCents (articles + frais de port, en centimes).
// Sortie : frais de traitement en centimes (0 si la base est nulle).
export function computeProcessingFee(baseCents: number): number {
  if (baseCents <= 0) return 0;
  const grossTotal = Math.ceil((baseCents + PROCESSING_FEE_FIXED_CENTS) / (1 - PROCESSING_FEE_RATE));
  return grossTotal - baseCents;
}
