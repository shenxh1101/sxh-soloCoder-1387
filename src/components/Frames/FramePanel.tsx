import { useRef, useEffect } from 'react';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { createFrameThumbnailDataUrl } from '@/utils/exportUtils';
import { useState } from 'react';

export default function FramePanel() {
  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = usePixelStore(state => state.setCurrentFrameIndex);
  const addFrame = usePixelStore(state => state.addFrame);
  const duplicateFrame = usePixelStore(state => state.duplicateFrame);
  const deleteFrame = usePixelStore(state => state.deleteFrame);
  const moveFrame = usePixelStore(state => state.moveFrame);
  const setFrameDelay = usePixelStore(state => state.setFrameDelay);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const scrollToFrame = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const thumbnails = container.querySelectorAll('.frame-thumbnail');
    const el = thumbnails[index] as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  useEffect(() => {
    scrollToFrame(currentFrameIndex);
  }, [currentFrameIndex]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      moveFrame(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-28 bg-pixel-surface border-t-2 border-pixel-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-pixel-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-pixel-text-muted font-mono">帧</span>
          <span className="text-xs text-pixel-primary font-mono">{frames.length} 帧</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
            className="p-1 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
            title="上一帧"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}
            className="p-1 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
            title="下一帧"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center px-2 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1 px-1"
        >
          {frames.map((frame, index) => (
            <FrameThumbnail
              key={frame.id}
              frame={frame}
              index={index}
              isActive={index === currentFrameIndex}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onClick={() => setCurrentFrameIndex(index)}
              onDuplicate={() => duplicateFrame(index)}
              onDelete={() => deleteFrame(index)}
              onDelayChange={(delay) => setFrameDelay(index, delay)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            />
          ))}

          <button
            onClick={() => addFrame()}
            className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-pixel-border text-pixel-text-muted hover:border-pixel-primary hover:text-pixel-primary transition-colors flex flex-col items-center justify-center gap-0.5"
            title="添加帧"
          >
            <Plus size={20} />
            <span className="text-[10px] font-mono">新建</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface FrameThumbnailProps {
  frame: { id: string; pixels: Uint8ClampedArray; delay: number };
  index: number;
  isActive: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDelayChange: (delay: number) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function FrameThumbnail({
  frame,
  index,
  isActive,
  isDragging,
  isDragOver,
  onClick,
  onDuplicate,
  onDelete,
  onDelayChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: FrameThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [showDelay, setShowDelay] = useState(false);

  useEffect(() => {
    const url = createFrameThumbnailDataUrl(frame, 64);
    setThumbnailUrl(url);
  }, [frame]);

  return (
    <div
      className={`
        frame-thumbnail relative flex-shrink-0
        ${isActive ? 'ring-2 ring-pixel-primary' : 'border-2 border-pixel-border'}
        ${isDragging ? 'opacity-50' : ''}
        ${isDragOver ? 'ring-2 ring-pixel-accent' : ''}
        group cursor-pointer
      `}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="absolute top-0.5 left-0.5 z-10 flex items-center gap-1">
        <span className={`
          text-[10px] font-mono px-1
          ${isActive ? 'bg-pixel-primary text-white' : 'bg-black/60 text-white'}
        `}>
          {index + 1}
        </span>
      </div>

      <div className="absolute top-0.5 right-0.5 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={12} className="text-white drop-shadow-md" />
      </div>

      <div className="checkerboard w-16 h-16">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`帧 ${index + 1}`}
            className="w-full h-full pixelated object-contain"
            draggable={false}
          />
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-mono text-white text-center py-0.5 cursor-pointer hover:bg-pixel-primary/80 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowDelay(!showDelay);
        }}
      >
        {frame.delay}ms
      </div>

      {showDelay && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 bg-pixel-surface border border-pixel-border p-1 shadow-pixel"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            value={frame.delay}
            onChange={(e) => onDelayChange(parseInt(e.target.value) || 100)}
            className="w-16 text-xs font-mono bg-pixel-bg border border-pixel-border text-pixel-text px-1 py-0.5"
            min="1"
            max="10000"
            autoFocus
            onBlur={() => setShowDelay(false)}
          />
        </div>
      )}

      <div className="absolute top-5 right-0.5 z-10 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-0.5 bg-black/60 hover:bg-pixel-primary text-white transition-colors"
          title="复制帧"
        >
          <Copy size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-0.5 bg-black/60 hover:bg-pixel-danger text-white transition-colors"
          title="删除帧"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
