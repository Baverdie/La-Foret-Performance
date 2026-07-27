import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Convertit des euros en centimes.
function euros(value: number): number {
  return Math.round(value * 100);
}

async function main() {
  // Garde-fou : ce seed purge et recrée tout le catalogue (commandes comprises).
  // Il ne doit JAMAIS tourner contre la base de production.
  if (!process.env.DATABASE_URL?.includes('/lfp-dev')) {
    console.error('⛔ Refusé : DATABASE_URL ne pointe pas sur lfp-dev (base de développement).');
    console.error('   Ce seed est destructif et réservé à l\'environnement de dev.');
    process.exit(1);
  }

  console.log('🌱 Seed boutique : nettoyage des anciennes données mock...');

  // Reset propre du catalogue (donnees de test uniquement).
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.campaign.deleteMany({});

  // Campagne de precommande ouverte.
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 5);
  const end = new Date(now);
  end.setDate(end.getDate() + 25);

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Drop Été 2026',
      description: 'Édition limitée produite uniquement sur précommande. Commande avant la clôture, on lance la production juste après.',
      startDate: start,
      endDate: end,
      status: 'OPEN',
    },
  });
  console.log(`✓ Campagne créée : ${campaign.name}`);

  // Tailles standard pour le textile (variantes structurées : size renseigné, label = taille).
  const sizes = () =>
    ['S', 'M', 'L', 'XL'].map((size, index) => ({
      label: size,
      size,
      color: null as string | null,
      priceDelta: size === 'XL' ? euros(2) : 0,
      stockLimit: null as number | null,
      isActive: true,
      order: index,
    }));

  // Definition des produits mock.
  const products = [
    {
      name: 'T-shirt LFP Classic',
      description: 'Le t-shirt officiel du crew. Coton lourd 220g/m², sérigraphie blanche sur noir.\nCoupe unisexe.',
      details: ['Matière : 100% coton 220g/m²', 'Impression : sérigraphie', 'Coupe : unisexe', 'Entretien : lavage 30°C'],
      category: 'TEXTILE',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/mockup-t-shirt-lfp-classic-2759550349.png'],
      basePrice: euros(29.9),
      availabilityMode: 'MADE_TO_ORDER',
      hasVariants: true,
      order: 0,
      variants: sizes(),
    },
    {
      name: 'Hoodie La Forêt',
      description: 'Sweat à capuche premium, intérieur molletonné. Broderie poitrine + impression dos.',
      details: ['Matière : 80% coton / 20% polyester, 350g/m²', 'Technique : broderie + impression', 'Coupe : unisexe oversize', 'Entretien : lavage 30°C sur l\'envers'],
      category: 'TEXTILE',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/hoodie-la-foret-4x5-9cdd76fd4d.jpg'],
      basePrice: euros(59.9),
      availabilityMode: 'MADE_TO_ORDER',
      hasVariants: true,
      order: 1,
      variants: sizes(),
    },
    {
      name: 'Casquette LFP',
      description: 'Casquette snapback noire, logo brodé. Taille unique ajustable.',
      details: ['Type : snapback réglable', 'Logo brodé', 'Taille unique'],
      category: 'OTHER',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/mockup-casquette-lfp-8b5ca0fc7c.png'],
      basePrice: euros(24.9),
      availabilityMode: 'MADE_TO_ORDER',
      hasVariants: false,
      order: 2,
      variants: [],
    },
    {
      name: 'Pack Stickers (x8)',
      description: 'Lot de 8 autocollants vinyle résistants UV et lavage. Parfaits pour la caisse à outils ou la vitre.',
      details: ['Matière : vinyle', 'Quantité : 8 stickers', 'Résistance : UV et lavage'],
      category: 'STICKER',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/pack-stickers-x8-4x5-6993830312.jpg'],
      basePrice: euros(9.9),
      availabilityMode: 'MADE_TO_ORDER',
      hasVariants: false,
      order: 3,
      variants: [],
    },
    {
      name: 'Cache-plaque LFP',
      description: 'Cache-plaque d\'immatriculation au logo du crew. Plastique ABS, fixation universelle.',
      details: ['Matière : ABS', 'Fixation : universelle', 'Format : plaque FR'],
      category: 'PLATE',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/cache-plaque-lfp-4x5-07f91abc74.jpg'],
      basePrice: euros(14.9),
      availabilityMode: 'MADE_TO_ORDER',
      hasVariants: false,
      order: 4,
      variants: [],
    },
    {
      name: 'T-shirt Drop Été (précommande)',
      description: 'Édition été en précommande. Coloris sable, impression spéciale.\nProduit uniquement à la clôture de la campagne.',
      details: ['Matière : 100% coton bio 200g/m²', 'Impression : sérigraphie haute densité', 'Édition limitée', 'Coupe : unisexe'],
      category: 'TEXTILE',
      images: ['https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/shop/mockup-t-shirt-drop-ete-precommande-043ec38513.png'],
      basePrice: euros(34.9),
      availabilityMode: 'PRECOMMANDE',
      campaignId: campaign.id,
      hasVariants: true,
      order: 5,
      variants: [
        { label: 'S', size: 'S', color: null, priceDelta: 0, stockLimit: null, isActive: true, order: 0 },
        { label: 'M', size: 'M', color: null, priceDelta: 0, stockLimit: null, isActive: true, order: 1 },
        { label: 'L', size: 'L', color: null, priceDelta: 0, stockLimit: null, isActive: true, order: 2 },
        { label: 'XL', size: 'XL', color: null, priceDelta: euros(2), stockLimit: 10, isActive: true, order: 3 },
      ],
    },
  ];

  for (const product of products) {
    const { variants, ...productData } = product;
    const slug = product.name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await prisma.product.create({
      data: {
        ...productData,
        slug,
        variants: { create: variants },
      },
    });
    console.log(`✓ Produit créé : ${product.name}`);
  }

  console.log('✅ Seed boutique terminé.');
}

main()
  .catch((error) => {
    console.error('Erreur seed boutique:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
