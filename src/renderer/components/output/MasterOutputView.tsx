import React, { useEffect, useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import { CompositorStage } from '../engine/CompositorStage';
import { LayerTarget } from '@shared/types';

export const MasterOutputView: React.FC = () => {
  const { project } = useCGStore();
  const { activeLayers } = usePlayoutStore();
  const [, setTicks] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const pattern = params.get('pattern');

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
        backgroundColor:
          pattern === 'green-screen'
            ? '#00ff00'
            : pattern === 'alpha-grid'
            ? '#1e293b'
            : 'transparent',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Optional SMPTE Color Bars Pattern */}
      {pattern === 'smpte-bars' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', opacity: 0.85 }}>
          {['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].map(
            (c, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: c }} />
            )
          )}
        </div>
      )}

      {/* Alpha Grid Pattern */}
      {pattern === 'alpha-grid' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.25,
            backgroundImage:
              'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

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
