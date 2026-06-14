import { useState, useEffect } from 'react';
import { Film, Trash2, Copy, Edit3, Check, X, Plus } from 'lucide-react';
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadClipsFromStorage();
  }, [loadClipsFromStorage]);

  const handleInsertClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const frames: Frame[] = clip.frames.map(f => ({
      id: f.id,
      pixels: new Uint8ClampedArray(f.pixels),
      delay: f.delay
    }));

    insertFramesAt(frames, currentFrameIndex + 1);
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-pixel-text font-mono flex items-center gap-1.5">
          <Film size={14} className="text-pixel-primary" />
          片段库
        </h3>
        <span className="text-[10px] text-pixel-text-muted font-mono">
          {clips.length} 个
        </span>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-6 text-pixel-text-muted">
          <Film size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-[10px] font-mono">还没有保存的片段</p>
          <p className="text-[10px] font-mono mt-1">选中帧后点击保存按钮</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
