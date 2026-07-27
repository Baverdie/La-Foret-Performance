// Feature flag de la boutique, piloté par la variable d'environnement NEXT_PUBLIC_SHOP_ENABLED.
// Absente ou différente de 'true' → la boutique est masquée partout : liens publics (landing,
// footer, 404, pages légales), onglets admin et pages /shop (404). Permet de déployer la
// nouvelle DA en production sans exposer le shop, tout en le gardant actif en preview/dev.
export const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED === 'true';
