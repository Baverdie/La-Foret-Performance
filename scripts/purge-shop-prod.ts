import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

// Purge les données boutique de la base de PRODUCTION (lfp) : produits mock, variantes,
// campagnes de démo. Ne touche à rien d'autre (membres, voitures, users, logs intacts).
// Sécurités : refuse de tourner s'il existe des commandes, et exige le drapeau --je-confirme.

async function main() {
  if (!process.argv.includes('--je-confirme')) {
    console.error('⛔ Ce script purge la boutique de la base de PRODUCTION.');
    console.error('   Relancez avec : npx tsx scripts/purge-shop-prod.ts --je-confirme');
    process.exit(1);
  }

  const prodUrl = (process.env.DATABASE_URL || '').replace(/\/lfp-dev(\?|$)/, '/lfp$1');
  if (!prodUrl.includes('/lfp?') && !prodUrl.endsWith('/lfp')) {
    console.error('⛔ URL de production introuvable dans DATABASE_URL.');
    process.exit(1);
  }
  const db = new PrismaClient({ datasourceUrl: prodUrl });

  // Sécurité : s'il existe de vraies commandes, on ne touche à rien.
  const orderCount = await db.order.count();
  if (orderCount > 0) {
    console.error(`⛔ ${orderCount} commande(s) présente(s) en prod : purge refusée (à traiter manuellement).`);
    await db.$disconnect();
    process.exit(1);
  }

  const variants = await db.productVariant.deleteMany({});
  const products = await db.product.deleteMany({});
  const campaigns = await db.campaign.deleteMany({});

  console.log(`✅ Prod purgée : ${products.count} produits, ${variants.count} variantes, ${campaigns.count} campagne(s) supprimés.`);
  console.log('   Membres, voitures, utilisateurs et logs intacts.');
  await db.$disconnect();
}

main().catch((error) => {
  console.error('Erreur purge:', error);
  process.exit(1);
});
