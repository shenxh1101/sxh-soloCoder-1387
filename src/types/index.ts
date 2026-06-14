export type ToolType = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle' | 'circle' | 'line';

export interface Frame {
  id: string;
  pixels: Uint8ClampedArray;
  delay: number;
}

export interface SerializedFrame {
  id: string;
  pixels: number[];
  delay: number;
}

export interface PixelAnimation {
  version: string;
  width: number;
  height: number;
  frames: SerializedFrame[];
  createdAt: number;
  updatedAt: number;
}

export interface ToolState {
  currentTool: ToolType;
  brushSize: number;
  primaryColor: string;
  secondaryColor: string;
  recentColors: string[];
}

export interface CanvasState {
  zoom: number;
  showGrid: boolean;
  showOnionSkin: boolean;
  onionSkinOpacity: number;
  onionSkinFrames: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export type RGBA = [number, number, number, number];
