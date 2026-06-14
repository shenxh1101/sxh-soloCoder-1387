import type { RGBA } from '@/types';

export function hexToRgba(hex: string): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      255
    ];
  }
  return [0, 0, 0, 255];
}

export function rgbaToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbaArrayToHex(rgba: Uint8ClampedArray, index: number): string {
  const i = index * 4;
  return rgbaToHex(rgba[i], rgba[i + 1], rgba[i + 2]);
}

export function isColorTransparent(rgba: Uint8ClampedArray, index: number): boolean {
  return rgba[index * 4 + 3] === 0;
}

export function setPixelColor(
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  color: RGBA
): void {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

export function getPixelColor(
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): RGBA | null {
  if (x < 0 || y < 0 || x >= width || y >= width) return null;
  const index = (y * width + x) * 4;
  return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
}

export function colorsMatch(
  pixels: Uint8ClampedArray,
  index: number,
  target: RGBA
): boolean {
  const i = index * 4;
  return (
    pixels[i] === target[0] &&
    pixels[i + 1] === target[1] &&
    pixels[i + 2] === target[2] &&
    pixels[i + 3] === target[3]
  );
}

export function createEmptyPixels(width: number, height: number): Uint8ClampedArray {
  return new Uint8ClampedArray(width * height * 4);
}

export function copyPixels(pixels: Uint8ClampedArray): Uint8ClampedArray {
  return new Uint8ClampedArray(pixels);
}
