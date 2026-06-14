import { create } from 'zustand';
import type { ToolType } from '@/types';

interface ToolState {
  currentTool: ToolType;
  brushSize: number;
  primaryColor: string;
  secondaryColor: string;
  recentColors: string[];
  maxRecentColors: number;

  setCurrentTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  addRecentColor: (color: string) => void;
  swapColors: () => void;
}

const DEFAULT_RECENT_COLORS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff'
];

export const useToolStore = create<ToolState>((set, get) => ({
  currentTool: 'pencil',
  brushSize: 1,
  primaryColor: '#ffffff',
  secondaryColor: '#000000',
  recentColors: DEFAULT_RECENT_COLORS,
  maxRecentColors: 16,

  setCurrentTool: (tool: ToolType) => {
    set({ currentTool: tool });
  },

  setBrushSize: (size: number) => {
    set({ brushSize: Math.max(1, Math.min(32, size)) });
  },

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
    get().addRecentColor(color);
  },

  setSecondaryColor: (color: string) => {
    set({ secondaryColor: color });
    get().addRecentColor(color);
  },

  addRecentColor: (color: string) => {
    const { recentColors, maxRecentColors } = get();
    const normalized = color.toLowerCase();
    const filtered = recentColors.filter(c => c.toLowerCase() !== normalized);
    const newColors = [color, ...filtered].slice(0, maxRecentColors);
    set({ recentColors: newColors });
  },

  swapColors: () => {
    const { primaryColor, secondaryColor } = get();
    set({
      primaryColor: secondaryColor,
      secondaryColor: primaryColor
    });
  }
}));
