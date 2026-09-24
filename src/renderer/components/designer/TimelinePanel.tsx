import React, { useRef, useEffect } from 'react';
import { useCGStore } from '@/store/useCGStore';
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
  } = useCGStore();

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

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

  if (!activeTemplate) return null;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(ratio * duration);
  };

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
    <div className="h-64 bg-studio-900 border-t border-studio-800 flex flex-col select-none">
      {/* Timeline Controls Header */}
      <div className="h-10 bg-studio-850 border-b border-studio-800 px-4 flex items-center justify-between">
        {/* Playback Transport Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded"
            title="Jump to Start (0.0s)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 0.1))}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded"
            title="Step -1 Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded transition ${
              isPlaying ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black hover:bg-cyan-400'
            }`}
            title={isPlaying ? 'Pause' : 'Play Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => setCurrentTime(Math.min(duration, currentTime + 0.1))}
            className="p-1.5 hover:bg-studio-700 text-slate-300 rounded"
            title="Step +1 Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timecode display */}
          <div className="flex items-center space-x-1.5 bg-studio-950 px-3 py-1 rounded border border-studio-800 font-mono text-xs ml-3">
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
            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-mono text-[11px]"
          >
            [INTRO] {markers.intro.start}s - {markers.intro.end}s
          </button>
          <button
            onClick={() => setCurrentTime(markers.hold.start)}
            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-mono text-[11px]"
          >
            [HOLD] {markers.hold.start}s - {markers.hold.end}s
          </button>
          <button
            onClick={() => setCurrentTime(markers.outro.start)}
            className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-mono text-[11px]"
          >
            [OUTRO] {markers.outro.start}s - {markers.outro.end}s
          </button>

          <button
            onClick={handleAddKeyframeAtCurrent}
            disabled={!selectedLayerId}
            className="flex items-center space-x-1 ml-4 px-2.5 py-1 rounded bg-studio-750 hover:bg-studio-700 text-cyan-300 border border-studio-600 disabled:opacity-40 text-xs"
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
            <Layers className="w-3.5 h-3.5 mr-1.5" />
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
                    ? 'bg-studio-700 text-cyan-300 font-medium'
                    : 'hover:bg-studio-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full ${
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

                <div className="flex items-center space-x-1.5 text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(activeTemplate.id, layer.id, { visible: !layer.visible });
                    }}
                    className="hover:text-white"
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5" />
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
        <div className="flex-1 flex flex-col overflow-x-auto relative">
          {/* Top Ruler & State Marker Bands */}
          <div
            onClick={handleRulerClick}
            className="h-7 bg-studio-900 border-b border-studio-800 relative cursor-pointer"
          >
            {/* INTRO Band */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/15 border-r border-emerald-500/40"
              style={{
                left: `${(markers.intro.start / duration) * 100}%`,
                width: `${((markers.intro.end - markers.intro.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-emerald-400 font-mono px-1 font-bold">INTRO</span>
            </div>

            {/* HOLD Band */}
            <div
              className="absolute top-0 bottom-0 bg-amber-500/10 border-r border-amber-500/40"
              style={{
                left: `${(markers.hold.start / duration) * 100}%`,
                width: `${((markers.hold.end - markers.hold.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-amber-300 font-mono px-1 font-bold">HOLD (ON-AIR)</span>
            </div>

            {/* OUTRO Band */}
            <div
              className="absolute top-0 bottom-0 bg-rose-500/15"
              style={{
                left: `${(markers.outro.start / duration) * 100}%`,
                width: `${((markers.outro.end - markers.outro.start) / duration) * 100}%`,
              }}
            >
              <span className="text-[9px] text-rose-400 font-mono px-1 font-bold">OUTRO</span>
            </div>

            {/* Ruler Ticks */}
            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((t) => {
              if (t > duration) return null;
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                  style={{ left: `${(t / duration) * 100}%` }}
                >
                  <span className="text-[9px] text-slate-500 font-mono pl-1">{t}s</span>
                  <div className="w-px h-1.5 bg-slate-700" />
                </div>
              );
            })}
          </div>

          {/* Keyframe Track Rows */}
          <div className="flex-1 flex flex-col relative overflow-y-auto">
            {activeTemplate.layers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`h-9 border-b border-studio-800/60 relative cursor-pointer ${
                    isSelected ? 'bg-studio-800/40' : 'hover:bg-studio-850/50'
                  }`}
                >
                  {/* Keyframe Diamond Markers */}
                  {layer.keyframes.map((kf) => {
                    const posPercent = (kf.time / duration) * 100;
                    return (
                      <div
                        key={kf.id}
                        title={`Keyframe @ ${kf.time}s (${kf.easing})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTime(kf.time);
                          setSelectedLayerId(layer.id);
                        }}
                        style={{ left: `${posPercent}%` }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-400 rotate-45 border border-studio-950 shadow-md hover:scale-125 transition-transform cursor-ew-resize z-10"
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Playhead Scrubbing Line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="w-3.5 h-3.5 bg-rose-500 rotate-45 -mt-1.5 shadow" />
              <div className="w-0.5 flex-1 bg-rose-500 shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
