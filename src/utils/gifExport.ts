import GIF from 'gif.js';
import type { Frame } from '@/types';

const CANVAS_SIZE = 32;

interface GifExportOptions {
  scale?: number;
  loop?: number;
  quality?: number;
  onProgress?: (progress: number) => void;
}

export function exportGif(
  frames: Frame[],
  options: GifExportOptions = {}
): Promise<Blob> {
  const {
    scale = 4,
    loop = 0,
    quality = 10,
    onProgress
  } = options;

  return new Promise((resolve, reject) => {
    const width = CANVAS_SIZE * scale;
    const height = CANVAS_SIZE * scale;

    const gif = new GIF({
      workers: 2,
      quality,
      width,
      height,
      workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    } as any);

    frames.forEach((frame) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
      imageData.data.set(frame.pixels);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_SIZE;
      tempCanvas.height = CANVAS_SIZE;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(imageData, 0, 0);

      ctx.drawImage(tempCanvas, 0, 0, width, height);

      gif.addFrame(canvas, { delay: frame.delay, copy: true });
    });

    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });

    gif.on('progress', (progress: number) => {
      onProgress?.(progress);
    });

    try {
      gif.render();
    } catch (error) {
      reject(error);
    }
  });
}

export async function exportGifAndDownload(
  frames: Frame[],
  options: GifExportOptions = {}
): Promise<void> {
  const blob = await exportGif(frames, options);
  const link = document.createElement('a');
  link.download = `pixel-animation-${Date.now()}.gif`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
