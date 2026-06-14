import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, FileJson } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';

export default function DraftPanel() {
  const drafts = usePixelStore(state => state.drafts);
  const saveDraft = usePixelStore(state => state.saveDraft);
  const loadDraft = usePixelStore(state => state.loadDraft);
  const deleteDraft = usePixelStore(state => state.deleteDraft);
  const loadDrafts = usePixelStore(state => state.loadDrafts);
  const exportProject = usePixelStore(state => state.exportProject);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleSaveDraft = () => {
    setDraftName(`工程 ${new Date().toLocaleString('zh-CN')}`);
    setShowSaveModal(true);
  };

  const confirmSaveDraft = () => {
    saveDraft(draftName.trim() || undefined);
    setShowSaveModal(false);
    setDraftName('');
  };

  const handleExportProject = () => {
    const data = exportProject();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-animation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-pixel-text font-mono flex items-center gap-1.5">
            <FileJson size={14} className="text-pixel-primary" />
            草稿 / 版本
          </h3>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={handleSaveDraft}
            className="flex-1 py-2 bg-pixel-primary text-white text-[10px] font-mono flex items-center justify-center gap-1 hover:bg-pixel-primary/80 transition-colors"
          >
            <Save size={12} />
            另存版本
          </button>
          <button
            onClick={handleExportProject}
            className="flex-1 py-2 bg-pixel-surface-light text-pixel-text text-[10px] font-mono border-2 border-pixel-border flex items-center justify-center gap-1 hover:border-pixel-primary hover:text-pixel-primary transition-colors"
          >
            <FolderOpen size={12} />
            导出文件
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-4 text-pixel-text-muted">
            <FileJson size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-[10px] font-mono">还没有保存的版本</p>
            <p className="text-[10px] font-mono mt-1">点击上方按钮保存</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {drafts.map((draft, idx) => (
              <div
                key={draft.id}
                className="border-2 border-pixel-border bg-pixel-surface-light p-2 hover:border-pixel-primary/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-pixel-text truncate flex-1">
                    {draft.name}
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] font-mono text-pixel-accent bg-pixel-accent/20 px-1 py-0.5 ml-1">
                      最新
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-pixel-text-muted mb-2">
                  <span>{draft.frameCount} 帧</span>
                  <span>{formatDate(draft.savedAt)}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className="flex-1 py-1 bg-pixel-primary/10 hover:bg-pixel-primary/20 text-pixel-primary text-[10px] font-mono border border-pixel-primary/30 transition-colors"
                  >
                    恢复
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="py-1 px-2 text-pixel-text-muted hover:text-pixel-danger hover:bg-pixel-danger/10 text-[10px] font-mono border border-pixel-border transition-colors"
                    title="删除"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-pixel-surface border-4 border-pixel-primary p-5 w-80">
            <h3 className="text-lg font-bold text-pixel-text mb-4 font-mono flex items-center gap-2">
              <Save size={18} className="text-pixel-primary" />
              保存为版本
            </h3>
            <p className="text-xs text-pixel-text-muted mb-3 font-mono">
              将当前工程保存为一个可恢复的版本
            </p>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full text-sm font-mono bg-pixel-bg border-2 border-pixel-border text-pixel-text px-3 py-2 mb-4 focus:border-pixel-primary outline-none"
              placeholder="给这个版本起个名字..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmSaveDraft()}
            />
            <div className="flex gap-3">
              <button
                onClick={confirmSaveDraft}
                className="flex-1 py-2 bg-pixel-primary text-white font-mono text-sm border-2 border-pixel-primary hover:bg-pixel-primary/80 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
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
