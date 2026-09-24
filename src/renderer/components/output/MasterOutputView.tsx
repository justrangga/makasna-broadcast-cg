import React, { useEffect, useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import { CompositorStage } from '../engine/CompositorStage';
import { LayerTarget } from '@shared/types';

export const MasterOutputView: React.FC = () => {
  const { project } = useCGStore();
  const { activeLayers } = usePlayoutStore();
  const [, setTicks] = useState(0);

  // 60fps render tick loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setTicks((t) => t + 1);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'fixed',
        inset: 0,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {(['L1', 'L2', 'L3', 'L4'] as LayerTarget[]).map((layer) => {
        const active = activeLayers[layer];
        if (!active) return null;

        const tpl = project.templates.find((t) => t.id === active.templateId);
        if (!tpl) return null;

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
          currentAnimTime = tpl.markers.hold.start;
        }

        return (
          <div key={layer} style={{ position: 'absolute', inset: 0 }}>
            <CompositorStage
              template={tpl}
              currentTime={currentAnimTime}
              dataOverrides={active.dataOverrides}
              datasets={project.datasets}
              width={1920}
              height={1080}
            />
          </div>
        );
      })}
    </div>
  );
};
