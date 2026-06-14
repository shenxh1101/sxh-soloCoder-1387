import type { Frame, PixelAnimation } from '@/types';
import { copyPixels } from './colorUtils';

const CANVAS_SIZE = 32;

export function frameToCanvas(frame: Frame, scale: number = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE * scale;
  canvas.height = CANVAS_SIZE * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  imageData.data.set(frame.pixels);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = CANVAS_SIZE;
  tempCanvas.height = CANVAS_SIZE;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(tempCanvas, 0, 0, CANVAS_SIZE * scale, CANVAS_SIZE * scale);

  return canvas;
}

export function exportFrameAsPNG(frame: Frame, scale: number = 8): void {
  const canvas = frameToCanvas(frame, scale);
  const link = document.createElement('a');
  link.download = `frame-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function exportAllFramesAsPNG(frames: Frame[], scale: number = 8): void {
  frames.forEach((frame, index) => {
    setTimeout(() => {
      const canvas = frameToCanvas(frame, scale);
      const link = document.createElement('a');
      link.download = `frame-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }, index * 100);
  });
}

export function exportFramesAsJSON(
  frames: Frame[],
  width: number = CANVAS_SIZE,
  height: number = CANVAS_SIZE
): void {
  const animation: PixelAnimation = {
    version: '1.0',
    width,
    height,
    frames: frames.map(f => ({
      id: f.id,
      pixels: Array.from(f.pixels),
      delay: f.delay
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const blob = new Blob([JSON.stringify(animation, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `pixel-animation-${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export function importFramesFromJSON(file: File): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as PixelAnimation;
        const frames: Frame[] = data.frames.map(f => ({
          id: f.id,
          pixels: new Uint8ClampedArray(f.pixels),
          delay: f.delay
        }));
        resolve(frames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function saveProject(
  frames: Frame[],
  width: number = CANVAS_SIZE,
  height: number = CANVAS_SIZE
): void {
  const animation: PixelAnimation = {
    version: '1.0',
    width,
    height,
    frames: frames.map(f => ({
      id: f.id,
      pixels: Array.from(f.pixels),
      delay: f.delay
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const blob = new Blob([JSON.stringify(animation, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `pixel-project-${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export function loadProject(file: File): Promise<Frame[]> {
  return importFramesFromJSON(file);
}

export function createFrameThumbnailDataUrl(frame: Frame, size: number = 64): string {
  const scale = size / CANVAS_SIZE;
  const canvas = frameToCanvas(frame, scale);
  return canvas.toDataURL('image/png');
}
