import { create } from 'zustand';
import type { Frame, DraftEntry, ClipInstance } from '@/types';
import { createEmptyPixels, copyPixels } from '@/utils/colorUtils';
import { createFrameThumbnailDataUrl } from '@/utils/exportUtils';

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

  selectedFrameIndices: number[];
  isLoopPreviewing: boolean;
  loopStartIndex: number;
  loopEndIndex: number;
  isPingPong: boolean;
  maxLoopCount: number;
  currentLoopCount: number;

  drafts: DraftEntry[];
  clipInstances: ClipInstance[];
  selectedClipInstanceIds: string[];

  setCurrentFrameIndex: (index: number) => void;
  getCurrentFrame: () => Frame | undefined;

  addFrame: (afterIndex?: number) => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  moveFrame: (fromIndex: number, toIndex: number) => void;
  setFrameDelay: (index: number, delay: number) => void;
  insertFrameAt: (frame: Frame, index: number) => void;
  insertFramesAt: (frames: Frame[], index: number) => void;

  setSelectedFrameIndices: (indices: number[]) => void;
  toggleFrameSelection: (index: number) => void;
  setBatchFrameDelay: (delay: number) => void;
  duplicateSelectedFrames: () => void;
  deleteSelectedFrames: () => void;
  copySelectedFrames: () => void;
  pasteFrames: (atIndex: number) => void;

  setLoopPreview: (start: number, end: number) => void;
  setIsLoopPreviewing: (value: boolean) => void;
  setIsPingPong: (value: boolean) => void;
  setMaxLoopCount: (n: number) => void;
  incrementCurrentLoop: () => boolean;
  resetCurrentLoop: () => void;

  addClipInstance: (startIdx: number, count: number, name: string, clipId?: string) => void;
  removeClipInstance: (instanceId: string) => void;
  moveClipInstance: (instanceId: string, newStartIdx: number) => void;
  duplicateClipInstance: (instanceId: string, newStartIdx?: number) => void;
  toggleClipInstanceSelection: (instanceId: string) => void;
  selectFramesByClipInstances: () => void;

  updateCurrentFramePixels: (pixels: Uint8ClampedArray) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  importFrames: (frames: Frame[]) => void;
  clearAll: () => void;

  exportProject: () => string;
  loadProject: (data: string) => void;

  saveDraft: (name?: string) => void;
  loadDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;
  loadDrafts: () => void;
}

let clipboardFrames: Frame[] = [];

