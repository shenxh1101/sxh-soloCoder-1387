import { useRef, useEffect, useState } from 'react';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, GripVertical, Play, Pause, Scissors, Clipboard, Clock, Film, Save } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { useClipStore } from '@/store/useClipStore';
import { createFrameThumbnailDataUrl } from '@/utils/exportUtils';
import type { Frame } from '@/types';

export default function FramePanel() {
  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = usePixelStore(state => state.setCurrentFrameIndex);
  const addFrame = usePixelStore(state => state.addFrame);
  const duplicateFrame = usePixelStore(state => state.duplicateFrame);
  const deleteFrame = usePixelStore(state => state.deleteFrame);
  const moveFrame = usePixelStore(state => state.moveFrame);
  const setFrameDelay = usePixelStore(state => state.setFrameDelay);
  const selectedFrameIndices = usePixelStore(state => state.selectedFrameIndices);
  const setSelectedFrameIndices = usePixelStore(state => state.setSelectedFrameIndices);
  const toggleFrameSelection = usePixelStore(state => state.toggleFrameSelection);
  const setBatchFrameDelay = usePixelStore(state => state.setBatchFrameDelay);
  const duplicateSelectedFrames = usePixelStore(state => state.duplicateSelectedFrames);
  const deleteSelectedFrames = usePixelStore(state => state.deleteSelectedFrames);
  const copySelectedFrames = usePixelStore(state => state.copySelectedFrames);
  const pasteFrames = usePixelStore(state => state.pasteFrames);
  const isLoopPreviewing = usePixelStore(state => state.isLoopPreviewing);
  const loopStartIndex = usePixelStore(state => state.loopStartIndex);
  const loopEndIndex = usePixelStore(state => state.loopEndIndex);
  const setLoopPreview = usePixelStore(state => state.setLoopPreview);
  const setIsLoopPreviewing = usePixelStore(state => state.setIsLoopPreviewing);

  const createClipFromFrames = useClipStore(state => state.createClipFromFrames);
  const saveClip = useClipStore(state => state.saveClip);
  const loadClipsFromStorage = useClipStore(state => state.loadClipsFromStorage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [showBatchDelay, setShowBatchDelay] = useState(false);
  const [batchDelayValue, setBatchDelayValue] = useState(100);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [showSaveClipModal, setShowSaveClipModal] = useState(false);
  const [clipName, setClipName] = useState('');

  useEffect(() => {
    loadClipsFromStorage();
  }, [loadClipsFromStorage]);

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

  const handleFrameClick = (e: React.MouseEvent, index: number) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toggleFrameSelection(index);
      setLastSelectedIndex(index);
    } else if (e.shiftKey && lastSelectedIndex !== null) {
      e.preventDefault();
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelection: number[] = [];
      for (let i = start; i <= end; i++) {
        newSelection.push(i);
      }
      setSelectedFrameIndices(newSelection);
    } else {
      setSelectedFrameIndices([]);
      setLastSelectedIndex(index);
      setCurrentFrameIndex(index);
    }
  };

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

  const handleBatchDelay = () => {
    if (selectedFrameIndices.length > 0) {
      setBatchDelayValue(frames[selectedFrameIndices[0]]?.delay || 100);
      setShowBatchDelay(true);
    }
  };

  const applyBatchDelay = () => {
    setBatchFrameDelay(batchDelayValue);
    setShowBatchDelay(false);
  };

  const handleLoopPreview = () => {
    if (selectedFrameIndices.length >= 2) {
      const sorted = [...selectedFrameIndices].sort((a, b) => a - b);
      setLoopPreview(sorted[0], sorted[sorted.length - 1]);
    } else if (isLoopPreviewing) {
      setIsLoopPreviewing(false);
    }
  };

  const handlePaste = () => {
    const insertIndex = currentFrameIndex + 1;
    pasteFrames(insertIndex);
  };

  const handleSaveClip = () => {
    if (selectedFrameIndices.length === 0) return;
    setClipName(`片段 ${new Date().toLocaleString('zh-CN')}`);
    setShowSaveClipModal(true);
  };

  const confirmSaveClip = () => {
    if (selectedFrameIndices.length === 0 || !clipName.trim()) return;
    const sortedIndices = [...selectedFrameIndices].sort((a, b) => a - b);
    const selectedFrames: Frame[] = sortedIndices.map(i => frames[i]).filter(Boolean);
    const clip = createClipFromFrames(clipName.trim(), selectedFrames);
    saveClip(clip);
    setShowSaveClipModal(false);
    setClipName('');
  };

  useEffect(() => {
    const checkClipboard = () => {
      const state = usePixelStore.getState();
      setHasClipboard(state.selectedFrameIndices.length > 0 ? true : hasClipboard);
    };
    return () => {};
  }, [selectedFrameIndices, hasClipboard]);

  return (
    <>
      <div className="h-36 bg-pixel-surface border-t-2 border-pixel-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-pixel-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-pixel-text-muted font-mono">帧</span>
          <span className="text-xs text-pixel-primary font-mono">{frames.length} 帧</span>
          {selectedFrameIndices.length > 0 && (
            <span className="text-xs text-pixel-accent font-mono bg-pixel-accent/20 px-2 py-0.5">
              已选 {selectedFrameIndices.length} 帧
            </span>
          )}
          {isLoopPreviewing && (
            <span className="text-xs text-pixel-primary font-mono bg-pixel-primary/20 px-2 py-0.5">
              循环预览: {loopStartIndex + 1}-{loopEndIndex + 1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedFrameIndices.length > 0 && (
            <>
              <button
                onClick={handleBatchDelay}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
                title="批量设置时长"
              >
                <Clock size={14} />
              </button>
              <button
                onClick={copySelectedFrames}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
                title="复制选中帧 (Ctrl+C)"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handlePaste}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
                title="粘贴帧 (Ctrl+V)"
              >
                <Clipboard size={14} />
              </button>
              <button
                onClick={duplicateSelectedFrames}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
                title="复制选中帧"
              >
                <Scissors size={14} />
              </button>
              <button
                onClick={deleteSelectedFrames}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-danger transition-colors"
                title="删除选中帧 (Delete)"
              >
                <Trash2 size={14} />
              </button>
              {selectedFrameIndices.length >= 2 && (
                <button
                  onClick={handleLoopPreview}
                  className={`p-1.5 transition-colors ${isLoopPreviewing ? 'text-pixel-primary bg-pixel-primary/20' : 'text-pixel-text-muted hover:text-pixel-primary hover:bg-pixel-surface-light'}`}
                  title={isLoopPreviewing ? '停止循环预览' : '循环预览选中帧'}
                >
                  {isLoopPreviewing ? <Pause size={14} /> : <Play size={14} />}
                </button>
              )}
              <button
                onClick={handleSaveClip}
                className="p-1.5 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-primary transition-colors"
                title="保存为片段（可复用的帧序列）"
              >
                <Save size={14} />
              </button>
              <div className="w-px h-5 bg-pixel-border mx-1" />
            </>
          )}
          {showBatchDelay && (
            <div className="flex items-center gap-1 bg-pixel-bg px-2 py-1 border border-pixel-border">
              <input
                type="number"
                value={batchDelayValue}
                onChange={(e) => setBatchDelayValue(parseInt(e.target.value) || 100)}
                className="w-16 text-xs font-mono bg-pixel-surface border border-pixel-border text-pixel-text px-1 py-0.5"
                min="1"
                max="10000"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && applyBatchDelay()}
              />
              <span className="text-xs font-mono text-pixel-text-muted">ms</span>
              <button
                onClick={applyBatchDelay}
                className="text-xs bg-pixel-primary text-white px-2 py-0.5 font-mono"
              >
                确定
              </button>
              <button
                onClick={() => setShowBatchDelay(false)}
                className="text-xs bg-pixel-surface text-pixel-text px-2 py-0.5 font-mono border border-pixel-border"
              >
                取消
              </button>
            </div>
          )}
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
              isSelected={selectedFrameIndices.includes(index)}
              isInLoopRange={isLoopPreviewing && index >= loopStartIndex && index <= loopEndIndex}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onClick={(e) => handleFrameClick(e, index)}
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

      <div className="px-3 py-1 border-t border-pixel-border flex items-center gap-2">
        <span className="text-[10px] text-pixel-text-muted font-mono">
          提示: Shift+点击 连续选择 | Ctrl+点击 多选 | Ctrl+C/V 复制粘贴帧
        </span>
      </div>
      </div>

      {showSaveClipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-pixel-surface border-4 border-pixel-primary p-5 w-80">
            <h3 className="text-lg font-bold text-pixel-text mb-4 font-mono flex items-center gap-2">
              <Film size={18} className="text-pixel-primary" />
              保存为片段
            </h3>
            <p className="text-xs text-pixel-text-muted mb-3 font-mono">
              选中了 {selectedFrameIndices.length} 帧，保存为可复用的片段
            </p>
            <input
              type="text"
              value={clipName}
              onChange={(e) => setClipName(e.target.value)}
              className="w-full text-sm font-mono bg-pixel-bg border-2 border-pixel-border text-pixel-text px-3 py-2 mb-4 focus:border-pixel-primary outline-none"
              placeholder="给片段起个名字..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmSaveClip()}
            />
            <div className="flex gap-3">
              <button
                onClick={confirmSaveClip}
                className="flex-1 py-2 bg-pixel-primary text-white font-mono text-sm border-2 border-pixel-primary hover:bg-pixel-primary/80 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowSaveClipModal(false)}
                className="flex-1 py-2 bg-pixel-surface text-pixel-text font-mono text-sm border-2 border-pixel-border hover:bg-pixel-surface-light transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface FrameThumbnailProps {
  frame: { id: string; pixels: Uint8ClampedArray; delay: number };
  index: number;
  isActive: boolean;
  isSelected: boolean;
  isInLoopRange: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onClick: (e: React.MouseEvent) => void;
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
  isSelected,
  isInLoopRange,
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
        ${isSelected ? 'ring-2 ring-pixel-accent' : isActive ? 'ring-2 ring-pixel-primary' : 'border-2 border-pixel-border'}
        ${isInLoopRange ? 'ring-2 ring-pixel-primary ring-offset-1 ring-offset-pixel-bg' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${isDragOver ? 'ring-2 ring-pixel-accent' : ''}
        ${isSelected ? 'bg-pixel-accent/10' : ''}
        group cursor-pointer
      `}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {isSelected && (
        <div className="absolute top-0 left-0 z-20">
          <div className="w-3 h-3 bg-pixel-accent flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white" />
          </div>
        </div>
      )}

      <div className="absolute top-0.5 left-0.5 z-10 flex items-center gap-1">
        <span className={`
          text-[10px] font-mono px-1
          ${isActive ? 'bg-pixel-primary text-white' : isSelected ? 'bg-pixel-accent text-white' : 'bg-black/60 text-white'}
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
