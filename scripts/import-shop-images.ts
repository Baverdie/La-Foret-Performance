import { config } from 'dotenv';
config({ path: '.env.local' });

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Outil générique : télécharge une image distante (ex. CDN Instagram, URL signée temporaire),
// la ré-héberge sur Vercel Blob (permanent) et l'applique à un produit (par slug).
// Usage : npx tsx scripts/import-shop-images.ts <slug> "<url>" [--append]
//   --append : ajoute l'image aux images existantes (sinon remplace).

// Télécharge une image distante et la pousse sur Vercel Blob. Renvoie l'URL Blob permanente.
async function downloadAndUpload(slug: string, url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });
  if (!response.ok) {
    throw new Error(`Téléchargement échoué (${response.status}) pour ${slug}`);
  }

  const contentType = response.headers.get('content-type') || 'image/webp';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp';
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `lfp/shop/${slug}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  const blob = await put(filename, buffer, { access: 'public', contentType });
  return blob.url;
}

async function main() {
  const [slug, url] = process.argv.slice(2);
  const append = process.argv.includes('--append');

  if (!slug || !url) {
    console.error('Usage : npx tsx scripts/import-shop-images.ts <slug> "<url>" [--append]');
    process.exit(1);
  }

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    console.error(`Produit introuvable : ${slug}`);
    process.exit(1);
  }

  const blobUrl = await downloadAndUpload(slug, url);
  const images = append ? [...product.images, blobUrl] : [blobUrl];

  await prisma.product.update({ where: { slug }, data: { images } });

  console.log(`✓ ${product.name}`);
  console.log(`  → ${blobUrl}`);
  console.log('✅ Image importée et hébergée sur Vercel Blob.');
}

main()
  .catch((error) => {
    console.error('Erreur import image:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
