import { useState, useRef } from 'react';
import { X, Upload, Grid3x3, Image } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { importSpriteSheet, loadImage, autoDetectFrames, type SpriteSheetOptions } from '@/utils/spriteSheet';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const importFrames = usePixelStore(state => state.importFrames);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(1);
  const [frameWidth, setFrameWidth] = useState(32);
  const [frameHeight, setFrameHeight] = useState(32);
  const [defaultDelay, setDefaultDelay] = useState(100);
  const [replaceAll, setReplaceAll] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setError('');

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const img = await loadImage(file);
      const detected = autoDetectFrames(img);
      setColumns(detected.columns);
      setRows(detected.rows);
      setFrameWidth(detected.frameWidth);
      setFrameHeight(detected.frameHeight);
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('请选择一个图片文件');
      return;
    }

    try {
      const options: SpriteSheetOptions = {
        columns,
        rows,
        frameWidth,
        frameHeight,
        defaultDelay
      };

      const frames = await importSpriteSheet(file, options);

      if (frames.length === 0) {
        setError('未能从图片中没有找到帧');
        return;
      }

      if (replaceAll) {
        importFrames(frames);
      } else {
        console.warn('追加帧功能待实现');
      }

      onClose();
      resetForm();
    } catch (err) {
      console.error('导入失败:', err);
      setError('导入失败，请检查设置');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl('');
    setColumns(4);
    setRows(1);
    setFrameWidth(32);
    setFrameHeight(32);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="panel w-[480px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-pixel-border">
          <h2 className="text-sm font-bold text-pixel-text font-mono">导入精灵表单图</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
            <div className="flex items-center gap-2 mb-3">
              <Image size={18} className="text-pixel-primary" />
              <h3 className="text-sm font-bold text-pixel-text font-mono">选择图片</h3>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!previewUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-pixel-border text-pixel-text-muted hover:border-pixel-primary hover:text-pixel-primary transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Upload size={24} />
                <span className="text-xs font-mono">点击选择图片</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
              <div className="flex-1">
                <img
                  src={previewUrl}
                  alt="预览"
                  className="w-full max-h-32 object-contain bg-pixel-surface border border-pixel-border pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs text-pixel-text-muted font-mono mt-1 truncate">
                  {file?.name}
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-pixel text-xs self-start"
              >
                更换
              </button>
            </div>
            )}
          </div>

          {previewUrl && (
            <>
              <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
                <div className="flex items-center gap-2 mb-3">
                  <Grid3x3 size={18} className="text-pixel-accent" />
                  <h3 className="text-sm font-bold text-pixel-text font-mono">切割设置</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-pixel-text-muted font-mono block mb-1">列数</label>
                    <input
                      type="number"
                      value={columns}
                      onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-pixel-surface border-2 border-pixel-border text-pixel-text px-2 py-1 text-sm font-mono"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-pixel-text-muted font-mono block mb-1">行数</label>
                    <input
                      type="number"
                      value={rows}
                      onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-pixel-surface border-2 border-pixel-border text-pixel-text px-2 py-1 text-sm font-mono"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-pixel-text-muted font-mono block mb-1">帧宽度</label>
                    <input
                      type="number"
                      value={frameWidth}
                      onChange={(e) => setFrameWidth(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-pixel-surface border-2 border-pixel-border text-pixel-text px-2 py-1 text-sm font-mono"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-pixel-text-muted font-mono block mb-1">帧高度</label>
                    <input
                      type="number"
                      value={frameHeight}
                      onChange={(e) => setFrameHeight(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-pixel-surface border-2 border-pixel-border text-pixel-text px-2 py-1 text-sm font-mono"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-pixel-text-muted font-mono block mb-1">
                    默认帧延迟 (ms)
                  </label>
                  <input
                    type="number"
                    value={defaultDelay}
                    onChange={(e) => setDefaultDelay(Math.max(1, parseInt(e.target.value) || 100))}
                    className="w-full bg-pixel-surface border-2 border-pixel-border text-pixel-text px-2 py-1 text-sm font-mono"
                    min="1"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="replace-all"
                    checked={replaceAll}
                    onChange={(e) => setReplaceAll(e.target.checked)}
                    className="w-4 h-4 accent-pixel-primary"
                  />
                  <label htmlFor="replace-all" className="text-xs text-pixel-text font-mono">
                    替换当前所有帧
                  </label>
                </div>
              </div>

              <div className="p-3 border-2 border-pixel-border bg-pixel-bg">
                <p className="text-xs text-pixel-text-muted font-mono">
                  预计导入: <span className="text-pixel-primary">{columns * rows}</span> 帧
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="p-2 bg-pixel-danger/20 border border-pixel-danger text-pixel-danger text-xs font-mono">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="btn-pixel flex-1 text-sm"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={!file}
              className="btn-pixel-primary flex-1 text-sm"
            >
              <Upload size={14} className="inline mr-1" />
              导入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
