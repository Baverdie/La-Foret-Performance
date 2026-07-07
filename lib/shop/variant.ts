// Compose le libellé d'affichage d'une variante à partir de sa couleur et de sa taille.
// Parametres: color (couleur ou null/vide), size (taille ou null/vide), fallback (libellé de secours).
// Sortie: ex. "Noir / L", "L", "Noir", sinon le fallback, sinon "Standard".
export function composeVariantLabel(
  color: string | null | undefined,
  size: string | null | undefined,
  fallback?: string
): string {
  const composed = [color, size].map((v) => v?.trim()).filter(Boolean).join(' / ');
  return composed || fallback?.trim() || 'Standard';
}
