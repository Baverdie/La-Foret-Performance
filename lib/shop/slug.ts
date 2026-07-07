// Transforme un texte en slug URL (minuscules, sans accent, tirets).
// Parametre: text (texte source, ex. nom du produit).
// Sortie: slug normalise (ex. "T-shirt Été" -> "t-shirt-ete").
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
