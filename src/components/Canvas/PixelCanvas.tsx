import { useRef, useEffect, useCallback, useState } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { useToolStore } from '@/store/useToolStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { hexToRgba, copyPixels } from '@/utils/colorUtils';
import { drawLine, drawBrush, floodFill, drawRectangle, drawCircle } from '@/utils/pixelUtils';
import type { RGBA } from '@/types';

const CANVAS_SIZE = 32;

export default function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewPixelsRef = useRef<Uint8ClampedArray | null>(null);

  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const updateCurrentFramePixels = usePixelStore(state => state.updateCurrentFramePixels);
  const pushHistory = usePixelStore(state => state.pushHistory);

  const currentTool = useToolStore(state => state.currentTool);
  const brushSize = useToolStore(state => state.brushSize);
  const primaryColor = useToolStore(state => state.primaryColor);
  const secondaryColor = useToolStore(state => state.secondaryColor);
  const setPrimaryColor = useToolStore(state => state.setPrimaryColor);

  const zoom = useCanvasStore(state => state.zoom);
  const showGrid = useCanvasStore(state => state.showGrid);
  const showOnionSkin = useCanvasStore(state => state.showOnionSkin);
  const onionSkinOpacity = useCanvasStore(state => state.onionSkinOpacity);
  const onionSkinFrames = useCanvasStore(state => state.onionSkinFrames);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const currentFrame = frames[currentFrameIndex];

  const getPixelPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) {
      return null;
    }

    return { x, y };
  }, [zoom]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = CANVAS_SIZE * zoom;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (showOnionSkin) {
      for (let i = 1; i <= onionSkinFrames; i++) {
        const prevIndex = currentFrameIndex - i;
        if (prevIndex >= 0) {
          const prevFrame = frames[prevIndex];
          drawOnionSkinFrame(ctx, prevFrame.pixels, zoom, onionSkinOpacity * (1 - i * 0.2), false);
        }

        const nextIndex = currentFrameIndex + i;
        if (nextIndex < frames.length) {
          const nextFrame = frames[nextIndex];
          drawOnionSkinFrame(ctx, nextFrame.pixels, zoom, onionSkinOpacity * (1 - i * 0.2), true);
        }
      }
    }

    const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
    const pixels = previewPixelsRef.current || currentFrame.pixels;
    imageData.data.set(pixels);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_SIZE;
    tempCanvas.height = CANVAS_SIZE;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, canvasSize, canvasSize);

    if (showGrid && zoom >= 4) {
      drawGrid(ctx, canvasSize, zoom);
    }

    if (cursorPos && currentTool !== 'eyedropper') {
      drawCursorPreview(ctx, cursorPos.x, cursorPos.y, zoom, brushSize, currentTool);
    }
  }, [currentFrame, frames, currentFrameIndex, zoom, showGrid, showOnionSkin, onionSkinOpacity, onionSkinFrames, cursorPos, brushSize, currentTool]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPixelPos(e);
    if (!pos || !currentFrame) return;

    isDrawingRef.current = true;
    lastPosRef.current = pos;

    const color = e.button === 2 ? hexToRgba(secondaryColor) : hexToRgba(primaryColor);

    if (currentTool === 'eyedropper') {
      const index = (pos.y * CANVAS_SIZE + pos.x) * 4;
      const pixels = currentFrame.pixels;
      const hex = '#' + [pixels[index], pixels[index + 1], pixels[index + 2]]
        .map(v => v.toString(16).padStart(2, '0')).join('');
      setPrimaryColor(hex);
      isDrawingRef.current = false;
      return;
    }

    if (currentTool === 'fill') {
      const newPixels = copyPixels(currentFrame.pixels);
      floodFill(newPixels, pos.x, pos.y, CANVAS_SIZE, CANVAS_SIZE, color);
      updateCurrentFramePixels(newPixels);
      pushHistory();
      isDrawingRef.current = false;
      return;
    }

    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
      shapeStartRef.current = pos;
      previewPixelsRef.current = copyPixels(currentFrame.pixels);
      return;
    }

    previewPixelsRef.current = copyPixels(currentFrame.pixels);
    drawBrush(previewPixelsRef.current, pos.x, pos.y, CANVAS_SIZE, color, brushSize);
    updateCurrentFramePixels(previewPixelsRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPixelPos(e);
    setCursorPos(pos);

    if (!isDrawingRef.current || !pos || !previewPixelsRef.current) return;

    const color = e.buttons === 2 ? hexToRgba(secondaryColor) : hexToRgba(primaryColor);
    const lastPos = lastPosRef.current;

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      const drawColor = currentTool === 'eraser' ? [0, 0, 0, 0] as RGBA : color;
      if (lastPos) {
        drawLine(previewPixelsRef.current, lastPos.x, lastPos.y, pos.x, pos.y, CANVAS_SIZE, drawColor, brushSize);
      }
      lastPosRef.current = pos;
      updateCurrentFramePixels(previewPixelsRef.current);
    }

    if ((currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') && shapeStartRef.current) {
      const start = shapeStartRef.current;
      previewPixelsRef.current = copyPixels(currentFrame.pixels);

      if (currentTool === 'rectangle') {
        drawRectangle(previewPixelsRef.current, start.x, start.y, pos.x, pos.y, CANVAS_SIZE, color);
      } else if (currentTool === 'circle') {
        const radius = Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y));
        drawCircle(previewPixelsRef.current, start.x, start.y, radius, CANVAS_SIZE, color);
      } else if (currentTool === 'line') {
        drawLine(previewPixelsRef.current, start.x, start.y, pos.x, pos.y, CANVAS_SIZE, color, brushSize);
      }

      updateCurrentFramePixels(previewPixelsRef.current);
    }
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      pushHistory();
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
    shapeStartRef.current = null;
    previewPixelsRef.current = null;
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    if (isDrawingRef.current) {
      pushHistory();
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
    shapeStartRef.current = null;
    previewPixelsRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full overflow-hidden bg-pixel-bg p-4">
      <div className="relative">
        <div className="checkerboard border-4 border-pixel-border" style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)' }}>
          <canvas
            ref={canvasRef}
            className="pixelated cursor-crosshair block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
          />
        </div>

        {cursorPos && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-pixel-text-muted font-mono bg-pixel-surface px-2 py-1 border border-pixel-border">
            X: {cursorPos.x} Y: {cursorPos.y}
          </div>
        )}
      </div>
    </div>
  );
}

