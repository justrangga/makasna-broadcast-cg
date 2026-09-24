import React, { useEffect, useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import { CompositorStage } from '../engine/CompositorStage';
import { Radio, Tv } from 'lucide-react';
import { LayerTarget } from '@shared/types';

export const DualMonitor: React.FC = () => {
  const { project } = useCGStore();
  const { cuedItemId, activeLayers, rundown } = usePlayoutStore();
  const [pvwTime, setPvwTime] = useState<number>(1.5); // hold state preview
  const [renderTicks, setRenderTicks] = useState<number>(0);

  // 60fps playout clock for active on-air graphics
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setRenderTicks((t) => t + 1);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Cued Item lookup
  const cuedItem = rundown.find((i) => i.id === cuedItemId);
  const cuedTemplate = cuedItem
    ? project.templates.find((t) => t.id === cuedItem.templateId)
    : null;

  return (
    <div className="h-72 bg-studio-900 border-b border-studio-800 p-4 flex items-center justify-between gap-6">
      {/* PREVIEW MONITOR (PVW - GREEN) */}
      <div className="flex-1 h-full flex flex-col bg-studio-950 rounded-lg border-2 border-emerald-500/70 shadow-lg overflow-hidden relative">
        {/* Tally Header */}
        <div className="h-7 bg-emerald-950/80 px-3 flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-emerald-500/40">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PVW • PREVIEW</span>
          </div>
          <span className="font-mono text-[11px] font-normal text-emerald-300">
            {cuedItem ? `[${cuedItem.targetLayer}] ${cuedItem.title}` : 'IDLE / NO CUE'}
          </span>
        </div>

        {/* Preview Canvas Stage */}
        <div className="flex-1 flex items-center justify-center p-2 relative bg-black/80 overflow-hidden">
          {cuedTemplate && cuedItem ? (
            <CompositorStage
              template={cuedTemplate}
              currentTime={cuedTemplate.markers.hold.start || 1.0}
              dataOverrides={cuedItem.dataOverrides}
              datasets={project.datasets}
              width={426}
              height={240}
            />
          ) : (
            <div className="text-slate-600 text-xs flex flex-col items-center">
              <Tv className="w-8 h-8 mb-1 opacity-20" />
              <span>Preview Standby</span>
            </div>
          )}
        </div>
      </div>

      {/* PROGRAM MONITOR (PGM - RED - MASTER ON AIR) */}
      <div className="flex-1 h-full flex flex-col bg-studio-950 rounded-lg border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] overflow-hidden relative">
        {/* Tally Header */}
        <div className="h-7 bg-rose-950/90 px-3 flex items-center justify-between text-xs text-rose-300 font-bold border-b border-rose-500/40">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="tracking-wider">PGM • MASTER ON AIR</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] font-mono bg-rose-500/20 px-2 py-0.5 rounded text-rose-300">
            <Radio className="w-3 h-3 text-rose-400" />
            <span>1080p60 ALPHA</span>
          </div>
        </div>

        {/* Master Program Composited Layers (L1 - L4) */}
        <div className="flex-1 flex items-center justify-center p-2 relative bg-black overflow-hidden">
          {/* Transparency grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Render composite across L1, L2, L3, L4 */}
          {(['L1', 'L2', 'L3', 'L4'] as LayerTarget[]).map((layer) => {
            const active = activeLayers[layer];
            if (!active) return null;

            const tpl = project.templates.find((t) => t.id === active.templateId);
            if (!tpl) return null;

            // Calculate current animation time based on playback state
            const elapsed = (Date.now() - active.startedAt) / 1000;
            let currentAnimTime = 0;

            if (active.playbackState === 'intro') {
              currentAnimTime = Math.min(tpl.markers.intro.end, elapsed);
            } else if (active.playbackState === 'outro') {
              const outroProgress = Math.min(
                tpl.markers.outro.end - tpl.markers.outro.start,
                elapsed
              );
              currentAnimTime = tpl.markers.outro.start + outroProgress;
            } else {
              // hold state
              currentAnimTime = tpl.markers.hold.start;
            }

            return (
              <div key={layer} className="absolute inset-0 flex items-center justify-center">
                <CompositorStage
                  template={tpl}
                  currentTime={currentAnimTime}
                  dataOverrides={active.dataOverrides}
                  datasets={project.datasets}
                  width={426}
                  height={240}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
