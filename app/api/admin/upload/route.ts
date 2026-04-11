import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-utils';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import crypto from 'crypto';

// Paramètres d'optimisation selon le dossier cible
// Retourne les dimensions max et la qualité mozjpeg adaptés au contexte d'affichage
function getOptimizationSettings(folder: string): { width: number; height: number; quality: number } {
  if (folder.includes('crew') || folder.includes('members')) {
    return { width: 800, height: 800, quality: 88 };
  }
  if (folder.includes('events')) {
    return { width: 1920, height: 1080, quality: 88 };
  }
  // Voitures : plein écran modal, on garde une résolution maximale
  return { width: 1920, height: 1920, quality: 88 };
}

export async function POST(request: NextRequest) {
  const { error } = await checkAuth();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { width, height, quality } = getOptimizationSettings(folder);

    const optimized = await sharp(buffer)
      .rotate() // corrige l'orientation EXIF automatiquement
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const folderMap: Record<string, string> = {
      'lfp/crew': 'lfp/crew',
      'lfp/cars': 'lfp/cars',
      'lfp/events': 'lfp/events',
      'crew': 'lfp/crew',
      'cars': 'lfp/cars',
      'events': 'lfp/events',
    };
    const targetFolder = folderMap[folder] || 'lfp/uploads';

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `${timestamp}-${uniqueId}.jpg`;

    const blob = await put(`${targetFolder}/${filename}`, optimized, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await checkAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: "URL de l'image requise" }, { status: 400 });
    }

    if (imageUrl.includes('.blob.vercel-storage.com') || imageUrl.includes('.public.blob.vercel-storage.com')) {
      await del(imageUrl);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
