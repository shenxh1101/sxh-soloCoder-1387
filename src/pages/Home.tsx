import { useEffect } from 'react';
import TopBar from '@/components/TopBar/TopBar';
import Toolbar from '@/components/Toolbar/Toolbar';
import PixelCanvas from '@/components/Canvas/PixelCanvas';
import FramePanel from '@/components/Frames/FramePanel';
import PropertiesPanel from '@/components/Properties/PropertiesPanel';
import AnimationPreview from '@/components/Preview/AnimationPreview';
import { useToolStore } from '@/store/useToolStore';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      const toolMap: Record<string, ToolType> = {
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
        duplicateFrame(currentFrameIndex);
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (frames.length > 1) {
          e.preventDefault();
          deleteFrame(currentFrameIndex);
        }
        return;
      }

      if (key === 'arrowleft') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
        } else {
          setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1));
        }
        return;
      }

      if (key === 'arrowright') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
        } else {
          setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1));
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
  }, [setCurrentTool, undo, redo, zoomIn, zoomOut, addFrame, deleteFrame, duplicateFrame, currentFrameIndex, setCurrentFrameIndex, frames.length, toggleGrid, toggleOnionSkin, pushHistory]);

  return (
    <div className="h-screen w-screen flex flex-col bg-pixel-bg overflow-hidden">
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
