import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

// Clone les collections de contenu de la base de prod (lfp) vers la base de dev (lfp-dev)
// hébergée sur le MÊME cluster Atlas. Idempotent : vide la cible avant chaque copie.
// Les données boutique ne sont pas clonées (le seed-shop les gère côté dev).

// Dérive l'URL de la base de dev à partir de l'URL courante (remplace le nom de base).
function deriveDevUrl(url: string): string {
  const devUrl = url.replace(/\/lfp(\?|$)/, '/lfp-dev$1');
  if (devUrl === url) {
    throw new Error('Impossible de dériver l\'URL dev : nom de base "lfp" introuvable dans DATABASE_URL');
  }
  return devUrl;
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) throw new Error('DATABASE_URL manquante');
  // Sécurité : si .env.local pointe déjà sur lfp-dev, la source reste la base lfp.
  const prodUrl = sourceUrl.replace(/\/lfp-dev(\?|$)/, '/lfp$1');
  const devUrl = deriveDevUrl(prodUrl);

  const source = new PrismaClient({ datasourceUrl: prodUrl });
  const target = new PrismaClient({ datasourceUrl: devUrl });

  // Ordre : les modèles référencés d'abord (Role avant User, Member avant Car).
  console.log('🔁 Clonage lfp → lfp-dev…');

  const roles = await source.role.findMany();
  await target.role.deleteMany({});
  if (roles.length) await target.role.createMany({ data: roles });
  console.log(`✓ ${roles.length} rôles`);

  const members = await source.member.findMany();
  await target.member.deleteMany({});
  if (members.length) await target.member.createMany({ data: members });
  console.log(`✓ ${members.length} membres`);

  const cars = await source.car.findMany();
  await target.car.deleteMany({});
  if (cars.length) await target.car.createMany({ data: cars });
  console.log(`✓ ${cars.length} voitures`);

  const events = await source.event.findMany();
  await target.event.deleteMany({});
  if (events.length) await target.event.createMany({ data: events });
  console.log(`✓ ${events.length} événements`);

  const users = await source.user.findMany();
  await target.user.deleteMany({});
  if (users.length) await target.user.createMany({ data: users });
  console.log(`✓ ${users.length} utilisateurs (mêmes identifiants de connexion)`);

  await source.$disconnect();
  await target.$disconnect();
  console.log('✅ Base lfp-dev prête (contenu cloné, boutique à seeder via db:seed-shop).');
}

main().catch((error) => {
  console.error('Erreur clonage:', error);
  process.exit(1);
});
