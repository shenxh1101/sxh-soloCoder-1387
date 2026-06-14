import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar/TopBar';
import Toolbar from '@/components/Toolbar/Toolbar';
import PixelCanvas from '@/components/Canvas/PixelCanvas';
import FramePanel from '@/components/Frames/FramePanel';
import PropertiesPanel from '@/components/Properties/PropertiesPanel';
import AnimationPreview from '@/components/Preview/AnimationPreview';
import { useToolStore } from '@/store/useToolStore';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import type { ToolType } from '@/types';

export default function Home() {
  const setCurrentTool = useToolStore(state => state.setCurrentTool);
  const undo = usePixelStore(state => state.undo);
  const redo = usePixelStore(state => state.redo);
  const pushHistory = usePixelStore(state => state.pushHistory);
  const zoomIn = useCanvasStore(state => state.zoomIn);
  const zoomOut = useCanvasStore(state => state.zoomOut);
  const addFrame = usePixelStore(state => state.addFrame);
  const deleteFrame = usePixelStore(state => state.deleteFrame);
  const duplicateFrame = usePixelStore(state => state.duplicateFrame);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = usePixelStore(state => state.setCurrentFrameIndex);
  const frames = usePixelStore(state => state.frames);
  const toggleGrid = useCanvasStore(state => state.toggleGrid);
  const toggleOnionSkin = useCanvasStore(state => state.toggleOnionSkin);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [draftData, setDraftData] = useState<string | null>(null);
  const loadProject = usePixelStore(state => state.loadProject);

  const clearSelection = useSelectionStore(state => state.clearSelection);
  const copySelection = useSelectionStore(state => state.copySelection);
  const cutSelection = useSelectionStore(state => state.cutSelection);
  const hasClipboardData = useSelectionStore(state => state.clipboardPixels !== null);
  const hasSelection = useSelectionStore(state => state.selection !== null);
  const pasteSelection = useSelectionStore(state => state.pasteSelection);
  const nudgeSelection = useSelectionStore(state => state.nudgeSelection);
  const currentTool = useToolStore(state => state.currentTool);
  const selectedFrameIndices = usePixelStore(state => state.selectedFrameIndices);
  const setSelectedFrameIndices = usePixelStore(state => state.setSelectedFrameIndices);
  const isLoopPreviewing = usePixelStore(state => state.isLoopPreviewing);
  const setIsLoopPreviewing = usePixelStore(state => state.setIsLoopPreviewing);

  useEffect(() => {
    const savedDraft = localStorage.getItem('pixel_animation_draft');
    if (savedDraft) {
      setDraftData(savedDraft);
      setShowRecoveryModal(true);
    }
  }, []);

  const handleRecoverDraft = () => {
    if (draftData) {
      loadProject(draftData);
      localStorage.removeItem('pixel_animation_draft');
      setShowRecoveryModal(false);
      setDraftData(null);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('pixel_animation_draft');
    setShowRecoveryModal(false);
    setDraftData(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      const toolMap: Record<string, ToolType> = {
        'v': 'select',
        'p': 'pencil',
        'e': 'eraser',
        'g': 'fill',
        'i': 'eyedropper',
        'l': 'line',
        'r': 'rectangle',
        'c': 'circle',
      };

      if (toolMap[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCurrentTool(toolMap[key]);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'c' && hasSelection) {
        e.preventDefault();
        copySelection();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'x' && hasSelection) {
        e.preventDefault();
        cutSelection();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'v' && hasClipboardData) {
        e.preventDefault();
        const centerX = 16;
        const centerY = 16;
        pasteSelection(centerX, centerY);
        return;
      }

      if (key === 'escape') {
        e.preventDefault();
        clearSelection();
        if (isLoopPreviewing) {
          setIsLoopPreviewing(false);
        }
        if (selectedFrameIndices.length > 0) {
          setSelectedFrameIndices([]);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'd') {
        e.preventDefault();
        if (selectedFrameIndices.length > 0) {
          const frames = usePixelStore.getState().frames;
          const framesToDuplicate = selectedFrameIndices.map(i => frames[i]).filter(Boolean);
          const insertIndex = Math.max(...selectedFrameIndices) + 1;
          framesToDuplicate.forEach((frame, idx) => {
            usePixelStore.getState().insertFrameAt(
              { ...frame, pixels: new Uint8ClampedArray(frame.pixels), id: `frame_${Date.now()}_${idx}` },
              insertIndex + idx
            );
          });
        } else {
          duplicateFrame(currentFrameIndex);
        }
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (selectedFrameIndices.length > 0) {
          e.preventDefault();
          const indicesToDelete = [...selectedFrameIndices].sort((a, b) => b - a);
          indicesToDelete.forEach(idx => {
            if (usePixelStore.getState().frames.length > 1) {
              usePixelStore.getState().deleteFrame(idx);
            }
          });
          setSelectedFrameIndices([]);
        } else if (frames.length > 1) {
          e.preventDefault();
          deleteFrame(currentFrameIndex);
        }
        return;
      }

      if (key === 'arrowleft') {
        e.preventDefault();
        if (hasSelection && currentTool === 'select') {
          const step = e.shiftKey ? 5 : 1;
          nudgeSelection(-step, 0);
        } else if (e.ctrlKey || e.metaKey) {
        } else {
          setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1));
        }
        return;
      }

      if (key === 'arrowright') {
        e.preventDefault();
        if (hasSelection && currentTool === 'select') {
          const step = e.shiftKey ? 5 : 1;
          nudgeSelection(step, 0);
        } else if (e.ctrlKey || e.metaKey) {
        } else {
          setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1));
        }
        return;
      }

      if (key === 'arrowup') {
        e.preventDefault();
        if (hasSelection && currentTool === 'select') {
          const step = e.shiftKey ? 5 : 1;
          nudgeSelection(0, -step);
        }
        return;
      }

      if (key === 'arrowdown') {
        e.preventDefault();
        if (hasSelection && currentTool === 'select') {
          const step = e.shiftKey ? 5 : 1;
          nudgeSelection(0, step);
        }
        return;
      }

      if (key === '+' || key === '=' || key === ' ') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          zoomIn();
        }
        return;
      }

      if (key === '-') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          zoomOut();
        }
        return;
      }

      if (key === 'n') {
        e.preventDefault();
        addFrame();
        return;
      }

      if (key === 'h') {
        e.preventDefault();
        toggleGrid();
        return;
      }

      if (key === 'o') {
        e.preventDefault();
        toggleOnionSkin();
        return;
      }

      if (key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        pushHistory();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, zoomIn, zoomOut, addFrame, deleteFrame, duplicateFrame, currentFrameIndex, setCurrentFrameIndex, frames.length, toggleGrid, toggleOnionSkin, pushHistory, clearSelection, copySelection, cutSelection, pasteSelection, hasClipboardData, hasSelection, selectedFrameIndices, setSelectedFrameIndices, isLoopPreviewing, setIsLoopPreviewing, nudgeSelection, currentTool]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = usePixelStore.getState();
      const serialized = {
        frames: state.frames.map(f => ({
          id: f.id,
          pixels: Array.from(f.pixels),
          delay: f.delay
        })),
        currentFrameIndex: state.currentFrameIndex,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('pixel_animation_draft', JSON.stringify(serialized));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const state = usePixelStore.getState();
    const serialized = {
      frames: state.frames.map(f => ({
        id: f.id,
        pixels: Array.from(f.pixels),
        delay: f.delay
      })),
      currentFrameIndex: state.currentFrameIndex,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('pixel_animation_draft', JSON.stringify(serialized));
  }, [frames, currentFrameIndex]);

  return (
    <div className="h-screen w-screen flex flex-col bg-pixel-bg overflow-hidden">
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-pixel-surface border-4 border-pixel-primary p-6 max-w-md">
            <h2 className="text-xl font-bold text-pixel-text mb-4 font-mono">
              检测到未保存的草稿
            </h2>
            <p className="text-pixel-text-muted mb-6 font-mono text-sm">
              发现上次未导出的动画工程，是否恢复？
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleRecoverDraft}
                className="flex-1 py-2 bg-pixel-primary text-white font-mono text-sm border-2 border-pixel-primary hover:bg-pixel-primary/80 transition-colors"
              >
                恢复草稿
              </button>
              <button
                onClick={handleDiscardDraft}
                className="flex-1 py-2 bg-pixel-surface text-pixel-text font-mono text-sm border-2 border-pixel-border hover:bg-pixel-surface-light transition-colors"
              >
                丢弃
              </button>
            </div>
          </div>
        </div>
      )}

      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <Toolbar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <PixelCanvas />

            <div className="absolute top-4 right-4">
              <AnimationPreview />
            </div>
          </div>

          <FramePanel />
        </div>

        <PropertiesPanel />
      </div>
    </div>
  );
}
