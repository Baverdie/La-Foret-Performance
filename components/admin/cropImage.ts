// Zone de recadrage en pixels (fournie par react-easy-crop).
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Charge une image à partir d'une source (data URL ou URL).
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

// Recadre une image source selon une zone en pixels, vers des dimensions cibles fixes.
// Parametres: src (image source), area (zone en pixels), outWidth/outHeight (sortie).
// Sortie: Blob JPEG recadré aux dimensions cibles.
export async function getCroppedBlob(
  src: string,
  area: CropArea,
  outWidth: number,
  outHeight: number
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponible');

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Recadrage échoué'))),
      'image/jpeg',
      0.92
    );
  });
}
