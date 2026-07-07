import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from '../lib/permissions';

const prisma = new PrismaClient();

// Ensemble complet des permissions boutique.
const ALL_SHOP = [
  PERMISSIONS.PRODUCTS_VIEW,
  PERMISSIONS.PRODUCTS_CREATE,
  PERMISSIONS.PRODUCTS_EDIT,
  PERMISSIONS.PRODUCTS_DELETE,
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.ORDERS_EDIT,
  PERMISSIONS.CAMPAIGNS_VIEW,
  PERMISSIONS.CAMPAIGNS_CREATE,
  PERMISSIONS.CAMPAIGNS_EDIT,
  PERMISSIONS.CAMPAIGNS_DELETE,
];

// Permissions de niveau "admin" (gestion sans suppression).
const ADMIN_SHOP = [
  PERMISSIONS.PRODUCTS_VIEW,
  PERMISSIONS.PRODUCTS_CREATE,
  PERMISSIONS.PRODUCTS_EDIT,
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.ORDERS_EDIT,
  PERMISSIONS.CAMPAIGNS_VIEW,
  PERMISSIONS.CAMPAIGNS_CREATE,
  PERMISSIONS.CAMPAIGNS_EDIT,
];

// Permissions de niveau "éditeur".
const EDITOR_SHOP = [
  PERMISSIONS.PRODUCTS_VIEW,
  PERMISSIONS.PRODUCTS_EDIT,
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.CAMPAIGNS_VIEW,
];

// Permissions de niveau "lecture seule".
const VIEWER_SHOP = [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.CAMPAIGNS_VIEW];

// Determine les permissions boutique a accorder selon les capacites actuelles du role
// (robuste au renommage des roles : on se base sur ce que le role sait deja faire).
function shopPermsFor(perms: string[]): string[] {
  if (perms.includes(PERMISSIONS.SETTINGS_EDIT)) return ALL_SHOP;
  if (perms.includes(PERMISSIONS.MEMBERS_CREATE)) return ADMIN_SHOP;
  if (perms.includes(PERMISSIONS.MEMBERS_EDIT)) return EDITOR_SHOP;
  return VIEWER_SHOP;
}

async function main() {
  const roles = await prisma.role.findMany();

  for (const role of roles) {
    const toAdd = shopPermsFor(role.permissions);
    const merged = [...new Set([...role.permissions, ...toAdd])];
    const addedCount = merged.length - role.permissions.length;

    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: merged },
    });

    console.log(`✓ ${role.name} : +${addedCount} permissions boutique (total ${merged.length})`);
  }

  console.log('✅ Permissions boutique appliquées. Déconnecte-toi puis reconnecte-toi pour les charger.');
}

main()
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
