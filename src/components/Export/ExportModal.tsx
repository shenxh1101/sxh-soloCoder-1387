import { useState } from 'react';
import { X, Download, FileImage, FileJson, Image } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { exportGifAndDownload } from '@/utils/gifExport';
import { exportFrameAsPNG, exportAllFramesAsPNG, exportFramesAsJSON, saveProject } from '@/utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gifScale, setGifScale] = useState(4);

  if (!isOpen) return null;

  const handleExportGif = async () => {
    setExporting(true);
    setProgress(0);
    try {
      await exportGifAndDownload(frames, {
        scale: gifScale,
        loop: 0,
        quality: 10,
        onProgress: (p) => setProgress(p)
      });
    } catch (err) {
      console.error('GIF 导出失败:', err);
      alert('GIF 导出失败，请重试');
    }
    setExporting(false);
    setProgress(0);
  };

  const handleExportCurrentPng = () => {
    const frame = frames[currentFrameIndex];
    if (frame) {
      exportFrameAsPNG(frame, 8);
    }
  };

  const handleExportAllPng = () => {
    exportAllFramesAsPNG(frames, 8);
  };

  const handleExportJson = () => {
    exportFramesAsJSON(frames);
  };

  const handleSaveProject = () => {
    saveProject(frames);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="panel w-96 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-pixel-border">
          <h2 className="text-sm font-bold text-pixel-text font-mono">导出</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
            <div className="flex items-center gap-2 mb-3">
              <FileImage size={18} className="text-pixel-primary" />
              <h3 className="text-sm font-bold text-pixel-text font-mono">GIF 动画</h3>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-pixel-text-muted font-mono">缩放比例</label>
                <span className="text-xs text-pixel-primary font-mono">{gifScale}x ({32 * gifScale}px)</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={gifScale}
                onChange={(e) => setGifScale(parseInt(e.target.value))}
                disabled={exporting}
              />
            </div>

            {exporting && (
              <div className="mb-3">
                <div className="text-xs text-pixel-text-muted font-mono mb-1">
                  导出中... {Math.round(progress * 100)}%
                </div>
                <div className="h-2 bg-pixel-surface-light border border-pixel-border">
                  <div
                    className="h-full bg-pixel-primary transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExportGif}
              disabled={exporting || frames.length === 0}
              className="btn-pixel-primary w-full text-sm"
            >
              <Download size={14} className="inline mr-2" />
              导出 GIF
            </button>
          </div>

          <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
            <div className="flex items-center gap-2 mb-3">
              <Image size={18} className="text-pixel-accent" />
              <h3 className="text-sm font-bold text-pixel-text font-mono">PNG 图片</h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportCurrentPng}
                className="btn-pixel flex-1 text-xs"
              >
                当前帧
              </button>
              <button
                onClick={handleExportAllPng}
                className="btn-pixel flex-1 text-xs"
              >
                全部帧
              </button>
            </div>
          </div>

          <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
            <div className="flex items-center gap-2 mb-3">
              <FileJson size={18} className="text-pixel-warning" />
              <h3 className="text-sm font-bold text-pixel-text font-mono">JSON 数据</h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                className="btn-pixel flex-1 text-xs"
              >
                帧数据
              </button>
              <button
                onClick={handleSaveProject}
                className="btn-pixel flex-1 text-xs"
              >
                项目文件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