function drawOnionSkinFrame(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8ClampedArray,
  zoom: number,
  opacity: number,
  isNext: boolean
) {
  const canvasSize = CANVAS_SIZE * zoom;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = CANVAS_SIZE;
  tempCanvas.height = CANVAS_SIZE;
  const tempCtx = tempCanvas.getContext('2d')!;

  const imageData = tempCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    data[i] = isNext ? 100 : 200;
    data[i + 1] = isNext ? 200 : 100;
    data[i + 2] = 255;
    data[i + 3] = pixels[i + 3] * opacity;
  }

  tempCtx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = opacity;
  ctx.drawImage(tempCanvas, 0, 0, canvasSize, canvasSize);
  ctx.globalAlpha = 1;
}

function drawGrid(ctx: CanvasRenderingContext2D, canvasSize: number, zoom: number) {
  ctx.strokeStyle = 'rgba(61, 63, 102, 0.5)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= CANVAS_SIZE; x++) {
    ctx.beginPath();
    ctx.moveTo(x * zoom + 0.5, 0);
    ctx.lineTo(x * zoom + 0.5, canvasSize);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_SIZE; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * zoom + 0.5);
    ctx.lineTo(canvasSize, y * zoom + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 2;

  for (let x = 0; x <= CANVAS_SIZE; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x * zoom + 0.5, 0);
    ctx.lineTo(x * zoom + 0.5, canvasSize);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_SIZE; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y * zoom + 0.5);
    ctx.lineTo(canvasSize, y * zoom + 0.5);
    ctx.stroke();
  }
}

function drawCursorPreview(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  zoom: number,
  brushSize: number,
  tool: string
) {
  const px = x * zoom;
  const py = y * zoom;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  if (tool === 'pencil' || tool === 'eraser') {
    const size = brushSize * zoom;
    const offset = brushSize % 2 === 0 ? zoom / 2 : 0;
    ctx.strokeRect(px - size / 2 + offset, py - size / 2 + offset, size, size);
  } else if (tool === 'fill' || tool === 'eyedropper') {
    ctx.strokeRect(px, py, zoom, zoom);
  } else {
    ctx.strokeRect(px, py, zoom, zoom);
  }

  ctx.setLineDash([]);
}