export const usePixelStore = create<PixelState>((set, get) => {
  const initialFrame = createDefaultFrame();
  const initialFrames = [initialFrame];
  const initialState = {
    frames: initialFrames,
    currentFrameIndex: 0,
    history: [
      {
        frames: initialFrames.map(f => ({ ...f, pixels: new Uint8ClampedArray(f.pixels) })),
        currentFrameIndex: 0
      }
    ],
    historyIndex: 0,
    maxHistory: 50,
    selectedFrameIndices: [] as number[],
    isLoopPreviewing: false,
    loopStartIndex: 0,
    loopEndIndex: 0,
    isPingPong: false,
    maxLoopCount: 0,
    currentLoopCount: 0,
    drafts: [] as DraftEntry[],
    clipInstances: [] as ClipInstance[],
    selectedClipInstanceIds: [] as string[]
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
      get().pushHistory();
    },

    insertFrameAt: (frame: Frame, index: number) => {
      const { frames } = get();
      const newFrames = [...frames];
      newFrames.splice(index, 0, frame);
      set({ frames: newFrames, currentFrameIndex: index });
      get().pushHistory();
    },

    setSelectedFrameIndices: (indices: number[]) => {
      set({ selectedFrameIndices: indices });
    },

    toggleFrameSelection: (index: number) => {
      const { selectedFrameIndices } = get();
      const isSelected = selectedFrameIndices.includes(index);
      if (isSelected) {
        set({ selectedFrameIndices: selectedFrameIndices.filter(i => i !== index) });
      } else {
        set({ selectedFrameIndices: [...selectedFrameIndices, index] });
      }
    },

    setBatchFrameDelay: (delay: number) => {
      const { frames, selectedFrameIndices } = get();
      if (selectedFrameIndices.length === 0) return;
      const newFrames = [...frames];
      selectedFrameIndices.forEach(index => {
        if (index >= 0 && index < newFrames.length) {
          newFrames[index] = { ...newFrames[index], delay: Math.max(1, delay) };
        }
      });
      set({ frames: newFrames });
      get().pushHistory();
    },

    duplicateSelectedFrames: () => {
      const { frames, selectedFrameIndices } = get();
      if (selectedFrameIndices.length === 0) return;
      const sortedIndices = [...selectedFrameIndices].sort((a, b) => a - b);
      const framesToDuplicate = sortedIndices.map(i => frames[i]).filter(Boolean);
      const insertIndex = Math.max(...sortedIndices) + 1;
      const newFrames = [...frames];
      const newIndices: number[] = [];
      framesToDuplicate.forEach((frame, idx) => {
        const newFrame: Frame = {
          id: generateId(),
          pixels: copyPixels(frame.pixels),
          delay: frame.delay
        };
        const insertPos = insertIndex + idx;
        newFrames.splice(insertPos, 0, newFrame);
        newIndices.push(insertPos);
      });
      set({ frames: newFrames, currentFrameIndex: insertIndex, selectedFrameIndices: newIndices });
      get().pushHistory();
    },

    deleteSelectedFrames: () => {
      const { frames, selectedFrameIndices } = get();
      if (selectedFrameIndices.length === 0) return;
      if (frames.length <= selectedFrameIndices.length) return;
      const indicesToDelete = [...selectedFrameIndices].sort((a, b) => b - a);
      const newFrames = [...frames];
      indicesToDelete.forEach(index => {
        newFrames.splice(index, 1);
      });
      const remainingIndex = Math.max(0, Math.min(...indicesToDelete) - 1);
      set({ frames: newFrames, currentFrameIndex: remainingIndex, selectedFrameIndices: [] });
      get().pushHistory();
    },

    copySelectedFrames: () => {
      const { frames, selectedFrameIndices } = get();
      if (selectedFrameIndices.length === 0) return;
      const sortedIndices = [...selectedFrameIndices].sort((a, b) => a - b);
      clipboardFrames = sortedIndices.map(i => ({
        ...frames[i],
        pixels: copyPixels(frames[i].pixels)
      })).filter(Boolean);
    },

    pasteFrames: (atIndex: number) => {
      if (clipboardFrames.length === 0) return;
      const { frames } = get();
      const newFrames = [...frames];
      const newIndices: number[] = [];
      clipboardFrames.forEach((frame, idx) => {
        const newFrame: Frame = {
          id: generateId(),
          pixels: copyPixels(frame.pixels),
          delay: frame.delay
        };
        const insertPos = atIndex + idx;
        newFrames.splice(insertPos, 0, newFrame);
        newIndices.push(insertPos);
      });
      set({ frames: newFrames, currentFrameIndex: atIndex, selectedFrameIndices: newIndices });
      get().pushHistory();
    },

    setLoopPreview: (start: number, end: number) => {
      const { frames } = get();
      const validStart = Math.max(0, Math.min(start, frames.length - 1));
      const validEnd = Math.max(validStart, Math.min(end, frames.length - 1));
      set({ loopStartIndex: validStart, loopEndIndex: validEnd, isLoopPreviewing: true });
    },

    setIsLoopPreviewing: (value: boolean) => {
      set({ isLoopPreviewing: value });
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
        historyIndex: -1,
        selectedFrameIndices: [],
        isLoopPreviewing: false
      });
      get().pushHistory();
    },

    exportProject: () => {
      const { frames, currentFrameIndex } = get();
      const serialized = {
        frames: frames.map(f => ({
          id: f.id,
          pixels: Array.from(f.pixels),
          delay: f.delay
        })),
        currentFrameIndex,
        version: '1.0',
        exportedAt: new Date().toISOString()
      };
      return JSON.stringify(serialized);
    },

    loadProject: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.frames || !Array.isArray(parsed.frames)) return;
        
        const frames: Frame[] = parsed.frames.map((f: { id: string; pixels: number[]; delay: number }) => ({
          id: f.id || generateId(),
          pixels: new Uint8ClampedArray(f.pixels),
          delay: f.delay || DEFAULT_DELAY
        }));
        
        if (frames.length === 0) return;
        
        set({
          frames,
          currentFrameIndex: Math.min(parsed.currentFrameIndex || 0, frames.length - 1),
          history: [],
          historyIndex: -1,
          selectedFrameIndices: [],
          isLoopPreviewing: false
        });
        get().pushHistory();
      } catch (e) {
        console.error('Failed to load project:', e);
      }
    },

    insertFramesAt: (framesToInsert: Frame[], index: number) => {
      const { frames } = get();
      const newFrames = [...frames];
      const indices: number[] = [];
      framesToInsert.forEach((frame, idx) => {
        const insertPos = index + idx;
        newFrames.splice(insertPos, 0, {
          ...frame,
          id: frame.id || generateId(),
          pixels: new Uint8ClampedArray(frame.pixels)
        });
        indices.push(insertPos);
      });
      set({ frames: newFrames, currentFrameIndex: index, selectedFrameIndices: indices });
      get().pushHistory();
    },

    setIsPingPong: (value: boolean) => {
      set({ isPingPong: value });
    },

    setMaxLoopCount: (n: number) => {
      set({ maxLoopCount: Math.max(0, n) });
    },

    incrementCurrentLoop: () => {
      const { currentLoopCount, maxLoopCount } = get();
      const next = currentLoopCount + 1;
      if (maxLoopCount > 0 && next >= maxLoopCount) {
        set({ currentLoopCount: 0 });
        return false;
      }
      set({ currentLoopCount: next });
      return true;
    },

    resetCurrentLoop: () => {
      set({ currentLoopCount: 0 });
    },

    addClipInstance: (startIdx: number, count: number, name: string, clipId?: string) => {
      const { frames, clipInstances } = get();
      if (startIdx < 0 || startIdx + count > frames.length || count <= 0) return;

      const instanceId = `clip-inst-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const instance: ClipInstance = {
        id: instanceId,
        clipId: clipId || '',
        name,
        startIndex: startIdx,
        frameCount: count
      };

      const newFrames = [...frames];
      for (let i = 0; i < count; i++) {
        newFrames[startIdx + i] = {
          ...newFrames[startIdx + i],
          clipInstanceId: instanceId
        };
      }

      set({
        clipInstances: [...clipInstances, instance],
        frames: newFrames,
        selectedClipInstanceIds: [instanceId]
      });
      get().pushHistory();
    },

    removeClipInstance: (instanceId: string) => {
      const { frames, clipInstances, selectedClipInstanceIds } = get();
      const inst = clipInstances.find(i => i.id === instanceId);
      if (!inst) return;

      const newFrames = [...frames];
      for (let i = 0; i < inst.frameCount; i++) {
        const idx = inst.startIndex + i;
        if (idx < newFrames.length && newFrames[idx].clipInstanceId === instanceId) {
          newFrames[idx] = { ...newFrames[idx], clipInstanceId: undefined };
        }
      }

      set({
        clipInstances: clipInstances.filter(i => i.id !== instanceId),
        frames: newFrames,
        selectedClipInstanceIds: selectedClipInstanceIds.filter(id => id !== instanceId)
      });
    },

    moveClipInstance: (instanceId: string, newStartIdx: number) => {
      const { frames, clipInstances } = get();
      const inst = clipInstances.find(i => i.id === instanceId);
      if (!inst) return;
      if (newStartIdx < 0 || newStartIdx + inst.frameCount > frames.length) return;
      if (newStartIdx === inst.startIndex) return;

      const instanceFrames: Frame[] = [];
      for (let i = 0; i < inst.frameCount; i++) {
        instanceFrames.push(frames[inst.startIndex + i]);
      }

      const newFrames = frames.filter((_, i) => i < inst.startIndex || i >= inst.startIndex + inst.frameCount);
      for (let i = 0; i < inst.frameCount; i++) {
        newFrames.splice(newStartIdx + i, 0, instanceFrames[i]);
      }

      const newInstances = clipInstances.map(other => {
        if (other.id === instanceId) {
          return { ...other, startIndex: newStartIdx };
        }
        if (inst.startIndex < newStartIdx) {
          if (other.startIndex >= inst.startIndex + inst.frameCount && other.startIndex < newStartIdx + inst.frameCount) {
            return { ...other, startIndex: other.startIndex - inst.frameCount };
          }
        } else {
          if (other.startIndex >= newStartIdx && other.startIndex < inst.startIndex) {
            return { ...other, startIndex: other.startIndex + inst.frameCount };
          }
        }
        return other;
      });

      set({ frames: newFrames, clipInstances: newInstances });
      get().pushHistory();
    },

    duplicateClipInstance: (instanceId: string, newStartIdx?: number) => {
      const { frames, clipInstances } = get();
      const inst = clipInstances.find(i => i.id === instanceId);
      if (!inst) return;

      const dupFrames: Frame[] = [];
      for (let i = 0; i < inst.frameCount; i++) {
        const src = frames[inst.startIndex + i];
        dupFrames.push({
          id: generateId(),
          pixels: copyPixels(src.pixels),
          delay: src.delay
        });
      }

      const insertAt = newStartIdx !== undefined ? newStartIdx : inst.startIndex + inst.frameCount;
      if (insertAt < 0 || insertAt > frames.length) return;

      const newInstanceId = `clip-inst-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newFrames = [...frames];
      for (let i = 0; i < dupFrames.length; i++) {
        dupFrames[i].clipInstanceId = newInstanceId;
        newFrames.splice(insertAt + i, 0, dupFrames[i]);
      }

      const newInstance: ClipInstance = {
        id: newInstanceId,
        clipId: inst.clipId,
        name: inst.name + ' (副本)',
        startIndex: insertAt,
        frameCount: inst.frameCount
      };

      const adjustedInstances = clipInstances.map(other => {
        if (other.startIndex >= insertAt) {
          return { ...other, startIndex: other.startIndex + inst.frameCount };
        }
        return other;
      });

      set({
        frames: newFrames,
        clipInstances: [...adjustedInstances, newInstance],
        currentFrameIndex: insertAt,
        selectedClipInstanceIds: [newInstanceId]
      });
      get().pushHistory();
    },

    toggleClipInstanceSelection: (instanceId: string) => {
      const { selectedClipInstanceIds } = get();
      const isSelected = selectedClipInstanceIds.includes(instanceId);
      set({
        selectedClipInstanceIds: isSelected
          ? selectedClipInstanceIds.filter(id => id !== instanceId)
          : [...selectedClipInstanceIds, instanceId]
      });
    },

    selectFramesByClipInstances: () => {
      const { clipInstances, selectedClipInstanceIds } = get();
      const indices: number[] = [];
      clipInstances.forEach(inst => {
        if (selectedClipInstanceIds.includes(inst.id)) {
          for (let i = 0; i < inst.frameCount; i++) {
            indices.push(inst.startIndex + i);
          }
        }
      });
      set({ selectedFrameIndices: indices });
    },

    saveDraft: (name?: string) => {
      const { frames, currentFrameIndex, drafts } = get();
      const data = JSON.stringify({
        frames: frames.map(f => ({
          id: f.id,
          pixels: Array.from(f.pixels),
          delay: f.delay
        })),
        currentFrameIndex,
        version: '1.0'
      });

      let thumbnail: string | undefined;
      try {
        if (frames.length > 0 && frames[0]) {
          thumbnail = createFrameThumbnailDataUrl(frames[0], 64);
        }
      } catch (e) {
        console.warn('Failed to create draft thumbnail');
      }

      const draft: DraftEntry = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name || `草稿 ${new Date().toLocaleString('zh-CN')}`,
        savedAt: new Date().toISOString(),
        frameCount: frames.length,
        data,
        thumbnail
      };

      const newDrafts = [draft, ...drafts].slice(0, 10);
      localStorage.setItem('pixel_animation_drafts', JSON.stringify(newDrafts));
      set({ drafts: newDrafts });
    },

    loadDraft: (draftId: string) => {
      const { drafts } = get();
      const draft = drafts.find(d => d.id === draftId);
      if (!draft) return;
      get().loadProject(draft.data);
    },

    deleteDraft: (draftId: string) => {
      const { drafts } = get();
      const newDrafts = drafts.filter(d => d.id !== draftId);
      localStorage.setItem('pixel_animation_drafts', JSON.stringify(newDrafts));
      set({ drafts: newDrafts });
    },

    loadDrafts: () => {
      const saved = localStorage.getItem('pixel_animation_drafts');
      if (saved) {
        try {
          const drafts = JSON.parse(saved);
          set({ drafts });
        } catch (e) {
          console.error('Failed to load drafts:', e);
        }
      }
    }
  };
});
