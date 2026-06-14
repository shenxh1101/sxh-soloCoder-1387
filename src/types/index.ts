export type ToolType = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle' | 'circle' | 'line' | 'select';

export interface Frame {
  id: string;
  pixels: Uint8ClampedArray;
  delay: number;
  clipInstanceId?: string;
}

export interface ClipInstance {
  id: string;
  clipId: string;
  name: string;
  startIndex: number;
  frameCount: number;
  trimStart: number;
  trimEnd: number;
  speedRatio: number;
  colorTag?: string;
}

export interface TimelineMarker {
  id: string;
  frameIndex: number;
  color: string;
  label: string;
  note: string;
  createdAt: string;
}

export interface SerializedFrame {
  id: string;
  pixels: number[];
  delay: number;
  clipInstanceId?: string;
}

export interface PixelAnimation {
  version: string;
  width: number;
  height: number;
  frames: SerializedFrame[];
  clipInstances: ClipInstance[];
  markers: TimelineMarker[];
  selectedClipInstanceIds: string[];
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

export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionState {
  selection: Selection | null;
  selectionPixels: Uint8ClampedArray | null;
  isDraggingSelection: boolean;
  isAltDragging: boolean;
  dragOffset: { x: number; y: number };
  dragPreviewPos: { x: number; y: number } | null;
  clipboardPixels: Uint8ClampedArray | null;
  clipboardSize: { width: number; height: number } | null;

  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  finishSelection: () => void;
  clearSelection: () => void;

  startDragging: (x: number, y: number, isAlt?: boolean) => boolean;
  updateDragPosition: (x: number, y: number) => void;
  finishDragging: () => void;

  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: (x: number, y: number) => void;

  flipSelectionHorizontal: () => void;
  flipSelectionVertical: () => void;

  nudgeSelection: (dx: number, dy: number) => void;
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

export interface Clip {
  id: string;
  name: string;
  frameCount: number;
  frames: SerializedFrame[];
  createdAt: string;
}

export interface DraftEntry {
  id: string;
  name: string;
  savedAt: string;
  frameCount: number;
  data: string;
  thumbnail?: string;
}
