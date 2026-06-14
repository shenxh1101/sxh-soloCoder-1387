import { create } from 'zustand';
import type { Selection, SelectionState } from '@/types';
import { copyPixels, createEmptyPixels } from '@/utils/colorUtils';
import { flipHorizontal, flipVertical } from '@/utils/pixelUtils';

const CANVAS_SIZE = 32;

function normalizeSelection(x1: number, y1: number, x2: number, y2: number): Selection {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1) + 1,
    height: Math.abs(y2 - y1) + 1
  };
}

function extractSelectionPixels(
  source: Uint8ClampedArray,
  selection: Selection
): Uint8ClampedArray {
  const result = createEmptyPixels(selection.width, selection.height);
  for (let y = 0; y < selection.height; y++) {
    for (let x = 0; x < selection.width; x++) {
      const srcX = selection.x + x;
      const srcY = selection.y + y;
      if (srcX < 0 || srcX >= CANVAS_SIZE || srcY < 0 || srcY >= CANVAS_SIZE) continue;
      const srcIdx = (srcY * CANVAS_SIZE + srcX) * 4;
      const dstIdx = (y * selection.width + x) * 4;
      result[dstIdx] = source[srcIdx];
      result[dstIdx + 1] = source[srcIdx + 1];
      result[dstIdx + 2] = source[srcIdx + 2];
      result[dstIdx + 3] = source[srcIdx + 3];
    }
  }
  return result;
}

function eraseSelection(
  target: Uint8ClampedArray,
  selection: Selection
): Uint8ClampedArray {
  const result = copyPixels(target);
  for (let y = 0; y < selection.height; y++) {
    for (let x = 0; x < selection.width; x++) {
      const srcX = selection.x + x;
      const srcY = selection.y + y;
      if (srcX < 0 || srcX >= CANVAS_SIZE || srcY < 0 || srcY >= CANVAS_SIZE) continue;
      const idx = (srcY * CANVAS_SIZE + srcX) * 4;
      result[idx] = 0;
      result[idx + 1] = 0;
      result[idx + 2] = 0;
      result[idx + 3] = 0;
    }
  }
  return result;
}

