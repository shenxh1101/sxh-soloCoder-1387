import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Settings, ArrowLeftRight, Repeat1, GitCompare, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePixelStore } from '@/store/usePixelStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { createFrameThumbnailDataUrl } from '@/utils/exportUtils';
import type { Frame } from '@/types';

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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [compareFrames, setCompareFrames] = useState<Frame[]>([]);
  const [compareDraftName, setCompareDraftName] = useState('');
  const [reviewFrameIndex, setReviewFrameIndex] = useState(0);

  const drafts = usePixelStore(state => state.drafts);
  const getEffectivePlaySequence = usePixelStore(state => state.getEffectivePlaySequence);
  const setLoopPreviewByClipInstances = usePixelStore(state => state.setLoopPreviewByClipInstances);

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
    if (isReviewMode) {
      setReviewFrameIndex(Math.min(currentIndex, compareFrames.length - 1));
    }

    const playSequence = getEffectivePlaySequence();
    const seqLen = playSequence.length;
    const currentSeqIdx = playSequence.indexOf(currentIndex);
    const effectiveIdx = currentSeqIdx >= 0 ? currentSeqIdx : 0;

    let nextSeqIdx: number;
    let shouldContinue = true;

    if (isPingPong) {
      const direction = playDirectionRef.current;
      nextSeqIdx = effectiveIdx + direction;

      if (nextSeqIdx >= seqLen) {
        if (loop || isLoopPreviewing) {
          nextSeqIdx = seqLen - 2;
          playDirectionRef.current = -1;
          shouldContinue = incrementCurrentLoop();
        } else {
          setIsPlaying(false);
          return;
        }
      } else if (nextSeqIdx < 0) {
        if (loop || isLoopPreviewing) {
          nextSeqIdx = 1;
          playDirectionRef.current = 1;
          shouldContinue = incrementCurrentLoop();
        } else {
          setIsPlaying(false);
          return;
        }
      }
    } else {
      nextSeqIdx = effectiveIdx + 1;
      if (nextSeqIdx >= seqLen) {
        if (loop || isLoopPreviewing) {
          nextSeqIdx = 0;
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

    const nextIndex = playSequence[nextSeqIdx];
    playIndexRef.current = nextIndex;

    const inst = clipInstances.find(i =>
      currentIndex >= i.startIndex && currentIndex < i.startIndex + i.frameCount
    );
    const instSpeed = inst?.speedRatio || 1.0;
    const delay = (frame.delay / instSpeed) / speed;

    timeoutRef.current = window.setTimeout(playNextFrame, delay);
  };

  const togglePlay = () => {
    if (isReviewMode) {
      toggleReviewPlay();
      return;
    }

    if (!isPlaying) {
      playDirectionRef.current = 1;
      resetCurrentLoop();

      if (!resumeFromCurrent) {
        if (isLoopPreviewing) {
          playIndexRef.current = loopStartIndex;
        } else if (selectedClipInstanceIds.length > 0 && clipInstances.length > 0) {
          setLoopPreviewByClipInstances();
          const seq = getEffectivePlaySequence();
          playIndexRef.current = seq[0];
        } else if (selectedFrameIndices.length >= 2) {
          const sorted = [...selectedFrameIndices].sort((a, b) => a - b);
          usePixelStore.getState().setLoopPreview(sorted[0], sorted[sorted.length - 1]);
          playIndexRef.current = sorted[0];
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

  const enterReviewMode = () => {
    if (drafts.length === 0) return;
    const latestDraft = drafts[0];
    try {
      const parsed = JSON.parse(latestDraft.data);
      if (parsed.frames && Array.isArray(parsed.frames)) {
        const cfs: Frame[] = parsed.frames.map((f: { id: string; pixels: number[]; delay: number }) => ({
          id: f.id,
          pixels: new Uint8ClampedArray(f.pixels),
          delay: f.delay || 100
        }));
        setCompareFrames(cfs);
        setCompareDraftName(latestDraft.name);
        setReviewFrameIndex(Math.min(currentFrameIndex, cfs.length - 1));
        setIsReviewMode(true);
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('Failed to load draft for review:', e);
    }
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setCompareFrames([]);
  };

  const reviewPrevFrame = () => {
    const maxLeft = Math.min(frames.length, compareFrames.length) - 1;
    setReviewFrameIndex(Math.max(0, reviewFrameIndex - 1));
    setCurrentFrameIndex(Math.max(0, Math.min(maxLeft, currentFrameIndex - 1)));
  };

  const reviewNextFrame = () => {
    const maxLeft = Math.min(frames.length, compareFrames.length) - 1;
    setReviewFrameIndex(Math.min(maxLeft, reviewFrameIndex + 1));
    setCurrentFrameIndex(Math.min(maxLeft, currentFrameIndex + 1));
  };

  const toggleReviewPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    resetCurrentLoop();
  };

  const currentFrame = frames[currentFrameIndex];
  const previewSize = CANVAS_SIZE * previewZoom;

  return (
    <div className="panel p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-pixel-text font-mono">
        {isReviewMode ? '审片模式' : '预览'}
        </h3>
        <div className="flex items-center gap-1">
          {!isReviewMode && (
            <button
              onClick={enterReviewMode}
              disabled={drafts.length === 0}
              className={"text-[10px] font-mono px-1.5 py-0.5 flex items-center gap-0.5 transition-colors " + (drafts.length === 0
                ? 'opacity-40 cursor-not-allowed text-pixel-text-muted'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30')}
              title={drafts.length === 0 ? '没有可对比的版本' : '进入审片模式，与上一版本并排对比'}
            >
              <GitCompare size={11} />
              审片
            </button>
          )}
          {isReviewMode && (
            <button
              onClick={exitReviewMode}
              className="text-[10px] bg-pixel-danger/20 text-pixel-danger px-1.5 py-0.5 font-mono hover:bg-pixel-danger/30 transition-colors flex items-center gap-0.5"
              title="退出审片模式"
            >
              <X size={11} />
              退出
            </button>
          )}
          {isLoopPreviewing && !isReviewMode && (
            <button
              onClick={() => setIsLoopPreviewing(false)}
              className="text-[10px] bg-pixel-primary/20 text-pixel-primary px-1.5 py-0.5 font-mono hover:bg-pixel-primary/30 transition-colors"
              title="停止循环预览"
            >
              {loopStartIndex + 1}-{loopEndIndex + 1}
            </button>
          )}
          {maxLoopCount > 0 && !isReviewMode && (
            <span className="text-[10px] bg-pixel-accent/20 text-pixel-accent px-1.5 py-0.5 font-mono">
              ×{maxLoopCount}
            </span>
          )}
          {!isReviewMode && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 ${showSettings ? 'text-pixel-primary' : 'text-pixel-text-muted'} hover:text-pixel-text transition-colors`}
              title="设置"
            >
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      {!isReviewMode ? (
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
      ) : (
        <div className="mb-3">
          <div className="flex justify-center gap-2 mb-2">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-pixel-text-muted mb-1">当前版本</span>
              <div className="checkerboard border-2 border-pixel-primary" style={{ width: previewSize * 0.8, height: previewSize * 0.8 }}>
                {currentFrame && (
                  <img
                    src={createFrameThumbnailDataUrl(currentFrame, CANVAS_SIZE * previewZoom * 0.8)}
                    alt="当前版本"
                    className="w-full h-full pixelated object-contain"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold text-pixel-primary font-mono">vs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-cyan-400 mb-1">{compareDraftName || '上一版本'}</span>
              <div className="checkerboard border-2 border-cyan-500" style={{ width: previewSize * 0.8, height: previewSize * 0.8 }}>
                {compareFrames[reviewFrameIndex] && (
                  <img
                    src={createFrameThumbnailDataUrl(compareFrames[reviewFrameIndex], CANVAS_SIZE * previewZoom * 0.8)}
                    alt="对比版本"
                    className="w-full h-full pixelated object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] font-mono text-pixel-text-muted">
            帧 {currentFrameIndex + 1} / {Math.min(frames.length, compareFrames.length)}
            {currentFrame && currentFrameIndex === reviewFrameIndex ? ' · 同步帧对照' : ''}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 mb-2">
        {!isReviewMode ? (
          <>
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
          </>
        ) : (
          <>
            <button
              onClick={reviewPrevFrame}
              className="p-1.5 hover:bg-pixel-surface-light text-pixel-text hover:text-pixel-primary transition-colors"
              title="上一帧（同步）"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={togglePlay}
              className={`
                p-2 border-2 transition-all
                ${isPlaying
                  ? 'bg-cyan-500 border-cyan-500 text-white'
                  : 'bg-pixel-surface-light border-pixel-border text-pixel-text hover:border-cyan-500'
                }
              `}
              title={isPlaying ? '暂停同步播放' : '同步播放对比'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={reviewNextFrame}
              className="p-1.5 hover:bg-pixel-surface-light text-pixel-text hover:text-pixel-primary transition-colors"
              title="下一帧（同步）"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
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
