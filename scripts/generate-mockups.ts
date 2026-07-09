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

// Mockup t-shirt réaliste (packshot de face) : silhouette à épaules tombantes, col côtelé,
// ombrages de tissu multi-couches, plis discrets, ombre au sol, logo imprimé en grand.
// Parametres: fabric (couleur tissu), accent (halo du fond), logo (data URI).
function tshirtSvg(fabric: string, accent: string): string {
  // Corps du tee, symétrique autour de x=500.
  const body = `
    M 395 262
    C 360 268 330 284 310 300
    C 282 328 248 385 232 428
    C 252 452 275 468 298 478
    C 315 463 332 451 346 444
    C 340 610 340 778 346 934
    C 448 952 552 952 654 934
    C 660 778 660 610 654 444
    C 668 451 685 463 702 478
    C 725 468 748 452 768 428
    C 752 385 718 328 690 300
    C 670 284 640 268 605 262
    C 572 294 428 294 395 262
    Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${background(accent)}
    <defs>
      <clipPath id="teeClip"><path d="${body}"/></clipPath>
      <linearGradient id="sideL" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sideR" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="hemShade" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="chestLight" cx="50%" cy="34%" r="46%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.07"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
      <filter id="softer" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
    </defs>

    <!-- ombre au sol -->
    <ellipse cx="500" cy="955" rx="255" ry="26" fill="#000" opacity="0.5" filter="url(#soft)"/>

    <!-- corps -->
    <path d="${body}" fill="${fabric}"/>

    <!-- ombrages et lumière (clippés dans le tee) -->
    <g clip-path="url(#teeClip)">
      <rect x="220" y="240" width="180" height="720" fill="url(#sideL)"/>
      <rect x="600" y="240" width="180" height="720" fill="url(#sideR)"/>
      <rect x="220" y="700" width="560" height="260" fill="url(#hemShade)"/>
      <rect x="220" y="240" width="560" height="720" fill="url(#chestLight)"/>
      <!-- creux d'aisselles -->
      <ellipse cx="340" cy="452" rx="42" ry="26" fill="#000" opacity="0.28" filter="url(#soft)"/>
      <ellipse cx="660" cy="452" rx="42" ry="26" fill="#000" opacity="0.28" filter="url(#soft)"/>
      <!-- plis discrets -->
      <path d="M 358 560 C 374 640 370 740 360 852" stroke="#000" stroke-opacity="0.13" stroke-width="9" fill="none" filter="url(#softer)"/>
      <path d="M 642 560 C 626 640 630 740 640 852" stroke="#000" stroke-opacity="0.13" stroke-width="9" fill="none" filter="url(#softer)"/>
      <path d="M 430 880 C 470 894 530 894 570 880" stroke="#000" stroke-opacity="0.10" stroke-width="8" fill="none" filter="url(#softer)"/>
      <path d="M 455 545 C 462 620 460 700 456 760" stroke="#fff" stroke-opacity="0.05" stroke-width="10" fill="none" filter="url(#softer)"/>
      <!-- ourlet -->
      <path d="M 350 918 C 450 936 550 936 650 918" stroke="#000" stroke-opacity="0.22" stroke-width="2.5" fill="none"/>
      <path d="M 350 908 C 450 926 550 926 650 908" stroke="#000" stroke-opacity="0.12" stroke-width="2" fill="none"/>
      <!-- coutures de manches -->
      <path d="M 316 306 C 330 358 340 402 346 444" stroke="#000" stroke-opacity="0.16" stroke-width="2.5" fill="none"/>
      <path d="M 684 306 C 670 358 660 402 654 444" stroke="#000" stroke-opacity="0.16" stroke-width="2.5" fill="none"/>
    </g>

    <!-- col côtelé -->
    <path d="M 388 258 C 428 300 572 300 612 258 C 604 246 596 240 588 236 C 556 270 444 270 412 236 C 404 240 396 246 388 258 Z"
      fill="${fabric}" stroke="#000" stroke-opacity="0.3" stroke-width="2"/>
    <path d="M 400 252 C 436 288 564 288 600 252" stroke="#000" stroke-opacity="0.3" stroke-width="2.5" fill="none"/>
    <path d="M 412 240 C 444 272 556 272 588 240" stroke="#000" stroke-opacity="0.18" stroke-width="2" fill="none"/>
    <!-- ombre du col sur la poitrine -->
    <path d="M 400 262 C 436 300 564 300 600 262 C 566 312 434 312 400 262 Z" fill="#000" opacity="0.16" filter="url(#softer)"/>
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
  const accent = '#ffce47';
  const green = '#ffce47';

  // Logo en buffer : composité par sharp APRÈS le rendu SVG (l'<image> SVG rend mal via librsvg).
  // Bords fondus par un masque alpha adouci → le carré du print se fond dans le tissu (sérigraphie).
  const logoRes = await fetch(LOGO_URL);
  const featherMask = await sharp(
    Buffer.from(
      `<svg width="264" height="264"><defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter></defs><rect x="18" y="18" width="228" height="228" rx="10" fill="#fff" filter="url(#b)"/></svg>`
    )
  )
    .png()
    .toBuffer();
  const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
  // Tee sombre : bords fondus (le print se fond dans le tissu).
  const printFeathered = await sharp(logoBuffer)
    .resize(264, 264)
    .ensureAlpha()
    .composite([{ input: featherMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  // Tee clair : bords nets à coins arrondis (un print sombre contrasté doit rester franc).
  const crispMask = await sharp(
    Buffer.from(`<svg width="264" height="264"><rect x="2" y="2" width="260" height="260" rx="8" fill="#fff"/></svg>`)
  )
    .png()
    .toBuffer();
  const printCrisp = await sharp(logoBuffer)
    .resize(264, 264)
    .ensureAlpha()
    .composite([{ input: crispMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // slug produit -> SVG du mockup (t-shirts uniquement : stickers = vraie photo, casquette inchangée)
  const mockups: { slug: string; svg: string; print: Buffer }[] = [
    { slug: 't-shirt-lfp-classic', svg: tshirtSvg('#17181b', accent), print: printFeathered },
    { slug: 't-shirt-drop-ete-precommande', svg: tshirtSvg('#c9b696', green), print: printCrisp },
  ];

  const preview = process.argv.includes('--preview');

  for (const mockup of mockups) {
    // Rendu du vêtement puis impression du logo sur la poitrine.
    const garment = await render(mockup.svg);
    const png = await sharp(garment)
      .composite([{ input: mockup.print, left: 368, top: 392 }])
      .png()
      .toBuffer();

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
