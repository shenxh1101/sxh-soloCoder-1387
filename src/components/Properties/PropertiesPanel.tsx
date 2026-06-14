import { useState } from 'react';
import { useToolStore } from '@/store/useToolStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { ArrowLeftRight, Palette, Brush, Layers, Keyboard, Film, FileJson } from 'lucide-react';
import ClipPanel from '@/components/Clips/ClipPanel';
import DraftPanel from '@/components/Drafts/DraftPanel';

type TabType = 'color' | 'brush' | 'onion' | 'clips' | 'drafts' | 'shortcuts';

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

  const [activeTab, setActiveTab] = useState<TabType>('color');

  const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
  { id: 'color', icon: <Palette size={14} />, label: '颜色' },
  { id: 'brush', icon: <Brush size={14} />, label: '笔刷' },
  { id: 'onion', icon: <Layers size={14} />, label: '洋葱皮' },
  { id: 'clips', icon: <Film size={14} />, label: '片段' },
  { id: 'drafts', icon: <FileJson size={14} />, label: '版本' },
  { id: 'shortcuts', icon: <Keyboard size={14} />, label: '快捷键' }
];

  return (
    <div className="w-60 bg-pixel-surface border-l-2 border-pixel-border flex flex-col overflow-hidden">
      <div className="flex border-b border-pixel-border bg-pixel-surface-light">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              "flex-1 py-2 flex items-center justify-center transition-colors border-r border-pixel-border last:border-r-0 " +
              (activeTab === tab.id
                ? 'bg-pixel-surface text-pixel-primary border-b-2 border-b-pixel-primary'
                : 'text-pixel-text-muted hover:text-pixel-text hover:bg-pixel-surface')
            }
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'color' && (
          <div className="p-3">
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
        )}

        {activeTab === 'brush' && (
          <div className="p-3">
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
        )}

        {activeTab === 'onion' && (
          <div className="p-3">
            <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">洋葱皮</h3>

            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-pixel-text-muted font-mono">启用</label>
              <button
                onClick={() => setShowOnionSkin(!showOnionSkin)}
                className={
                  "w-10 h-5 border-2 transition-colors relative " +
                  (showOnionSkin ? 'bg-pixel-primary border-pixel-primary' : 'bg-pixel-surface-light border-pixel-border')
                }
              >
                <div
                  className={
                    "absolute top-0.5 w-3.5 h-3.5 bg-white transition-all " +
                    (showOnionSkin ? 'left-5' : 'left-0.5')
                  }
                />
              </button>
            </div>

            {showOnionSkin && (
              <>
                <div className="mb-2 mt-3">
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
        )}

        {activeTab === 'clips' && <ClipPanel />}

        {activeTab === 'drafts' && <DraftPanel />}

        {activeTab === 'shortcuts' && (
          <div className="p-3">
            <h3 className="text-xs font-bold text-pixel-text mb-2 font-mono">快捷键</h3>
            <div className="space-y-1.5 text-[10px] text-pixel-text-muted font-mono">
              {[
                ['选区工具', 'V'],
                ['铅笔', 'P'],
                ['橡皮擦', 'E'],
                ['填充', 'G'],
                ['取色器', 'I'],
                ['直线', 'L'],
                ['矩形', 'R'],
                ['圆形', 'C'],
                ['撤销', 'Ctrl+Z'],
                ['重做', 'Ctrl+Y'],
                ['新建帧', 'N'],
                ['复制帧', 'Ctrl+D'],
                ['删除帧', 'Delete'],
                ['复制选区', 'Ctrl+C'],
                ['剪切选区', 'Ctrl+X'],
                ['粘贴选区', 'Ctrl+V'],
                ['方向键微移选区', '↑↓←→'],
                ['快速移动选区(Shift)', 'Shift+方向键'],
              ].map(([name, key]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span className="text-pixel-primary">{key}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
