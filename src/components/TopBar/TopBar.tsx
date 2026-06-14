import { useState, useRef } from 'react';
import { Download, Upload, File, Trash2, ZoomIn, ZoomOut, Grid3x3, Layers, Info } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { loadProject } from '@/utils/exportUtils';
import ExportModal from '@/components/Export/ExportModal';
import ImportModal from '@/components/Import/ImportModal';

export default function TopBar() {
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const clearAll = usePixelStore(state => state.clearAll);
  const importFrames = usePixelStore(state => state.importFrames);

  const zoom = useCanvasStore(state => state.zoom);
  const zoomIn = useCanvasStore(state => state.zoomIn);
  const zoomOut = useCanvasStore(state => state.zoomOut);
  const showGrid = useCanvasStore(state => state.showGrid);
  const toggleGrid = useCanvasStore(state => state.toggleGrid);
  const showOnionSkin = useCanvasStore(state => state.showOnionSkin);
  const toggleOnionSkin = useCanvasStore(state => state.toggleOnionSkin);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewProject = () => {
    if (confirm('确定要新建项目吗？当前所有帧将被清除。')) {
      clearAll();
    }
  };

  const handleOpenProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadProject(file)
      .then((frames) => {
        importFrames(frames);
      })
      .catch((err) => {
        console.error('加载项目失败:', err);
        alert('加载项目失败，请确保文件格式正确');
      });

    e.target.value = '';
  };

  return (
    <>
      <div className="h-10 bg-pixel-surface border-b-2 border-pixel-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-6 h-6 bg-pixel-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">Px</span>
            </div>
            <span className="text-sm font-bold text-pixel-text font-mono">像素动效编辑器</span>
          </div>

          <div className="h-5 w-px bg-pixel-border" />

          <button
            onClick={handleNewProject}
            className="px-2 py-1 text-xs text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors font-mono flex items-center gap-1"
            title="新建项目"
          >
            <File size={12} />
            新建
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors font-mono flex items-center gap-1"
            title="打开项目"
          >
            <Upload size={12} />
            打开
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleOpenProject}
              className="hidden"
            />
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="px-2 py-1 text-xs text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors font-mono flex items-center gap-1"
            title="导入精灵图"
          >
            <Upload size={12} />
            导入精灵图
          </button>

          <button
            onClick={() => setShowExport(true)}
            className="px-2 py-1 text-xs text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors font-mono flex items-center gap-1"
            title="导出"
          >
            <Download size={12} />
            导出
          </button>

          <div className="h-5 w-px bg-pixel-border" />

          <button
            onClick={zoomOut}
            className="p-1 text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors"
            title="缩小"
          >
            <ZoomOut size={14} />
          </button>

          <span className="text-xs text-pixel-text-muted font-mono w-12 text-center">
            {zoom}x
          </span>

          <button
            onClick={zoomIn}
            className="p-1 text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors"
            title="放大"
          >
            <ZoomIn size={14} />
          </button>

          <div className="h-5 w-px bg-pixel-border" />

          <button
            onClick={toggleGrid}
            className={`p-1 transition-colors ${showGrid ? 'text-pixel-primary' : 'text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary'}`}
            title="网格"
          >
            <Grid3x3 size={14} />
          </button>

          <button
            onClick={toggleOnionSkin}
            className={`p-1 transition-colors ${showOnionSkin ? 'text-pixel-primary' : 'text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary'}`}
            title="洋葱皮"
          >
            <Layers size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-pixel-text-muted font-mono">
            帧 {currentFrameIndex + 1}/{frames.length}
          </span>

          <div className="h-5 w-px bg-pixel-border" />

          <button
            onClick={handleNewProject}
            className="p-1 text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-danger transition-colors"
            title="清空"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={() => setShowAbout(true)}
            className="p-1 text-pixel-text hover:bg-pixel-surface-light hover:text-pixel-primary transition-colors"
            title="关于"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      {showAbout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAbout(false)}>
          <div
            className="panel w-80 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-pixel-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold font-mono">Px</span>
            </div>
            <h2 className="text-lg font-bold text-pixel-text font-mono mb-2">像素动效编辑器</h2>
            <p className="text-xs text-pixel-text-muted font-mono mb-4">
              v1.0.0
            </p>
            <p className="text-xs text-pixel-text-muted font-mono mb-4">
              一个简单好用的像素画动画制作工具
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="btn-pixel-primary text-sm"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </>
  );
}
