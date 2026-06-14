import { useToolStore } from '@/store/useToolStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { ArrowLeftRight } from 'lucide-react';

export default function PropertiesPanel() {
  const primaryColor = useToolStore(state => state.primaryColor);
  const secondaryColor = useToolStore(state => state.secondaryColor);
  const brushSize = useToolStore(state => state.brushSize);
  const recentColors = useToolStore(state => state.recentColors);
  const setPrimaryColor = useToolStore(state => state.setPrimaryColor);
  const setSecondaryColor = useToolStore(state => state.setSecondaryColor);
  const setBrushSize = useToolStore(state => state.setBrushSize);
  const swapColors = useToolStore(state => state.swapColors);
  const addRecentColor = useToolStore(state => state.addRecentColor);

  const showOnionSkin = useCanvasStore(state => state.showOnionSkin);
  const onionSkinOpacity = useCanvasStore(state => state.onionSkinOpacity);
  const onionSkinFrames = useCanvasStore(state => state.onionSkinFrames);
  const setShowOnionSkin = useCanvasStore(state => state.setShowOnionSkin);
  const setOnionSkinOpacity = useCanvasStore(state => state.setOnionSkinOpacity);
  const setOnionSkinFrames = useCanvasStore(state => state.setOnionSkinFrames);

  return (
    <div className="w-56 bg-pixel-surface border-l-2 border-pixel-border flex flex-col overflow-y-auto">
      <div className="p-3 border-b border-pixel-border">
        <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">颜色</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <div
              className="w-12 h-12 border-2 border-pixel-border checkerboard cursor-pointer"
              onClick={() => document.getElementById('primary-color-input')?.click()}
            >
              <div
                className="w-full h-full"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <input
              id="primary-color-input"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="sr-only"
            />
            <span className="absolute -top-1 -left-1 text-[9px] bg-pixel-primary text-white px-1 font-mono">
              主
            </span>
          </div>

          <button
            onClick={swapColors}
            className="p-2 hover:bg-pixel-surface-light text-pixel-text-muted hover:text-pixel-text transition-colors"
            title="交换颜色"
          >
            <ArrowLeftRight size={16} />
          </button>

          <div className="relative">
            <div
              className="w-12 h-12 border-2 border-pixel-border checkerboard cursor-pointer"
              onClick={() => document.getElementById('secondary-color-input')?.click()}
            >
              <div
                className="w-full h-full"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
            <input
              id="secondary-color-input"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="sr-only"
            />
            <span className="absolute -top-1 -left-1 text-[9px] bg-pixel-surface text-pixel-text px-1 font-mono border border-pixel-border">
              副
            </span>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-pixel-text-muted font-mono block mb-1">
            主色: {primaryColor}
          </label>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-8"
          />
        </div>

        <div>
          <label className="text-xs text-pixel-text-muted font-mono block mb-1">最近使用</label>
          <div className="grid grid-cols-8 gap-1">
            {recentColors.map((color, index) => (
              <button
                key={index}
                onClick={() => {
                  setPrimaryColor(color);
                  addRecentColor(color);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSecondaryColor(color);
                }}
                className="w-5 h-5 border border-pixel-border hover:border-pixel-primary transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-pixel-border">
        <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">笔刷</h3>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-pixel-text-muted font-mono">大小</label>
            <span className="text-xs text-pixel-primary font-mono">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="32"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          />
        </div>

        <div className="mt-3">
          <label className="text-xs text-pixel-text-muted font-mono block mb-2">预览</label>
          <div className="flex items-center justify-center h-12 bg-pixel-bg border border-pixel-border">
            <div
              className="bg-white"
              style={{
                width: brushSize * 2,
                height: brushSize * 2,
                minWidth: 2,
                minHeight: 2
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-pixel-border">
        <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">洋葱皮</h3>

        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-pixel-text-muted font-mono">启用</label>
          <button
            onClick={() => setShowOnionSkin(!showOnionSkin)}
            className={`
              w-10 h-5 border-2 transition-colors relative
              ${showOnionSkin ? 'bg-pixel-primary border-pixel-primary' : 'bg-pixel-surface-light border-pixel-border'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-3.5 h-3.5 bg-white transition-all
                ${showOnionSkin ? 'left-5' : 'left-0.5'}
              `}
            />
          </button>
        </div>

        {showOnionSkin && (
          <>
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-pixel-text-muted font-mono">不透明度</label>
              <span className="text-xs text-pixel-primary font-mono">
                {Math.round(onionSkinOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.1"
              value={onionSkinOpacity}
              onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
            />
          </div>

            <div>
              <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-pixel-text-muted font-mono">帧数</label>
              <span className="text-xs text-pixel-primary font-mono">{onionSkinFrames} 帧</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={onionSkinFrames}
                onChange={(e) => setOnionSkinFrames(parseInt(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <div className="p-3 flex-1">
        <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">快捷键</h3>
        <div className="space-y-1 text-[10px] text-pixel-text-muted font-mono">
          <div className="flex justify-between">
            <span>铅笔</span>
            <span className="text-pixel-primary">P</span>
          </div>
          <div className="flex justify-between">
            <span>橡皮擦</span>
            <span className="text-pixel-primary">E</span>
          </div>
          <div className="flex justify-between">
            <span>填充</span>
            <span className="text-pixel-primary">G</span>
          </div>
          <div className="flex justify-between">
            <span>取色器</span>
            <span className="text-pixel-primary">I</span>
          </div>
          <div className="flex justify-between">
            <span>直线</span>
            <span className="text-pixel-primary">L</span>
          </div>
          <div className="flex justify-between">
            <span>矩形</span>
            <span className="text-pixel-primary">R</span>
          </div>
          <div className="flex justify-between">
            <span>圆形</span>
            <span className="text-pixel-primary">C</span>
          </div>
          <div className="flex justify-between">
            <span>撤销</span>
            <span className="text-pixel-primary">Ctrl+Z</span>
          </div>
          <div className="flex justify-between">
            <span>重做</span>
            <span className="text-pixel-primary">Ctrl+Y</span>
          </div>
        </div>
      </div>
    </div>
  );
}
