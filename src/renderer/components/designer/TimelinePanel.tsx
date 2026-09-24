import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { Keyframe } from '@shared/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  Key,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';

export const TimelinePanel: React.FC = () => {
  const {
    project,
    activeTemplateId,
    selectedLayerId,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    setSelectedLayerId,
    updateLayer,
    addKeyframe,
    updateKeyframe,
  } = useCGStore();

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const rulerRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingKf, setDraggingKf] = useState<{ layerId: string; kfId: string } | null>(null);

  const duration = activeTemplate ? activeTemplate.duration : 5.0;
  const markers = activeTemplate?.markers || {
    intro: { start: 0, end: 0.8 },
    hold: { start: 0.8, end: 4.2 },
    outro: { start: 4.2, end: 5.0 },
  };

  // Playback requestAnimationFrame loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        const newTime = currentTime + delta;
        if (newTime >= duration) {
          setCurrentTime(0);
        } else {
          setCurrentTime(newTime);
        }
      }
      lastTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentTime, duration, setCurrentTime]);

  // Smooth Time Calculation from ClientX
  const updateTimeFromClientX = useCallback(
    (clientX: number) => {
      const targetElement = rulerRef.current || tracksContainerRef.current;
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = Math.round(ratio * duration * 100) / 100;
      setCurrentTime(newTime);
    },
    [duration, setCurrentTime]
  );

  // Smooth Scrubbing on Ruler / Timeline Background with Mouse Drag
  const handleStartScrubbing = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaying) setIsPlaying(false);
    setIsScrubbing(true);
    updateTimeFromClientX(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      updateTimeFromClientX(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Mouse Wheel Smooth Scrubbing
  const handleWheelScrub = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const step = e.shiftKey ? 0.2 : 0.05; // 0.05s normal, 0.2s with shift
    const dir = delta > 0 ? 1 : -1;
    const newTime = Math.max(0, Math.min(duration, currentTime + dir * step));
    setCurrentTime(Math.round(newTime * 100) / 100);
  };

  // Keyframe Dragging
  const handleKeyframeMouseDown = (
    e: React.MouseEvent,
    layerId: string,
    kf: Keyframe
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlaying) setIsPlaying(false);
    setSelectedLayerId(layerId);
    setCurrentTime(kf.time);
    setDraggingKf({ layerId, kfId: kf.id });

    const targetElement = rulerRef.current || tracksContainerRef.current;
    if (!targetElement) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = targetElement.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = Math.max(0, Math.min(duration, Math.round(ratio * duration * 20) / 20));

      if (activeTemplate) {
        updateKeyframe(activeTemplate.id, layerId, kf.id, { time: newTime });
        setCurrentTime(newTime);
      }
    };

    const onMouseUp = () => {
      setDraggingKf(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!activeTemplate) return null;

  const handleAddKeyframeAtCurrent = () => {
    if (!selectedLayerId) return;
    const layer = activeTemplate.layers.find((l) => l.id === selectedLayerId);
    if (!layer) return;

    addKeyframe(activeTemplate.id, selectedLayerId, {
      id: `kf_${Date.now()}`,
      time: Math.round(currentTime * 100) / 100,
      props: {
        x: layer.transform.x,
        y: layer.transform.y,
        scaleX: layer.transform.scaleX,
        scaleY: layer.transform.scaleY,
        opacity: layer.opacity,
        rotation: layer.transform.rotation,
      },
      easing: 'easeOutCubic',
    });
  };

  return (
    <div className="h-64 bg-studio-900 border-t border-studio-800 flex flex-col select-none font-display">
      {/* Timeline Controls Header */}
      <div className="h-10 bg-studio-850 border-b border-studio-800 px-4 flex items-center justify-between">
        {/* Playback Transport Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded transition"
            title="Jump to Start (0.0s)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 0.05))}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded transition"
            title="Step -1 Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded transition ${
              isPlaying ? 'bg-amber-500 text-black shadow' : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow'
            }`}
            title={isPlaying ? 'Pause' : 'Play Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => setCurrentTime(Math.min(duration, currentTime + 0.05))}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded transition"
            title="Step +1 Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timecode display */}
          <div className="flex items-center space-x-1.5 bg-studio-950 px-3 py-1 rounded border border-studio-800 font-mono text-xs ml-3 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-bold">{currentTime.toFixed(2)}s</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{duration.toFixed(2)}s</span>
            <span className="text-slate-500 text-[10px] ml-1">
              (F{Math.round(currentTime * 60)})
            </span>
          </div>
        </div>

        {/* State Marker Badges & Quick Jump */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setCurrentTime(markers.intro.start)}
            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-mono text-[11px] transition"
          >
            [INTRO] {markers.intro.start}s - {markers.intro.end}s
          </button>
          <button
            onClick={() => setCurrentTime(markers.hold.start)}
            className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-mono text-[11px] transition"
          >
            [HOLD] {markers.hold.start}s - {markers.hold.end}s
          </button>
          <button
            onClick={() => setCurrentTime(markers.outro.start)}
            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-mono text-[11px] transition"
          >
            [OUTRO] {markers.outro.start}s - {markers.outro.end}s
          </button>

          <button
            onClick={handleAddKeyframeAtCurrent}
            disabled={!selectedLayerId}
            className="flex items-center space-x-1 ml-4 px-2.5 py-1 rounded bg-studio-750 hover:bg-studio-700 text-cyan-300 border border-studio-600 disabled:opacity-40 text-xs shadow-sm"
            title="Add Keyframe for Selected Layer at current playhead"
          >
            <Key className="w-3.5 h-3.5" />
            <span>+ Keyframe</span>
          </button>
        </div>
      </div>

      {/* Main Tracks & Timeline Scrubber Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Names Column */}
        <div className="w-64 bg-studio-850 border-r border-studio-800 flex flex-col overflow-y-auto">
          <div className="h-7 bg-studio-900 border-b border-studio-800 px-3 flex items-center text-[11px] font-semibold text-slate-400">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            <span>TRACK / LAYER NAME</span>
          </div>

          {activeTemplate.layers.map((layer) => {
            const isSelected = selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`h-9 px-3 flex items-center justify-between border-b border-studio-800/60 cursor-pointer text-xs transition ${
                  isSelected
                    ? 'bg-studio-750 text-cyan-300 font-semibold'
                    : 'hover:bg-studio-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      layer.type === 'text'
                        ? 'bg-blue-400'
                        : layer.type === 'shape'
                        ? 'bg-purple-400'
                        : layer.type === 'repeater-row'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="truncate">{layer.name}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(activeTemplate.id, layer.id, { visible: !layer.visible });
                    }}
                    className="hover:text-white"
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(activeTemplate.id, layer.id, { locked: !layer.locked });
                    }}
                    className="hover:text-white"
                  >
                    {layer.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Ruler & Keyframe Tracks */}
        <div
          ref={tracksContainerRef}
          onWheel={handleWheelScrub}
          className="flex-1 flex flex-col overflow-x-auto relative select-none"
        >
          {/* Top Ruler & State Marker Bands (Click & Drag to Scrub) */}
          <div
            ref={rulerRef}
            onMouseDown={handleStartScrubbing}
            className="h-7 bg-studio-900 border-b border-studio-800 relative cursor-ew-resize hover:bg-studio-850/80 transition"
          >
            {/* INTRO Band */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/15 border-r border-emerald-500/40 pointer-events-none"
              style={{
                left: `${(markers.intro.start / duration) * 100}%`,
                width: `${((markers.intro.end - markers.intro.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-emerald-400 font-mono px-1 font-bold">INTRO</span>
            </div>

            {/* HOLD Band */}
            <div
              className="absolute top-0 bottom-0 bg-amber-500/10 border-r border-amber-500/40 pointer-events-none"
              style={{
                left: `${(markers.hold.start / duration) * 100}%`,
                width: `${((markers.hold.end - markers.hold.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-amber-300 font-mono px-1 font-bold">HOLD (ON-AIR)</span>
            </div>

            {/* OUTRO Band */}
            <div
              className="absolute top-0 bottom-0 bg-rose-500/15 pointer-events-none"
              style={{
                left: `${(markers.outro.start / duration) * 100}%`,
                width: `${((markers.outro.end - markers.outro.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-rose-400 font-mono px-1 font-bold">OUTRO</span>
            </div>

            {/* Ruler Ticks */}
            {[0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10].map((t) => {
              if (t > duration) return null;
              const isMajor = t % 1 === 0;
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                  style={{ left: `${(t / duration) * 100}%` }}
                >
                  {isMajor && (
                    <span className="text-[9px] text-slate-400 font-mono pl-1">{t}s</span>
                  )}
                  <div
                    className={`w-px ${isMajor ? 'h-2 bg-slate-600' : 'h-1 bg-slate-800'}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Keyframe Track Rows */}
          <div
            onMouseDown={handleStartScrubbing}
            className="flex-1 flex flex-col relative overflow-y-auto cursor-crosshair"
          >
            {activeTemplate.layers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLayerId(layer.id);
                  }}
                  className={`h-9 border-b border-studio-800/60 relative cursor-pointer ${
                    isSelected ? 'bg-studio-800/40' : 'hover:bg-studio-850/50'
                  }`}
                >
                  {/* Keyframe Diamond Markers (Draggable) */}
                  {layer.keyframes.map((kf) => {
                    const posPercent = (kf.time / duration) * 100;
                    const isDraggingThis =
                      draggingKf?.layerId === layer.id && draggingKf?.kfId === kf.id;

                    return (
                      <div
                        key={kf.id}
                        title={`Keyframe @ ${kf.time}s (${kf.easing}) - Geser untuk memindahkan waktu`}
                        onMouseDown={(e) => handleKeyframeMouseDown(e, layer.id, kf)}
                        style={{ left: `${posPercent}%` }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border shadow-md hover:scale-150 transition-transform cursor-ew-resize z-10 ${
                          isDraggingThis
                            ? 'bg-amber-400 border-white scale-150 ring-2 ring-amber-400/50'
                            : 'bg-cyan-400 border-studio-950'
                        }`}
                      >
                        {isDraggingThis && (
                          <div className="absolute -top-6 -left-3 -rotate-45 bg-studio-950 text-amber-300 font-mono text-[9px] px-1 rounded border border-amber-500 whitespace-nowrap shadow">
                            {kf.time.toFixed(2)}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Playhead Scrubbing Line (Smooth Draggable) */}
            <div
              onMouseDown={handleStartScrubbing}
              className="absolute top-0 bottom-0 z-20 flex flex-col items-center cursor-ew-resize group"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              {/* Top Playhead Needle Diamond */}
              <div
                className={`w-4 h-4 bg-rose-500 rotate-45 -mt-2 shadow-lg transition-transform ${
                  isScrubbing
                    ? 'scale-125 ring-2 ring-rose-400 bg-rose-400'
                    : 'group-hover:scale-110'
                }`}
              />

              {/* Time Label on Scrub */}
              {isScrubbing && (
                <div className="absolute -top-7 bg-rose-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                  {currentTime.toFixed(2)}s
                </div>
              )}

              {/* Vertical Playhead Needle Line with Grab Area */}
              <div
                className={`w-0.5 flex-1 shadow transition-colors ${
                  isScrubbing ? 'bg-rose-400 w-1' : 'bg-rose-500 group-hover:bg-rose-400'
                }`}
              />

              {/* Invisible wider hit-box for easy grabbing */}
              <div className="absolute inset-y-0 -left-2 -right-2 w-4 cursor-ew-resize" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};