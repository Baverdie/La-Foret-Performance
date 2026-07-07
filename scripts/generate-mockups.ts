import { config } from 'dotenv';
config({ path: '.env.local' });

import sharp from 'sharp';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';

const prisma = new PrismaClient();

const LOGO_URL = 'https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg';
const W = 1000;
const H = 1250;

// Recupere le logo et le convertit en data URI base64 (pour l'embarquer dans le SVG).
async function fetchLogoDataUri(): Promise<string> {
  const res = await fetch(LOGO_URL);
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

// Fond commun : dégradé sombre + halo d'accent, grain léger.
function background(accent: string): string {
  return `
    <defs>
      <radialGradient id="bg" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#1d1d1d"/>
        <stop offset="60%" stop-color="#101010"/>
        <stop offset="100%" stop-color="#070707"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="34%" r="40%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="fabricShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>`;
}

// Logo circulaire pose sur le vetement, avec un leger contour.
function logoBadge(logo: string, cx: number, cy: number, size: number, ring: string): string {
  const r = size / 2;
  return `
    <defs>
      <clipPath id="logoClip-${cx}-${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#000000" opacity="0.25"/>
    <image href="${logo}" x="${cx - r}" y="${cy - r}" width="${size}" height="${size}"
      clip-path="url(#logoClip-${cx}-${cy})" preserveAspectRatio="xMidYMid slice"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ring}" stroke-width="3" opacity="0.85"/>`;
}

// Mockup t-shirt (vue de face a plat). Parametres: couleur tissu, accent, logo.
function tshirtSvg(fabric: string, accent: string, logo: string): string {
  const shape = `
    M500 285
    C460 285 420 272 388 250
    L205 326 C194 331 191 345 198 356 L240 470 C245 482 257 488 268 484 L300 470
    L300 980 C300 994 311 1005 325 1005 L675 1005 C689 1005 700 994 700 980 L700 470
    L732 484 C743 488 755 482 760 470 L802 356 C809 345 806 331 795 326
    L612 250 C580 272 540 285 500 285 Z`;
  const shirt = `
    <g>
      <path d="${shape}" fill="${fabric}" stroke="#000000" stroke-opacity="0.35" stroke-width="2"/>
      <path d="${shape}" fill="url(#fabricShade)"/>
      <path d="M388 250 C430 296 570 296 612 250 C570 274 430 274 388 250 Z" fill="#000000" fill-opacity="0.22"/>
      <path d="M398 256 C436 294 564 294 602 256" fill="none" stroke="${accent}" stroke-width="4" opacity="0.6"/>
      <path d="M300 470 L300 500 M700 470 L700 500" stroke="#000000" stroke-opacity="0.18" stroke-width="3"/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${background(accent)}
    ${shirt}
    ${logoBadge(logo, 500, 470, 210, accent)}
    <rect x="425" y="650" width="150" height="6" rx="3" fill="${accent}" opacity="0.55"/>
  </svg>`;
}

// Mockup casquette (vue de face). Parametres: accent, logo.
function capSvg(accent: string, logo: string): string {
  const fabric = '#15171a';
  const crown = `M262 648 C256 470 330 388 500 388 C670 388 744 470 738 648 Z`;
  const visor = `M232 652 Q500 632 768 652 Q628 748 500 750 Q372 748 232 652 Z`;
  const cap = `
    <g>
      <path d="${visor}" fill="${fabric}" stroke="#000" stroke-opacity="0.4" stroke-width="2"/>
      <path d="${visor}" fill="#000000" fill-opacity="0.30"/>
      <path d="${crown}" fill="${fabric}" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>
      <path d="${crown}" fill="url(#fabricShade)"/>
      <path d="M500 392 C432 470 416 560 422 644" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M500 392 C568 470 584 560 578 644" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="266" y="636" width="468" height="16" fill="#000000" fill-opacity="0.22"/>
      <rect x="430" y="640" width="140" height="8" rx="4" fill="${accent}" opacity="0.55"/>
      <circle cx="500" cy="394" r="13" fill="${fabric}" stroke="#000" stroke-opacity="0.4" stroke-width="2"/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${background(accent)}
    ${cap}
    ${logoBadge(logo, 500, 528, 188, accent)}
  </svg>`;
}

// Mockup pack de stickers (die-cut sur fond sombre). Parametres: accent, logo.
function stickerSvg(accent: string, logo: string): string {
  // Trois stickers : badge rond, losange, pastille.
  const die = (cx: number, cy: number, rot: number, shape: string) => `
    <g transform="rotate(${rot} ${cx} ${cy})">
      <g filter="url(#sh)">${shape}</g>
    </g>`;
  const round = (cx: number, cy: number) => `
    <circle cx="${cx}" cy="${cy}" r="150" fill="#ffffff"/>
    <circle cx="${cx}" cy="${cy}" r="138" fill="#0d0d0d"/>
    <circle cx="${cx}" cy="${cy}" r="138" fill="none" stroke="${accent}" stroke-width="6" opacity="0.8"/>`;
  const diamond = (cx: number, cy: number) => `
    <rect x="${cx - 120}" y="${cy - 120}" width="240" height="240" rx="34" fill="#ffffff"/>
    <rect x="${cx - 108}" y="${cy - 108}" width="216" height="216" rx="28" fill="#0d0d0d"/>
    <rect x="${cx - 108}" y="${cy - 108}" width="216" height="216" rx="28" fill="none" stroke="${accent}" stroke-width="6" opacity="0.8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${background(accent)}
    <defs>
      <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>
    ${die(360, 470, -10, diamond(360, 470))}
    ${die(660, 760, 12, round(660, 760))}
    ${die(360, 470, -10, '')}
    ${logoBadge(logo, 360, 470, 150, accent)}
    ${logoBadge(logo, 660, 760, 150, accent)}
  </svg>`;
}

// Rendu SVG -> PNG via sharp.
async function render(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Pousse un buffer PNG sur Vercel Blob et renvoie l'URL publique.
async function upload(slug: string, png: Buffer): Promise<string> {
  const blob = await put(`lfp/shop/mockup-${slug}-${crypto.randomBytes(5).toString('hex')}.png`, png, {
    access: 'public',
    contentType: 'image/png',
  });
  return blob.url;
}

async function main() {
  const logo = await fetchLogoDataUri();
  const accent = '#ff4d00';
  const green = '#3f7d28';

  // slug produit -> SVG du mockup
  const mockups: { slug: string; svg: string }[] = [
    { slug: 't-shirt-lfp-classic', svg: tshirtSvg('#15171a', accent, logo) },
    { slug: 't-shirt-drop-ete-precommande', svg: tshirtSvg('#cdbb9b', green, logo) },
    { slug: 'casquette-lfp', svg: capSvg(accent, logo) },
    { slug: 'pack-stickers-x8', svg: stickerSvg(accent, logo) },
  ];

  const preview = process.argv.includes('--preview');

  for (const mockup of mockups) {
    const png = await render(mockup.svg);

    if (preview) {
      const path = `/tmp/mockup-${mockup.slug}.png`;
      await writeFile(path, png);
      console.log(`🖼  aperçu : ${path}`);
      continue;
    }

    const product = await prisma.product.findUnique({ where: { slug: mockup.slug } });
    if (!product) {
      console.warn(`⚠ Produit introuvable : ${mockup.slug}`);
      continue;
    }
    const url = await upload(mockup.slug, png);
    await prisma.product.update({ where: { slug: mockup.slug }, data: { images: [url] } });
    console.log(`✓ ${product.name}\n  → ${url}`);
  }

  console.log(preview ? '✅ Aperçus générés dans /tmp' : '✅ Mockups générés et appliqués.');
}

main()
  .catch((error) => {
    console.error('Erreur mockups:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
