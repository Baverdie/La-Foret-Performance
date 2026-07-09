'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedBlob, type CropArea } from './cropImage';

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  folder?: string;
  className?: string;
  // Ratio de recadrage fixe (ex. 4/5). Si défini, chaque image passe par le recadreur.
  aspect?: number;
}

// Largeur de sortie du recadrage (la hauteur découle du ratio).
const CROP_OUTPUT_WIDTH = 1080;

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  folder = 'lfp',
  className = '',
  aspect,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État du recadreur.
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  // Images présentes au début de la session de recadrage + urls produites pendant la session.
  const cropBaseRef = useRef<string[]>([]);
  const cropResultsRef = useRef<string[]>([]);

  const images = multiple
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : (value ? [value as string] : []);

  const LIMIT = 3.5 * 1024 * 1024;

  const preResizeForServer = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const MAX = 1920;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
            else { width = Math.round((width / height) * MAX); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(blob ?? new Blob([file])),
            'image/jpeg',
            0.97,
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

  const uploadFile = async (file: File): Promise<string> => {
    let payload: Blob | File = file;
    if (file.size > LIMIT) {
      try {
        payload = await preResizeForServer(file);
      } catch {
        payload = file;
      }
    }

    const formData = new FormData();
    formData.append('file', payload, file.name.replace(/\.[^.]+$/, '.jpg'));
    formData.append('folder', folder);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  // Lit un fichier en data URL (pour l'afficher dans le recadreur).
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Charge l'image suivante dans le recadreur (réinitialise position/zoom).
  const loadCropSrc = async (file: File) => {
    const src = await fileToDataUrl(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropArea(null);
    setCropSrc(src);
  };

  // Upload direct (sans recadrage) — comportement par défaut quand aucun ratio n'est imposé.
  const uploadDirect = async (files: File[]) => {
    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadFile(file)));
      if (multiple) {
        onChange([...images, ...urls]);
      } else {
        onChange(urls[0]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
      if (validFiles.length === 0) return;

      if (aspect) {
        // Recadrage imposé : on traite les fichiers un par un dans le recadreur.
        cropBaseRef.current = images;
        cropResultsRef.current = [];
        setCropQueue(validFiles);
        await loadCropSrc(validFiles[0]);
      } else {
        await uploadDirect(validFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, multiple, folder, onChange, aspect]
  );

  // Recadre l'image courante, l'uploade, puis passe à la suivante de la file.
  const confirmCrop = async () => {
    if (!cropSrc || !cropArea || !aspect) return;
    setIsUploading(true);
    try {
      const outHeight = Math.round(CROP_OUTPUT_WIDTH / aspect);
      const blob = await getCroppedBlob(cropSrc, cropArea, CROP_OUTPUT_WIDTH, outHeight);
      const file = new File([blob], `crop-${cropResultsRef.current.length}.jpg`, { type: 'image/jpeg' });
      const url = await uploadFile(file);
      cropResultsRef.current = [...cropResultsRef.current, url];
      onChange(multiple ? [...cropBaseRef.current, ...cropResultsRef.current] : url);
    } catch (error) {
      console.error('Crop/upload error:', error);
      alert('Erreur lors du recadrage');
    } finally {
      setIsUploading(false);
    }

    const rest = cropQueue.slice(1);
    setCropQueue(rest);
    if (rest.length > 0) {
      await loadCropSrc(rest[0]);
    } else {
      setCropSrc(null);
    }
  };

  // Annule le recadrage en cours et vide la file.
  const cancelCrop = () => {
    setCropQueue([]);
    setCropSrc(null);
    setCropArea(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } else {
      onChange('');
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (!multiple) return;
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onChange(newImages);
  };

  const hasSingleImage = !multiple && images.length > 0;

  return (
    <div className={className}>
      <div className={hasSingleImage ? 'flex gap-4' : ''}>
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all
            ${hasSingleImage ? 'flex-1' : ''}
            ${isDragging
              ? 'border-lfp-amber bg-lfp-amber/10'
              : 'border-white/20 hover:border-white/40 bg-[#0a0a0a]'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <svg className="animate-spin h-8 w-8 text-lfp-amber" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400 text-sm">
                Upload en cours...
              </p>
            </div>
          ) : (
            <div className={hasSingleImage ? 'flex flex-col items-center justify-center h-full' : ''}>
              <svg className={`w-12 h-12 text-gray-500 mx-auto ${hasSingleImage ? 'mb-2' : 'mb-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 mb-1 text-sm">
                {hasSingleImage ? 'Changer l\'image' : `Glisser-deposer ${multiple ? 'des images' : 'une image'} ici`}
              </p>
              {!hasSingleImage && (
                <p className="text-gray-500 text-sm">
                  ou cliquer pour ouvrir l&apos;explorateur
                </p>
              )}
            </div>
          )}
        </div>

        {hasSingleImage && (
          <div className="relative group rounded-none overflow-hidden bg-black w-40 h-40 shrink-0">
            <img
              src={images[0]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeImage(0)}
                className="p-2 bg-red-500/80 rounded-none hover:bg-red-500"
                title="Supprimer"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {multiple && images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div
              key={url + index}
              className="relative group rounded-none overflow-hidden bg-black"
              style={{ aspectRatio: aspect ?? 16 / 9 }}
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-2 bg-white/20 rounded-none hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Monter"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-2 bg-white/20 rounded-none hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Descendre"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500/80 rounded-none hover:bg-red-500"
                  title="Supprimer"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recadreur à ratio fixe */}
      {cropSrc && aspect && (
        <div className="fixed inset-0 bg-black/90 z-60 flex flex-col items-center justify-center p-4">
          <p className="text-white/70 text-sm mb-3">Recadrer l&apos;image — glisser pour positionner, molette/zoom pour ajuster</p>
          <div className="relative w-full max-w-sm h-[55vh] bg-black">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCropArea(areaPixels)}
              objectFit="contain"
            />
          </div>
          <div className="w-full max-w-sm mt-4 flex items-center gap-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-lfp-amber"
            />
          </div>
          <div className="w-full max-w-sm mt-4 flex gap-3">
            <button
              type="button"
              onClick={cancelCrop}
              className="flex-1 px-4 py-2.5 border border-white/15 text-gray-300 hover:border-white hover:text-white rounded-none transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={isUploading || !cropArea}
              className="flex-1 px-4 py-2.5 bg-white text-black font-medium rounded-none hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Upload…' : cropQueue.length > 1 ? `Valider (${cropQueue.length} restantes)` : 'Valider'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
