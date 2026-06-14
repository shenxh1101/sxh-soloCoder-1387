import type { Point, RGBA } from '@/types';
import { setPixelColor, colorsMatch, copyPixels } from './colorUtils';

export function drawLine(
  pixels: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  color: RGBA,
  brushSize: number = 1
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    drawBrush(pixels, x, y, width, color, brushSize);

    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export function drawBrush(
  pixels: Uint8ClampedArray,
  cx: number,
  cy: number,
  width: number,
  color: RGBA,
  size: number
): void {
  const radius = Math.floor(size / 2);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (size % 2 === 0) {
        if (dx < 0 && dy < 0) continue;
      }
      setPixelColor(pixels, cx + dx, cy + dy, width, color);
    }
  }
}

export function floodFill(
  pixels: Uint8ClampedArray,
  startX: number,
  startY: number,
  width: number,
  height: number,
  fillColor: RGBA
): void {
  const startIndex = (startY * width + startX) * 4;
  const targetColor: RGBA = [
    pixels[startIndex],
    pixels[startIndex + 1],
    pixels[startIndex + 2],
    pixels[startIndex + 3]
  ];

  if (
    targetColor[0] === fillColor[0] &&
    targetColor[1] === fillColor[1] &&
    targetColor[2] === fillColor[2] &&
    targetColor[3] === fillColor[3]
  ) {
    return;
  }

  const stack: Point[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const point = stack.pop()!;
    const key = `${point.x},${point.y}`;

    if (visited.has(key)) continue;
    if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) continue;

    const idx = (point.y * width + point.x) * 4;
    if (!colorsMatch(pixels, point.y * width + point.x, targetColor)) continue;

    visited.add(key);
    pixels[idx] = fillColor[0];
    pixels[idx + 1] = fillColor[1];
    pixels[idx + 2] = fillColor[2];
    pixels[idx + 3] = fillColor[3];

    stack.push({ x: point.x + 1, y: point.y });
    stack.push({ x: point.x - 1, y: point.y });
    stack.push({ x: point.x, y: point.y + 1 });
    stack.push({ x: point.x, y: point.y - 1 });
  }
}

export function drawRectangle(
  pixels: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  color: RGBA,
  filled: boolean = false
): void {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);

  if (filled) {
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        setPixelColor(pixels, x, y, width, color);
      }
    }
  } else {
    for (let x = left; x <= right; x++) {
      setPixelColor(pixels, x, top, width, color);
      setPixelColor(pixels, x, bottom, width, color);
    }
    for (let y = top + 1; y < bottom; y++) {
      setPixelColor(pixels, left, y, width, color);
      setPixelColor(pixels, right, y, width, color);
    }
  }
}

export function drawCircle(
  pixels: Uint8ClampedArray,
  cx: number,
  cy: number,
  radius: number,
  width: number,
  color: RGBA,
  filled: boolean = false
): void {
  if (filled) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius + radius * 0.5) {
          setPixelColor(pixels, cx + x, cy + y, width, color);
        }
      }
    }
  } else {
    let x = radius;
    let y = 0;
    let err = 0;

    while (x >= y) {
      setPixelColor(pixels, cx + x, cy + y, width, color);
      setPixelColor(pixels, cx + y, cy + x, width, color);
      setPixelColor(pixels, cx - y, cy + x, width, color);
      setPixelColor(pixels, cx - x, cy + y, width, color);
      setPixelColor(pixels, cx - x, cy - y, width, color);
      setPixelColor(pixels, cx - y, cy - x, width, color);
      setPixelColor(pixels, cx + y, cy - x, width, color);
      setPixelColor(pixels, cx + x, cy - y, width, color);

      if (err <= 0) {
        y += 1;
        err += 2 * y + 1;
      }
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }
  }
}

export function clearPixels(pixels: Uint8ClampedArray): void {
  pixels.fill(0);
}

export function flipHorizontal(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const result = copyPixels(pixels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (y * width + (width - 1 - x)) * 4;
      result[dstIdx] = pixels[srcIdx];
      result[dstIdx + 1] = pixels[srcIdx + 1];
      result[dstIdx + 2] = pixels[srcIdx + 2];
      result[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  return result;
}

export function flipVertical(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const result = copyPixels(pixels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((height - 1 - y) * width + x) * 4;
      result[dstIdx] = pixels[srcIdx];
      result[dstIdx + 1] = pixels[srcIdx + 1];
      result[dstIdx + 2] = pixels[srcIdx + 2];
      result[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  return result;
}
