import { useState } from 'react';
import { Flag, Trash2, Edit3, Check, X } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import type { TimelineMarker } from '@/types';

export default function MarkerPanel() {
  const markers = usePixelStore(state => state.markers);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = usePixelStore(state => state.setCurrentFrameIndex);
  const addMarker = usePixelStore(state => state.addMarker);
  const updateMarker = usePixelStore(state => state.updateMarker);
  const deleteMarker = usePixelStore(state => state.deleteMarker);
  const getMarkersByFrame = usePixelStore(state => state.getMarkersByFrame);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editColor, setEditColor] = useState('#eab308');

  const currentFrameMarkers = getMarkersByFrame(currentFrameIndex);
  const sortedMarkers = [...markers].sort((a, b) => a.frameIndex - b.frameIndex);

  const handleStartEdit = (marker: TimelineMarker) => {
    setEditingId(marker.id);
    setEditLabel(marker.label);
    setEditNote(marker.note);
    setEditColor(marker.color);
  };

  const handleConfirmEdit = () => {
    if (editingId && editLabel.trim()) {
      updateMarker(editingId, {
        label: editLabel.trim(),
        note: editNote.trim(),
        color: editColor
      });
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAddMarker = () => {
    addMarker(currentFrameIndex, `关键帧 ${currentFrameIndex + 1}`, '#eab308', '');
  };

  const colorPalette = [
    '#eab308',
    '#ef4444',
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#f97316',
    '#06b6d4',
    '#ec4899'
  ];

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-pixel-text font-mono flex items-center gap-1.5">
          <Flag size={14} className="text-yellow-500" />
          时间轴标记
        </h3>
        <button
          onClick={handleAddMarker}
          className="text-[10px] font-mono bg-yellow-500/20 text-yellow-500 px-2 py-0.5 hover:bg-yellow-500/30 transition-colors flex items-center gap-0.5"
        >
          + 添加
        </button>
      </div>

      {currentFrameMarkers.length > 0 && (
        <div className="mb-3 pb-3 border-b border-pixel-border">
          <h4 className="text-[10px] font-bold text-pixel-text-muted font-mono mb-2">
            当前帧 (帧 {currentFrameIndex + 1})
          </h4>
          <div className="space-y-1.5">
            {currentFrameMarkers.map(m => (
              <div
                key={m.id}
                className="p-2 border-l-4 bg-pixel-surface-light text-[10px] font-mono"
                style={{ borderLeftColor: m.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-pixel-text font-bold">{m.label}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleStartEdit(m)}
                      className="p-0.5 text-pixel-text-muted hover:text-pixel-text transition-colors"
                      title="编辑"
                    >
                      <Edit3 size={10} />
                    </button>
                    <button
                      onClick={() => deleteMarker(m.id)}
                      className="p-0.5 text-pixel-text-muted hover:text-pixel-danger transition-colors"
                      title="删除"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                {m.note && (
                  <p className="text-pixel-text-muted mt-1">{m.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedMarkers.length === 0 ? (
        <div className="text-center py-6 text-pixel-text-muted">
          <Flag size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-[10px] font-mono">还没有标记</p>
          <p className="text-[10px] font-mono mt-1">点击 + 添加 或在帧面板点旗子</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {sortedMarkers.map(m => {
            const isEditing = editingId === m.id;
            return (
              <div
                key={m.id}
                className="p-2 border-l-4 bg-pixel-surface-light text-[10px] font-mono cursor-pointer hover:bg-pixel-surface transition-colors"
                style={{ borderLeftColor: m.color }}
                onClick={() => !isEditing && setCurrentFrameIndex(m.frameIndex)}
              >
                {isEditing ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="w-full text-[10px] font-mono bg-pixel-bg border border-pixel-border text-pixel-text px-1.5 py-0.5 mb-1.5 outline-none focus:border-pixel-primary"
                      autoFocus
                    />
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full text-[10px] font-mono bg-pixel-bg border border-pixel-border text-pixel-text px-1.5 py-0.5 mb-1.5 outline-none focus:border-pixel-primary h-12 resize-none"
                      placeholder="备注"
                    />
                    <div className="flex items-center gap-1 mb-1.5">
                      {colorPalette.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={'w-3.5 h-3.5 rounded-sm border-2 transition-transform ' + (editColor === c ? 'border-white scale-110' : 'border-transparent')}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleConfirmEdit}
                        className="flex-1 py-0.5 bg-pixel-accent text-white text-[9px] font-mono"
                      >
                        <Check size={9} className="inline mr-0.5" />
                        确定
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-0.5 bg-pixel-surface text-pixel-text text-[9px] font-mono border border-pixel-border"
                      >
                        <X size={9} className="inline mr-0.5" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="text-pixel-text font-bold">{m.label}</span>
                        <span className="text-pixel-text-muted">· 帧 {m.frameIndex + 1}</span>
                      </div>
                      <div className="flex gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(m); }}
                          className="p-0.5 text-pixel-text-muted hover:text-pixel-text transition-colors"
                          title="编辑"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMarker(m.id); }}
                          className="p-0.5 text-pixel-text-muted hover:text-pixel-danger transition-colors"
                          title="删除"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    {m.note && (
                      <p className="text-pixel-text-muted mt-1 ml-4">{m.note}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
