import type { Frame } from '@/types';
import { createEmptyPixels } from './colorUtils';

const CANVAS_SIZE = 32;

export interface SpriteSheetOptions {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  paddingX?: number;
  paddingY?: number;
  offsetX?: number;
  offsetY?: number;
  defaultDelay?: number;
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function sliceSpriteSheet(
  image: HTMLImageElement,
  options: SpriteSheetOptions
): Frame[] {
  const {
    columns,
    rows,
    frameWidth,
    frameHeight,
    paddingX = 0,
    paddingY = 0,
    offsetX = 0,
    offsetY = 0,
    defaultDelay = 100
  } = options;

  const frames: Frame[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scaleX = CANVAS_SIZE / frameWidth;
  const scaleY = CANVAS_SIZE / frameHeight;
  const scale = Math.min(scaleX, scaleY);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const srcX = offsetX + col * (frameWidth + paddingX * 2);
      const srcY = offsetY + row * (frameHeight + paddingY * 2);

      canvas.width = frameWidth;
      canvas.height = frameHeight;
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        srcX, srcY, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      );

      const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
      const pixels = resizePixels(imageData.data, frameWidth, frameHeight, CANVAS_SIZE, CANVAS_SIZE);

      frames.push({
        id: `frame-${Date.now()}-${row * columns + col}`,
        pixels,
        delay: defaultDelay
      });
    }
  }

  return frames;
}

function resizePixels(
  srcData: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8ClampedArray {
  const dst = createEmptyPixels(dstWidth, dstHeight);
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * srcWidth + srcX) * 4;
      const dstIdx = (y * dstWidth + x) * 4;

      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return dst;
}

export async function importSpriteSheet(
  file: File,
  options: SpriteSheetOptions
): Promise<Frame[]> {
  const image = await loadImage(file);
  return sliceSpriteSheet(image, options);
}

export function autoDetectFrames(image: HTMLImageElement): { columns: number; rows: number; frameWidth: number; frameHeight: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  let frameWidth = image.width;
  let frameHeight = image.height;

  for (let x = 1; x < image.width; x++) {
    let isSeparator = true;
    for (let y = 0; y < image.height; y++) {
      const idx = (y * image.width + x) * 4;
      if (data[idx + 3] !== 0) {
        isSeparator = false;
        break;
      }
    }
    if (isSeparator && x < image.width / 2) {
      frameWidth = x;
      break;
    }
  }

  for (let y = 1; y < image.height; y++) {
    let isSeparator = true;
    for (let x = 0; x < image.width; x++) {
      const idx = (y * image.width + x) * 4;
      if (data[idx + 3] !== 0) {
        isSeparator = false;
        break;
      }
    }
    if (isSeparator && y < image.height / 2) {
      frameHeight = y;
      break;
    }
  }

  const columns = Math.floor(image.width / frameWidth);
  const rows = Math.floor(image.height / frameHeight);

  return {
    columns: Math.max(1, columns),
    rows: Math.max(1, rows),
    frameWidth,
    frameHeight
  };
}
