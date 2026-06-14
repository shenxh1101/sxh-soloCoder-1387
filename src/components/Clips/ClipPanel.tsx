import { useState, useEffect } from 'react';
import { Film, Trash2, Copy, Edit3, Check, X, Plus, Layers, Gauge, Scissors, Palette } from 'lucide-react';
import { useClipStore } from '@/store/useClipStore';
import { usePixelStore } from '@/store/usePixelStore';
import type { Frame } from '@/types';

export default function ClipPanel() {
  const clips = useClipStore(state => state.clips);
  const deleteClip = useClipStore(state => state.deleteClip);
  const renameClip = useClipStore(state => state.renameClip);
  const duplicateClip = useClipStore(state => state.duplicateClip);
  const loadClipsFromStorage = useClipStore(state => state.loadClipsFromStorage);

  const insertFramesAt = usePixelStore(state => state.insertFramesAt);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const addClipInstance = usePixelStore(state => state.addClipInstance);
  const duplicateClipInstance = usePixelStore(state => state.duplicateClipInstance);
  const removeClipInstance = usePixelStore(state => state.removeClipInstance);
  const moveClipInstance = usePixelStore(state => state.moveClipInstance);
  const toggleClipInstanceSelection = usePixelStore(state => state.toggleClipInstanceSelection);
  const selectFramesByClipInstances = usePixelStore(state => state.selectFramesByClipInstances);
  const updateClipInstance = usePixelStore(state => state.updateClipInstance);
  const trimClipInstanceStart = usePixelStore(state => state.trimClipInstanceStart);
  const trimClipInstanceEnd = usePixelStore(state => state.trimClipInstanceEnd);
  const clipInstances = usePixelStore(state => state.clipInstances);
  const selectedClipInstanceIds = usePixelStore(state => state.selectedClipInstanceIds);
  const frames = usePixelStore(state => state.frames);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadClipsFromStorage();
  }, [loadClipsFromStorage]);

  const handleInsertClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const framesArr: Frame[] = clip.frames.map(f => ({
      id: f.id,
      pixels: new Uint8ClampedArray(f.pixels),
      delay: f.delay
    }));

    const insertIdx = currentFrameIndex + 1;
    insertFramesAt(framesArr, insertIdx);
    addClipInstance(insertIdx, clip.frames.length, clip.name, clip.id);
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleConfirmRename = () => {
    if (editingId && editName.trim()) {
      renameClip(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="panel p-3">
      <h3 className="text-xs font-bold text-pixel-text mb-3 font-mono flex items-center gap-1.5">
        <Film size={14} className="text-pixel-primary" />
        片段库 / 时间轴实例
      </h3>

      {clipInstances.length > 0 && (
        <div className="mb-3 pb-3 border-b border-pixel-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold text-pixel-text-muted font-mono flex items-center gap-1">
              <Layers size={11} />
              时间轴实例 ({clipInstances.length})
            </h4>
            {selectedClipInstanceIds.length > 0 && (
              <button
                onClick={selectFramesByClipInstances}
                className="text-[10px] font-mono bg-pixel-primary/10 text-pixel-primary px-1.5 py-0.5 hover:bg-pixel-primary/20 transition-colors"
              >
                选中帧
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
            {clipInstances.map(inst => {
              const isSel = selectedClipInstanceIds.includes(inst.id);
              return (
                <div
                  key={inst.id}
                  className={`
                    group border-2 p-1.5 text-[10px] font-mono cursor-pointer transition-all
                    ${isSel ? 'border-pixel-primary bg-pixel-primary/10' : 'border-pixel-border bg-pixel-surface-light hover:border-pixel-primary/50'}
                  `}
                  style={inst.colorTag ? { borderColor: inst.colorTag } : undefined}
                  onClick={() => toggleClipInstanceSelection(inst.id)}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-pixel-text truncate flex-1">{inst.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-pixel-text-muted">
                    <span>帧 {inst.startIndex + 1}-{inst.startIndex + inst.frameCount}</span>
                    <span>{inst.frameCount}帧</span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateClipInstance(inst.id); }}
                      className="flex-1 py-0.5 bg-pixel-bg text-pixel-primary border border-pixel-primary/30 hover:bg-pixel-primary/10 transition-colors"
                      title="复制实例"
                    >
                      复制
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStart = Math.max(0, inst.startIndex - 1);
                        moveClipInstance(inst.id, newStart);
                      }}
                      className="px-1 py-0.5 bg-pixel-bg text-pixel-text-muted border border-pixel-border hover:text-pixel-text transition-colors"
                      title="前移"
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStart = Math.min(frames.length - inst.frameCount, inst.startIndex + 1);
                        moveClipInstance(inst.id, newStart);
                      }}
                      className="px-1 py-0.5 bg-pixel-bg text-pixel-text-muted border border-pixel-border hover:text-pixel-text transition-colors"
                      title="后移"
                    >
                      →
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeClipInstance(inst.id); }}
                      className="px-1 py-0.5 bg-pixel-bg text-pixel-text-muted border border-pixel-border hover:text-pixel-danger transition-colors"
                      title="解除分组"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-pixel-border/50">
                    <Gauge size={10} className="text-pixel-text-muted" />
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.25"
                      value={inst.speedRatio}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateClipInstance(inst.id, { speedRatio: parseFloat(e.target.value) });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-1 bg-pixel-border"
                    />
                    <span className="text-[9px] font-mono text-pixel-text-muted w-8 text-right">
                      {inst.speedRatio.toFixed(2)}×
                    </span>
                  </div>

                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        trimClipInstanceStart(inst.id, 1);
                      }}
                      disabled={inst.frameCount <= 1 || inst.trimStart >= inst.frameCount - 1}
                      className="flex-1 py-0.5 bg-pixel-bg text-pixel-danger border border-pixel-danger/30 hover:bg-pixel-danger/10 transition-colors text-[9px] font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-0.5"
                      title="裁切开头 1 帧"
                    >
                      <Scissors size={9} />
                      裁头
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        trimClipInstanceEnd(inst.id, 1);
                      }}
                      disabled={inst.frameCount <= 1 || inst.trimEnd >= inst.frameCount - 1}
                      className="flex-1 py-0.5 bg-pixel-bg text-pixel-danger border border-pixel-danger/30 hover:bg-pixel-danger/10 transition-colors text-[9px] font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-0.5"
                      title="裁切结尾 1 帧"
                    >
                      <Scissors size={9} />
                      裁尾
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="px-1 py-0.5 bg-pixel-bg border border-pixel-border flex items-center justify-center"
                        title="颜色标签"
                      >
                        <Palette size={10} className="text-pixel-text-muted" />
                      </button>
                      <div className="absolute top-full right-0 mt-1 bg-pixel-surface border border-pixel-border p-1 flex gap-0.5 z-30 hidden group-hover:flex">
                        {['#a855f7', '#04c893', '#ec4899', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#06b6d4'].map((c) => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateClipInstance(inst.id, { colorTag: c });
                            }}
                            className="w-4 h-4 rounded-sm border border-white/20"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-pixel-text-muted font-mono flex items-center gap-1">
          <Film size={11} />
          保存的片段 ({clips.length})
        </h4>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-6 text-pixel-text-muted">
          <Film size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-[10px] font-mono">还没有保存的片段</p>
          <p className="text-[10px] font-mono mt-1">选中帧后点击保存按钮</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {clips.map(clip => (
            <div
              key={clip.id}
              className="border-2 border-pixel-border bg-pixel-surface-light p-2 hover:border-pixel-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1.5">
                {editingId === clip.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      className="flex-1 text-[11px] font-mono bg-pixel-bg border border-pixel-border text-pixel-text px-1.5 py-0.5 outline-none focus:border-pixel-primary"
                      autoFocus
                    />
                    <button
                      onClick={handleConfirmRename}
                      className="p-0.5 text-pixel-accent hover:bg-pixel-accent/20 transition-colors"
                      title="确认"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="p-0.5 text-pixel-danger hover:bg-pixel-danger/20 transition-colors"
                      title="取消"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] font-mono text-pixel-text truncate flex-1">
                      {clip.name}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartRename(clip.id, clip.name)}
                        className="p-0.5 text-pixel-text-muted hover:text-pixel-text hover:bg-pixel-surface transition-colors"
                        title="重命名"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => duplicateClip(clip.id)}
                        className="p-0.5 text-pixel-text-muted hover:text-pixel-text hover:bg-pixel-surface transition-colors"
                        title="复制片段"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => deleteClip(clip.id)}
                        className="p-0.5 text-pixel-text-muted hover:text-pixel-danger hover:bg-pixel-danger/20 transition-colors"
                        title="删除片段"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-pixel-text-muted mb-2">
                <span>{clip.frameCount} 帧</span>
                <span>{new Date(clip.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>

              <button
                onClick={() => handleInsertClip(clip.id)}
                className="w-full py-1.5 bg-pixel-primary/10 hover:bg-pixel-primary/20 text-pixel-primary text-[10px] font-mono border border-pixel-primary/30 flex items-center justify-center gap-1 transition-colors"
              >
                <Plus size={11} />
                插入到当前帧后
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
