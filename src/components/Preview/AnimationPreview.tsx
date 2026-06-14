import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Settings, ArrowLeftRight, Repeat1 } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { createFrameThumbnailDataUrl } from '@/utils/exportUtils';

const CANVAS_SIZE = 32;

export default function AnimationPreview() {
  const frames = usePixelStore(state => state.frames);
  const currentFrameIndex = usePixelStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = usePixelStore(state => state.setCurrentFrameIndex);
  const isLoopPreviewing = usePixelStore(state => state.isLoopPreviewing);
  const loopStartIndex = usePixelStore(state => state.loopStartIndex);
  const loopEndIndex = usePixelStore(state => state.loopEndIndex);
  const setIsLoopPreviewing = usePixelStore(state => state.setIsLoopPreviewing);
  const isPingPong = usePixelStore(state => state.isPingPong);
  const setIsPingPong = usePixelStore(state => state.setIsPingPong);
  const selectedFrameIndices = usePixelStore(state => state.selectedFrameIndices);
  const maxLoopCount = usePixelStore(state => state.maxLoopCount);
  const setMaxLoopCount = usePixelStore(state => state.setMaxLoopCount);
  const incrementCurrentLoop = usePixelStore(state => state.incrementCurrentLoop);
  const resetCurrentLoop = usePixelStore(state => state.resetCurrentLoop);
  const clipInstances = usePixelStore(state => state.clipInstances);
  const selectedClipInstanceIds = usePixelStore(state => state.selectedClipInstanceIds);

  const [isPlaying, setIsPlaying] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(4);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [resumeFromCurrent, setResumeFromCurrent] = useState(true);

  const timeoutRef = useRef<number | null>(null);
  const playIndexRef = useRef(currentFrameIndex);
  const playDirectionRef = useRef<1 | -1>(1);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isPlaying) {
      playIndexRef.current = currentFrameIndex;
    }
  }, [currentFrameIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (!hasStartedRef.current) {
        if (resumeFromCurrent) {
          playDirectionRef.current = 1;
        }
        hasStartedRef.current = true;
      }
      playNextFrame();
    } else {
      hasStartedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, isPingPong, isLoopPreviewing, loopStartIndex, loopEndIndex, speed, loop, maxLoopCount, resumeFromCurrent]);

  const playNextFrame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const currentIndex = playIndexRef.current;
    const frame = frames[currentIndex];
    if (!frame) return;

    setCurrentFrameIndex(currentIndex);

    const startIdx = isLoopPreviewing ? loopStartIndex : 0;
    const endIdx = isLoopPreviewing ? loopEndIndex : frames.length - 1;

    let nextIndex: number;
    let shouldContinue = true;

    if (isPingPong) {
      const direction = playDirectionRef.current;
      nextIndex = currentIndex + direction;

      if (nextIndex > endIdx) {
        if (loop || isLoopPreviewing) {
          nextIndex = endIdx - 1;
          playDirectionRef.current = -1;
          shouldContinue = incrementCurrentLoop();
        } else {
          setIsPlaying(false);
          return;
        }
      } else if (nextIndex < startIdx) {
        if (loop || isLoopPreviewing) {
          nextIndex = startIdx + 1;
          playDirectionRef.current = 1;
          shouldContinue = incrementCurrentLoop();
        } else {
          setIsPlaying(false);
          return;
        }
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex > endIdx) {
        if (loop || isLoopPreviewing) {
          nextIndex = startIdx;
          shouldContinue = incrementCurrentLoop();
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    if (!shouldContinue) {
      setIsPlaying(false);
      return;
    }

    playIndexRef.current = nextIndex;
    const delay = frame.delay / speed;

    timeoutRef.current = window.setTimeout(playNextFrame, delay);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      playDirectionRef.current = 1;
      resetCurrentLoop();

      if (!resumeFromCurrent) {
        if (isLoopPreviewing) {
          playIndexRef.current = loopStartIndex;
        } else if (selectedFrameIndices.length >= 2) {
          const sorted = [...selectedFrameIndices].sort((a, b) => a - b);
          usePixelStore.getState().setLoopPreview(sorted[0], sorted[sorted.length - 1]);
          playIndexRef.current = sorted[0];
        } else if (selectedClipInstanceIds.length > 0 && clipInstances.length > 0) {
          const selectedIndices: number[] = [];
          clipInstances.forEach(inst => {
            if (selectedClipInstanceIds.includes(inst.id)) {
              for (let i = 0; i < inst.frameCount; i++) {
                selectedIndices.push(inst.startIndex + i);
              }
            }
          });
          if (selectedIndices.length >= 1) {
            const sorted = [...selectedIndices].sort((a, b) => a - b);
            usePixelStore.getState().setLoopPreview(sorted[0], sorted[sorted.length - 1]);
            playIndexRef.current = sorted[0];
          } else {
            playIndexRef.current = currentFrameIndex;
          }
        } else {
          playIndexRef.current = currentFrameIndex;
        }
      } else {
        playIndexRef.current = currentFrameIndex;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const goToFirst = () => {
    setIsPlaying(false);
    const startIdx = isLoopPreviewing ? loopStartIndex : 0;
    setCurrentFrameIndex(startIdx);
    playIndexRef.current = startIdx;
    playDirectionRef.current = 1;
    resetCurrentLoop();
  };

  const goToLast = () => {
    setIsPlaying(false);
    const endIdx = isLoopPreviewing ? loopEndIndex : frames.length - 1;
    setCurrentFrameIndex(endIdx);
    playIndexRef.current = endIdx;
    playDirectionRef.current = -1;
    resetCurrentLoop();
  };

  const currentFrame = frames[currentFrameIndex];
  const previewSize = CANVAS_SIZE * previewZoom;

  return (
    <div className="panel p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-pixel-text font-mono">预览</h3>
        <div className="flex items-center gap-1">
          {isLoopPreviewing && (
            <button
              onClick={() => setIsLoopPreviewing(false)}
              className="text-[10px] bg-pixel-primary/20 text-pixel-primary px-1.5 py-0.5 font-mono hover:bg-pixel-primary/30 transition-colors"
              title="停止循环预览"
            >
              {loopStartIndex + 1}-{loopEndIndex + 1}
            </button>
          )}
          {maxLoopCount > 0 && (
            <span className="text-[10px] bg-pixel-accent/20 text-pixel-accent px-1.5 py-0.5 font-mono">
              ×{maxLoopCount}
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 ${showSettings ? 'text-pixel-primary' : 'text-pixel-text-muted'} hover:text-pixel-text transition-colors`}
            title="设置"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="checkerboard border-2 border-pixel-border" style={{ width: previewSize, height: previewSize }}>
          {currentFrame && (
            <img
              src={createFrameThumbnailDataUrl(currentFrame, CANVAS_SIZE * previewZoom)}
              alt="预览"
              className="w-full h-full pixelated object-contain"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 mb-2">
        <button
          onClick={goToFirst}
          className="p-1.5 hover:bg-pixel-surface-light text-pixel-text hover:text-pixel-primary transition-colors"
          title="第一帧"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={togglePlay}
          className={`
            p-2 border-2 transition-all
            ${isPlaying
              ? 'bg-pixel-primary border-pixel-primary text-white'
              : 'bg-pixel-surface-light border-pixel-border text-pixel-text hover:border-pixel-primary'
            }
          `}
          title={isPlaying ? '暂停' : (selectedFrameIndices.length >= 2 || selectedClipInstanceIds.length > 0 ? '循环播放选中' : (resumeFromCurrent ? '从当前帧播放' : '从头播放'))}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={goToLast}
          className="p-1.5 hover:bg-pixel-surface-light text-pixel-text hover:text-pixel-primary transition-colors"
          title="最后一帧"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
        <button
          onClick={() => { setLoop(!loop); if (!loop) resetCurrentLoop(); }}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono border-2 transition-colors ${loop ? 'bg-pixel-primary border-pixel-primary text-white' : 'bg-pixel-surface-light border-pixel-border text-pixel-text-muted hover:text-pixel-text'}`}
          title={loop ? '循环播放 (开启)' : '循环播放 (关闭)'}
        >
          <Repeat size={10} />
          循环
        </button>
        <button
          onClick={() => setIsPingPong(!isPingPong)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono border-2 transition-colors ${isPingPong ? 'bg-pixel-primary border-pixel-primary text-white' : 'bg-pixel-surface-light border-pixel-border text-pixel-text-muted hover:text-pixel-text'}`}
          title="往返播放（走过去再走回来）"
        >
          <ArrowLeftRight size={10} />
          往返
        </button>
        <button
          onClick={() => setResumeFromCurrent(!resumeFromCurrent)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono border-2 transition-colors ${resumeFromCurrent ? 'bg-pixel-accent border-pixel-accent text-pixel-bg' : 'bg-pixel-surface-light border-pixel-border text-pixel-text-muted hover:text-pixel-text'}`}
          title={resumeFromCurrent ? '从当前停住位置续播' : '从开头/选中段开头播放'}
        >
          {resumeFromCurrent ? <Repeat1 size={10} /> : <Repeat size={10} />}
          续播
        </button>
      </div>

      <div className="text-center text-xs text-pixel-text-muted font-mono mb-2">
        {currentFrameIndex + 1} / {frames.length}
        {currentFrame && currentFrame.delay && (
          <span className="ml-2 text-pixel-primary">{currentFrame.delay}ms</span>
        )}
      </div>

      {showSettings && (
        <div className="space-y-3 pt-2 border-t border-pixel-border">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-pixel-text-muted font-mono">缩放</label>
              <span className="text-xs text-pixel-primary font-mono">{previewZoom}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={previewZoom}
              onChange={(e) => setPreviewZoom(parseInt(e.target.value))}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-pixel-text-muted font-mono">速度</label>
              <span className="text-xs text-pixel-primary font-mono">{speed}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-pixel-text-muted font-mono">循环次数</label>
              <span className="text-xs text-pixel-primary font-mono">
                {maxLoopCount === 0 ? '无限' : `${maxLoopCount} 次`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={maxLoopCount}
              onChange={(e) => { setMaxLoopCount(parseInt(e.target.value)); resetCurrentLoop(); }}
            />
            <div className="flex justify-between text-[10px] text-pixel-text-muted font-mono mt-0.5">
              <span>无限</span>
              <span>20 次</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
