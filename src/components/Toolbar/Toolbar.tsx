import {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Square,
  Circle,
  Minus,
  Undo2,
  Redo2,
  Grid3x3,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Image,
  MousePointer,
  Copy,
  Scissors,
  Clipboard
} from 'lucide-react';
import { useToolStore } from '@/store/useToolStore';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import type { ToolType } from '@/types';
import { flipHorizontal, flipVertical } from '@/utils/pixelUtils';
import { copyPixels } from '@/utils/colorUtils';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolButton({ icon, label, active, onClick, shortcut }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`
        w-10 h-10 flex items-center justify-center border-2 transition-all duration-100
        ${active
          ? 'bg-pixel-primary border-pixel-primary text-white shadow-pixel-inset'
          : 'bg-pixel-surface border-pixel-border text-pixel-text hover:bg-pixel-surface-light hover:border-pixel-primary'
        }
      `}
    >
      {icon}
    </button>
  );
}

export default function Toolbar() {
  const currentTool = useToolStore(state => state.currentTool);
  const setCurrentTool = useToolStore(state => state.setCurrentTool);

  const undo = usePixelStore(state => state.undo);
  const redo = usePixelStore(state => state.redo);
  const getCurrentFrame = usePixelStore(state => state.getCurrentFrame);
  const updateCurrentFramePixels = usePixelStore(state => state.updateCurrentFramePixels);
  const pushHistory = usePixelStore(state => state.pushHistory);

  const zoom = useCanvasStore(state => state.zoom);
  const zoomIn = useCanvasStore(state => state.zoomIn);
  const zoomOut = useCanvasStore(state => state.zoomOut);
  const resetZoom = useCanvasStore(state => state.resetZoom);
  const showGrid = useCanvasStore(state => state.showGrid);
  const toggleGrid = useCanvasStore(state => state.toggleGrid);
  const showOnionSkin = useCanvasStore(state => state.showOnionSkin);
  const toggleOnionSkin = useCanvasStore(state => state.toggleOnionSkin);

  const selection = useSelectionStore(state => state.selection);
  const clipboardPixels = useSelectionStore(state => state.clipboardPixels);
  const copySelection = useSelectionStore(state => state.copySelection);
  const cutSelection = useSelectionStore(state => state.cutSelection);
  const flipSelectionHorizontal = useSelectionStore(state => state.flipSelectionHorizontal);
  const flipSelectionVertical = useSelectionStore(state => state.flipSelectionVertical);
  const clearSelection = useSelectionStore(state => state.clearSelection);

  const tools: { type: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { type: 'select', icon: <MousePointer size={18} />, label: '选区', shortcut: 'V' },
    { type: 'pencil', icon: <Pencil size={18} />, label: '铅笔', shortcut: 'P' },
    { type: 'eraser', icon: <Eraser size={18} />, label: '橡皮擦', shortcut: 'E' },
    { type: 'fill', icon: <PaintBucket size={18} />, label: '填充', shortcut: 'G' },
    { type: 'eyedropper', icon: <Pipette size={18} />, label: '取色器', shortcut: 'I' },
    { type: 'line', icon: <Minus size={18} />, label: '直线', shortcut: 'L' },
    { type: 'rectangle', icon: <Square size={18} />, label: '矩形', shortcut: 'R' },
    { type: 'circle', icon: <Circle size={18} />, label: '圆形', shortcut: 'C' },
  ];

  const handleFlipHorizontal = () => {
    const frame = getCurrentFrame();
    if (!frame) return;
    const newPixels = flipHorizontal(frame.pixels, 32, 32);
    updateCurrentFramePixels(newPixels);
    pushHistory();
  };

  const handleFlipVertical = () => {
    const frame = getCurrentFrame();
    if (!frame) return;
    const newPixels = flipVertical(frame.pixels, 32, 32);
    updateCurrentFramePixels(newPixels);
    pushHistory();
  };

  const handleClear = () => {
    const frame = getCurrentFrame();
    if (!frame) return;
    const newPixels = copyPixels(frame.pixels);
    newPixels.fill(0);
    updateCurrentFramePixels(newPixels);
    pushHistory();
  };

  return (
    <div className="w-14 bg-pixel-surface border-r-2 border-pixel-border flex flex-col items-center py-3 gap-1">
      <div className="flex flex-col gap-1 mb-2">
        {tools.map(tool => (
          <ToolButton
            key={tool.type}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            active={currentTool === tool.type}
            onClick={() => setCurrentTool(tool.type)}
          />
        ))}
      </div>

      <div className="w-8 h-0.5 bg-pixel-border my-2" />

      <div className="flex flex-col gap-1 mb-2">
        <ToolButton
          icon={<Undo2 size={18} />}
          label="撤销"
          shortcut="Ctrl+Z"
          onClick={undo}
        />
        <ToolButton
          icon={<Redo2 size={18} />}
          label="重做"
          shortcut="Ctrl+Y"
          onClick={redo}
        />
      </div>

      <div className="w-8 h-0.5 bg-pixel-border my-2" />

      <div className="flex flex-col gap-1 mb-2">
        <ToolButton
          icon={<Grid3x3 size={18} />}
          label="网格"
          active={showGrid}
          onClick={toggleGrid}
        />
        <ToolButton
          icon={<Layers size={18} />}
          label="洋葱皮"
          active={showOnionSkin}
          onClick={toggleOnionSkin}
        />
      </div>

      <div className="w-8 h-0.5 bg-pixel-border my-2" />

      <div className="flex flex-col gap-1 mb-2">
        <ToolButton
          icon={<ZoomIn size={18} />}
          label="放大"
          shortcut="+"
          onClick={zoomIn}
        />
        <ToolButton
          icon={<ZoomOut size={18} />}
          label="缩小"
          shortcut="-"
          onClick={zoomOut}
        />
        <ToolButton
          icon={<RotateCcw size={18} />}
          label="重置缩放"
          onClick={resetZoom}
        />
      </div>

      <div className="w-8 h-0.5 bg-pixel-border my-2" />

      {selection && (
        <>
          <div className="flex flex-col gap-1 mb-2">
            <div className="text-[9px] text-pixel-primary font-mono text-center">选区操作</div>
            <ToolButton
              icon={<Copy size={16} />}
              label="复制选区"
              shortcut="Ctrl+C"
              onClick={copySelection}
            />
            <ToolButton
              icon={<Scissors size={16} />}
              label="剪切选区"
              shortcut="Ctrl+X"
              onClick={cutSelection}
            />
            <ToolButton
              icon={<FlipHorizontal size={16} />}
              label="水平翻转选区"
              onClick={flipSelectionHorizontal}
            />
            <ToolButton
              icon={<FlipVertical size={16} />}
              label="垂直翻转选区"
              onClick={flipSelectionVertical}
            />
          </div>
          <div className="w-8 h-0.5 bg-pixel-border my-2" />
        </>
      )}

      <div className="flex flex-col gap-1 mb-2">
        <ToolButton
          icon={<FlipHorizontal size={18} />}
          label="水平翻转"
          onClick={handleFlipHorizontal}
        />
        <ToolButton
          icon={<FlipVertical size={18} />}
          label="垂直翻转"
          onClick={handleFlipVertical}
        />
        <ToolButton
          icon={<Image size={18} />}
          label="清除帧"
          onClick={handleClear}
        />
      </div>

      <div className="flex-1" />

      <div className="text-xs text-pixel-text-muted font-mono mt-2">
        {zoom}x
      </div>
    </div>
  );
}
