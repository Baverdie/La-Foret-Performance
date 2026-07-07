import { config } from 'dotenv';
config({ path: '.env.local' });

import sharp from 'sharp';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Ratio cible 4:5 (1080 × 1350).
const OUT_W = 1080;
const OUT_H = 1350;

// Slugs des produits dont l'image (photo réelle) doit être normalisée en 4:5.
const SLUGS = ['hoodie-la-foret', 'pack-stickers-x8', 'cache-plaque-lfp'];

// Télécharge l'image, la recadre en 4:5 (cover, cadrage intelligent), la pousse sur Blob.
async function normalize(url: string, slug: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status}) pour ${slug}`);
  const input = Buffer.from(await res.arrayBuffer());

  const output = await sharp(input)
    .resize(OUT_W, OUT_H, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 88 })
    .toBuffer();

  const blob = await put(`lfp/shop/${slug}-4x5-${crypto.randomBytes(5).toString('hex')}.jpg`, output, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}

async function main() {
  for (const slug of SLUGS) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product || product.images.length === 0) {
      console.warn(`⚠ Ignoré : ${slug}`);
      continue;
    }
    const newUrl = await normalize(product.images[0], slug);
    await prisma.product.update({ where: { slug }, data: { images: [newUrl] } });
    console.log(`✓ ${product.name}\n  → ${newUrl}`);
  }
  console.log('✅ Images normalisées en 4:5.');
}

main()
  .catch((error) => {
    console.error('Erreur normalisation:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
