import { create } from 'zustand';
import type { Frame } from '@/types';
import { createEmptyPixels, copyPixels } from '@/utils/colorUtils';

const CANVAS_SIZE = 32;
const DEFAULT_DELAY = 100;

function generateId(): string {
  return `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultFrame(): Frame {
  return {
    id: generateId(),
    pixels: createEmptyPixels(CANVAS_SIZE, CANVAS_SIZE),
    delay: DEFAULT_DELAY
  };
}

interface HistoryEntry {
  frames: Frame[];
  currentFrameIndex: number;
}

interface PixelState {
  frames: Frame[];
  currentFrameIndex: number;
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  setCurrentFrameIndex: (index: number) => void;
  getCurrentFrame: () => Frame | undefined;

  addFrame: (afterIndex?: number) => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  moveFrame: (fromIndex: number, toIndex: number) => void;
  setFrameDelay: (index: number, delay: number) => void;

  updateCurrentFramePixels: (pixels: Uint8ClampedArray) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  importFrames: (frames: Frame[]) => void;
  clearAll: () => void;
}

export const usePixelStore = create<PixelState>((set, get) => {
  const initialFrame = createDefaultFrame();
  const initialState = {
    frames: [initialFrame],
    currentFrameIndex: 0,
    history: [],
    historyIndex: -1,
    maxHistory: 50
  };

  return {
    ...initialState,

    setCurrentFrameIndex: (index: number) => {
      const { frames } = get();
      if (index >= 0 && index < frames.length) {
        set({ currentFrameIndex: index });
      }
    },

    getCurrentFrame: () => {
      const { frames, currentFrameIndex } = get();
      return frames[currentFrameIndex];
    },

    addFrame: (afterIndex?: number) => {
      const { frames, currentFrameIndex } = get();
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : currentFrameIndex + 1;
      const newFrame = createDefaultFrame();
      const newFrames = [...frames];
      newFrames.splice(insertIndex, 0, newFrame);
      set({ frames: newFrames, currentFrameIndex: insertIndex });
      get().pushHistory();
    },

    duplicateFrame: (index: number) => {
      const { frames } = get();
      if (index < 0 || index >= frames.length) return;
      const source = frames[index];
      const newFrame: Frame = {
        id: generateId(),
        pixels: copyPixels(source.pixels),
        delay: source.delay
      };
      const newFrames = [...frames];
      newFrames.splice(index + 1, 0, newFrame);
      set({ frames: newFrames, currentFrameIndex: index + 1 });
      get().pushHistory();
    },

    deleteFrame: (index: number) => {
      const { frames, currentFrameIndex } = get();
      if (frames.length <= 1) return;
      if (index < 0 || index >= frames.length) return;
      const newFrames = frames.filter((_, i) => i !== index);
      let newIndex = currentFrameIndex;
      if (index <= currentFrameIndex) {
        newIndex = Math.max(0, currentFrameIndex - 1);
      }
      set({ frames: newFrames, currentFrameIndex: newIndex });
      get().pushHistory();
    },

    moveFrame: (fromIndex: number, toIndex: number) => {
      const { frames, currentFrameIndex } = get();
      if (fromIndex < 0 || fromIndex >= frames.length) return;
      if (toIndex < 0 || toIndex >= frames.length) return;

      const newFrames = [...frames];
      const [moved] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, moved);

      let newIndex = currentFrameIndex;
      if (currentFrameIndex === fromIndex) {
        newIndex = toIndex;
      } else if (fromIndex < currentFrameIndex && toIndex >= currentFrameIndex) {
        newIndex = currentFrameIndex - 1;
      } else if (fromIndex > currentFrameIndex && toIndex <= currentFrameIndex) {
        newIndex = currentFrameIndex + 1;
      }

      set({ frames: newFrames, currentFrameIndex: newIndex });
      get().pushHistory();
    },

    setFrameDelay: (index: number, delay: number) => {
      const { frames } = get();
      if (index < 0 || index >= frames.length) return;
      const newFrames = [...frames];
      newFrames[index] = { ...newFrames[index], delay: Math.max(1, delay) };
      set({ frames: newFrames });
    },

    updateCurrentFramePixels: (pixels: Uint8ClampedArray) => {
      const { frames, currentFrameIndex } = get();
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = {
        ...newFrames[currentFrameIndex],
        pixels: new Uint8ClampedArray(pixels)
      };
      set({ frames: newFrames });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set({
        frames: entry.frames.map(f => ({ ...f, pixels: new Uint8ClampedArray(f.pixels) })),
        currentFrameIndex: entry.currentFrameIndex,
        historyIndex: newIndex
      });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set({
        frames: entry.frames.map(f => ({ ...f, pixels: new Uint8ClampedArray(f.pixels) })),
        currentFrameIndex: entry.currentFrameIndex,
        historyIndex: newIndex
      });
    },

    pushHistory: () => {
      const { frames, currentFrameIndex, history, historyIndex, maxHistory } = get();
      const entry: HistoryEntry = {
        frames: frames.map(f => ({ ...f, pixels: new Uint8ClampedArray(f.pixels) })),
        currentFrameIndex
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(entry);

      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    },

    importFrames: (frames: Frame[]) => {
      if (frames.length === 0) return;
      set({
        frames: frames.map(f => ({ ...f, pixels: new Uint8ClampedArray(f.pixels) })),
        currentFrameIndex: 0,
        history: [],
        historyIndex: -1
      });
      get().pushHistory();
    },

    clearAll: () => {
      const newFrame = createDefaultFrame();
      set({
        frames: [newFrame],
        currentFrameIndex: 0,
        history: [],
        historyIndex: -1
      });
      get().pushHistory();
    }
  };
});
