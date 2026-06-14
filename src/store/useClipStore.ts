import { create } from 'zustand';
import type { Clip, Frame } from '@/types';

interface ClipStore {
  clips: Clip[];
  draggedClipId: string | null;

  createClipFromFrames: (name: string, frames: Frame[]) => Clip;
  saveClip: (clip: Clip) => void;
  deleteClip: (clipId: string) => void;
  renameClip: (clipId: string, newName: string) => void;
  duplicateClip: (clipId: string) => void;
  setDraggedClipId: (id: string | null) => void;

  loadClipsFromStorage: () => void;
  saveClipsToStorage: () => void;
}

function generateId(): string {
  return `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  clips: [],
  draggedClipId: null,

  createClipFromFrames: (name: string, frames: Frame[]): Clip => {
    return {
      id: generateId(),
      name,
      frameCount: frames.length,
      frames: frames.map(f => ({
        id: f.id,
        pixels: Array.from(f.pixels),
        delay: f.delay
      })),
      createdAt: new Date().toISOString()
    };
  },

  saveClip: (clip: Clip) => {
    set(state => {
      const newClips = [...state.clips, clip];
      localStorage.setItem('pixel_animation_clips', JSON.stringify(newClips));
      return { clips: newClips };
    });
  },

  deleteClip: (clipId: string) => {
    set(state => {
      const newClips = state.clips.filter(c => c.id !== clipId);
      localStorage.setItem('pixel_animation_clips', JSON.stringify(newClips));
      return { clips: newClips };
    });
  },

  renameClip: (clipId: string, newName: string) => {
    set(state => {
      const newClips = state.clips.map(c =>
        c.id === clipId ? { ...c, name: newName } : c
      );
      localStorage.setItem('pixel_animation_clips', JSON.stringify(newClips));
      return { clips: newClips };
    });
  },

  duplicateClip: (clipId: string) => {
    const { clips } = get();
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const duplicated: Clip = {
      ...clip,
      id: generateId(),
      name: `${clip.name} (副本)`,
      createdAt: new Date().toISOString()
    };

    set(state => {
      const newClips = [...state.clips, duplicated];
      localStorage.setItem('pixel_animation_clips', JSON.stringify(newClips));
      return { clips: newClips };
    });
  },

  setDraggedClipId: (id: string | null) => {
    set({ draggedClipId: id });
  },

  loadClipsFromStorage: () => {
    const saved = localStorage.getItem('pixel_animation_clips');
    if (saved) {
      try {
        const clips = JSON.parse(saved);
        set({ clips });
      } catch (e) {
        console.error('Failed to load clips:', e);
      }
    }
  },

  saveClipsToStorage: () => {
    const { clips } = get();
    localStorage.setItem('pixel_animation_clips', JSON.stringify(clips));
  }
}));
