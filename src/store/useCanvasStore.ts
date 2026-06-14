import { create } from 'zustand';

interface CanvasState {
  zoom: number;
  showGrid: boolean;
  showOnionSkin: boolean;
  onionSkinOpacity: number;
  onionSkinFrames: number;
  minZoom: number;
  maxZoom: number;

  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setShowGrid: (show: boolean) => void;
  toggleGrid: () => void;
  setShowOnionSkin: (show: boolean) => void;
  toggleOnionSkin: () => void;
  setOnionSkinOpacity: (opacity: number) => void;
  setOnionSkinFrames: (frames: number) => void;
}

const ZOOM_LEVELS = [1, 2, 4, 8, 16, 32];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  zoom: 12,
  showGrid: true,
  showOnionSkin: true,
  onionSkinOpacity: 0.3,
  onionSkinFrames: 1,
  minZoom: 1,
  maxZoom: 32,

  setZoom: (zoom: number) => {
    const { minZoom, maxZoom } = get();
    set({ zoom: Math.max(minZoom, Math.min(maxZoom, zoom)) });
  },

  zoomIn: () => {
    const { zoom } = get();
    const levels = ZOOM_LEVELS;
    const next = levels.find(l => l > zoom);
    if (next) {
      set({ zoom: next });
    } else {
      set({ zoom: Math.min(zoom * 2, get().maxZoom) });
    }
  },

  zoomOut: () => {
    const { zoom } = get();
    const levels = [...ZOOM_LEVELS].reverse();
    const next = levels.find(l => l < zoom);
    if (next) {
      set({ zoom: next });
    } else {
      set({ zoom: Math.max(zoom / 2, get().minZoom) });
    }
  },

  resetZoom: () => {
    set({ zoom: 12 });
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
  },

  toggleGrid: () => {
    set({ showGrid: !get().showGrid });
  },

  setShowOnionSkin: (show: boolean) => {
    set({ showOnionSkin: show });
  },

  toggleOnionSkin: () => {
    set({ showOnionSkin: !get().showOnionSkin });
  },

  setOnionSkinOpacity: (opacity: number) => {
    set({ onionSkinOpacity: Math.max(0, Math.min(1, opacity)) });
  },

  setOnionSkinFrames: (frames: number) => {
    set({ onionSkinFrames: Math.max(1, Math.min(5, frames)) });
  }
}));