function pastePixels(
  target: Uint8ClampedArray,
  pixels: Uint8ClampedArray,
  pasteX: number,
  pasteY: number,
  width: number,
  height: number
): Uint8ClampedArray {
  const result = copyPixels(target);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstX = pasteX + x;
      const dstY = pasteY + y;
      if (dstX < 0 || dstX >= CANVAS_SIZE || dstY < 0 || dstY >= CANVAS_SIZE) continue;
      const srcIdx = (y * width + x) * 4;
      if (pixels[srcIdx + 3] === 0) continue;
      const dstIdx = (dstY * CANVAS_SIZE + dstX) * 4;
      result[dstIdx] = pixels[srcIdx];
      result[dstIdx + 1] = pixels[srcIdx + 1];
      result[dstIdx + 2] = pixels[srcIdx + 2];
      result[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  return result;
}

interface SelectionStore extends SelectionState {
  setCurrentFramePixels: (pixels: Uint8ClampedArray) => void;
  getCurrentFramePixels: () => Uint8ClampedArray;
  updateCurrentFramePixels: (pixels: Uint8ClampedArray) => void;
  pushHistory: () => void;
  tempSelectionStart: { x: number; y: number } | null;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selection: null,
  selectionPixels: null,
  isDraggingSelection: false,
  isAltDragging: false,
  dragOffset: { x: 0, y: 0 },
  dragPreviewPos: null,
  clipboardPixels: null,
  clipboardSize: null,
  tempSelectionStart: null,
  setCurrentFramePixels: () => {},
  getCurrentFramePixels: () => new Uint8ClampedArray(),
  updateCurrentFramePixels: () => {},
  pushHistory: () => {},

  startSelection: (x: number, y: number) => {
    set({
      tempSelectionStart: { x, y },
      selection: { x, y, width: 1, height: 1 },
      selectionPixels: null,
      dragPreviewPos: null
    });
  },

  updateSelection: (x: number, y: number) => {
    const { tempSelectionStart, getCurrentFramePixels } = get();
    if (!tempSelectionStart) return;

    const selection = normalizeSelection(tempSelectionStart.x, tempSelectionStart.y, x, y);
    const pixels = getCurrentFramePixels();
    const selectionPixels = extractSelectionPixels(pixels, selection);

    set({ selection, selectionPixels });
  },

  finishSelection: () => {
    const { tempSelectionStart, selection, getCurrentFramePixels } = get();
    if (!tempSelectionStart || !selection) {
      set({ tempSelectionStart: null });
      return;
    }

    const pixels = getCurrentFramePixels();
    const selectionPixels = extractSelectionPixels(pixels, selection);

    set({
      tempSelectionStart: null,
      selectionPixels
    });
  },

  clearSelection: () => {
    set({
      selection: null,
      selectionPixels: null,
      isDraggingSelection: false,
      isAltDragging: false,
      dragOffset: { x: 0, y: 0 },
      dragPreviewPos: null
    });
  },

  startDragging: (x: number, y: number, isAlt = false): boolean => {
    const { selection, selectionPixels } = get();
    if (!selection || !selectionPixels) return false;

    if (
      x >= selection.x &&
      x < selection.x + selection.width &&
      y >= selection.y &&
      y < selection.y + selection.height
    ) {
      set({
        isDraggingSelection: true,
        isAltDragging: isAlt,
        dragOffset: {
          x: x - selection.x,
          y: y - selection.y
        },
        dragPreviewPos: { x: selection.x, y: selection.y }
      });
      return true;
    }
    return false;
  },

  updateDragPosition: (x: number, y: number) => {
    const { isDraggingSelection, selection, dragOffset } = get();
    if (!isDraggingSelection || !selection) return;

    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    const clampedX = Math.max(0, Math.min(CANVAS_SIZE - selection.width, newX));
    const clampedY = Math.max(0, Math.min(CANVAS_SIZE - selection.height, newY));

    set({
      dragPreviewPos: { x: clampedX, y: clampedY }
    });
  },

  finishDragging: () => {
    const {
      isDraggingSelection,
      isAltDragging,
      selection,
      selectionPixels,
      dragPreviewPos,
      getCurrentFramePixels,
      updateCurrentFramePixels,
      pushHistory
    } = get();

    if (!isDraggingSelection || !selection || !selectionPixels) {
      set({
        isDraggingSelection: false,
        isAltDragging: false,
        dragOffset: { x: 0, y: 0 },
        dragPreviewPos: null
      });
      return;
    }

    const targetPos = dragPreviewPos || { x: selection.x, y: selection.y };
    const positionChanged = targetPos.x !== selection.x || targetPos.y !== selection.y;

    if (positionChanged) {
      const currentPixels = getCurrentFramePixels();
      let newPixels = currentPixels;

      if (isAltDragging) {
        newPixels = pastePixels(currentPixels, selectionPixels, targetPos.x, targetPos.y, selection.width, selection.height);
      } else {
        const basePixels = eraseSelection(currentPixels, selection);
        newPixels = pastePixels(basePixels, selectionPixels, targetPos.x, targetPos.y, selection.width, selection.height);
      }

      updateCurrentFramePixels(newPixels);

      if (isAltDragging) {
        const newSelectionPixels = extractSelectionPixels(newPixels, { ...selection, x: targetPos.x, y: targetPos.y });
        set({
          selection: {
            ...selection,
            x: targetPos.x,
            y: targetPos.y
          },
          selectionPixels: newSelectionPixels
        });
      } else {
        set({
          selection: {
            ...selection,
            x: targetPos.x,
            y: targetPos.y
          }
        });
      }

      pushHistory();
    }

    set({
      isDraggingSelection: false,
      isAltDragging: false,
      dragOffset: { x: 0, y: 0 },
      dragPreviewPos: null
    });
  },

  nudgeSelection: (dx: number, dy: number) => {
    const { selection, selectionPixels, getCurrentFramePixels, updateCurrentFramePixels, pushHistory } = get();
    if (!selection || !selectionPixels) return;

    const newX = Math.max(0, Math.min(CANVAS_SIZE - selection.width, selection.x + dx));
    const newY = Math.max(0, Math.min(CANVAS_SIZE - selection.height, selection.y + dy));

    if (newX === selection.x && newY === selection.y) return;

    const currentPixels = getCurrentFramePixels();
    const basePixels = eraseSelection(currentPixels, selection);
    const pasted = pastePixels(basePixels, selectionPixels, newX, newY, selection.width, selection.height);
    updateCurrentFramePixels(pasted);

    set({
      selection: {
        ...selection,
        x: newX,
        y: newY
      }
    });

    pushHistory();
  },

  copySelection: () => {
    const { selection, selectionPixels } = get();
    if (!selection || !selectionPixels) return;

    set({
      clipboardPixels: copyPixels(selectionPixels),
      clipboardSize: {
        width: selection.width,
        height: selection.height
      }
    });
  },

  cutSelection: () => {
    const { selection, selectionPixels, getCurrentFramePixels, updateCurrentFramePixels, pushHistory } = get();
    if (!selection || !selectionPixels) return;

    set({
      clipboardPixels: copyPixels(selectionPixels),
      clipboardSize: {
        width: selection.width,
        height: selection.height
      }
    });

    const currentPixels = getCurrentFramePixels();
    const erased = eraseSelection(currentPixels, selection);
    updateCurrentFramePixels(erased);
    pushHistory();

    set({
      selection: null,
      selectionPixels: null
    });
  },

  pasteSelection: (x: number, y: number) => {
    const { clipboardPixels, clipboardSize, getCurrentFramePixels, updateCurrentFramePixels, pushHistory } = get();
    if (!clipboardPixels || !clipboardSize) return;

    const pasteX = Math.max(0, Math.min(CANVAS_SIZE - clipboardSize.width, x - Math.floor(clipboardSize.width / 2)));
    const pasteY = Math.max(0, Math.min(CANVAS_SIZE - clipboardSize.height, y - Math.floor(clipboardSize.height / 2)));

    const currentPixels = getCurrentFramePixels();
    const pasted = pastePixels(
      currentPixels,
      clipboardPixels,
      pasteX,
      pasteY,
      clipboardSize.width,
      clipboardSize.height
    );
    updateCurrentFramePixels(pasted);
    pushHistory();

    set({
      selection: {
        x: pasteX,
        y: pasteY,
        width: clipboardSize.width,
        height: clipboardSize.height
      },
      selectionPixels: copyPixels(clipboardPixels)
    });
  },

  flipSelectionHorizontal: () => {
    const { selection, selectionPixels, getCurrentFramePixels, updateCurrentFramePixels, pushHistory } = get();
    if (!selection || !selectionPixels) return;

    const flipped = flipHorizontal(selectionPixels, selection.width, selection.height);
    const currentPixels = getCurrentFramePixels();
    const erased = eraseSelection(currentPixels, selection);
    const pasted = pastePixels(erased, flipped, selection.x, selection.y, selection.width, selection.height);
    updateCurrentFramePixels(pasted);
    pushHistory();

    set({
      selectionPixels: flipped
    });
  },

  flipSelectionVertical: () => {
    const { selection, selectionPixels, getCurrentFramePixels, updateCurrentFramePixels, pushHistory } = get();
    if (!selection || !selectionPixels) return;

    const flipped = flipVertical(selectionPixels, selection.width, selection.height);
    const currentPixels = getCurrentFramePixels();
    const erased = eraseSelection(currentPixels, selection);
    const pasted = pastePixels(erased, flipped, selection.x, selection.y, selection.width, selection.height);
    updateCurrentFramePixels(pasted);
    pushHistory();

    set({
      selectionPixels: flipped
    });
  }
}));
