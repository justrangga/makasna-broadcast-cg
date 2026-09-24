import React, { useRef } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { CompositorStage } from '../engine/CompositorStage';
import { Crosshair, Eye, Grid } from 'lucide-react';

export const CanvasViewport: React.FC = () => {
  const {
    project,
    activeTemplateId,
    selectedLayerId,
    currentTime,
    showGuides,
    showActionSafe,
    zoom,
    setSelectedLayerId,
    setShowGuides,
    setShowActionSafe,
    setZoom,
  } = useCGStore();

  const viewportRef = useRef<HTMLDivElement>(null);

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);

  if (!activeTemplate) {
    return (
      <div className="flex-1 flex items-center justify-center bg-studio-950 text-slate-500">
        No template selected.
      </div>
    );
  }

  // Base canvas scale: 1920x1080 scaled by zoom factor
  const canvasWidth = 1920 * zoom;
  const canvasHeight = 1080 * zoom;

  return (
    <div className="flex-1 flex flex-col bg-studio-950 overflow-hidden relative">
      {/* Top Viewport Toolbar */}
      <div className="h-10 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between text-xs text-slate-400 z-10">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-200">WYSIWYG 1080p Canvas</span>
          <span className="bg-studio-800 px-2 py-0.5 rounded text-cyan-400 font-mono">
            {1920} × {1080} @ 60fps
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {activeTemplate.name} ({activeTemplate.category})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Action / Title Safe Toggle */}
          <button
            onClick={() => setShowActionSafe(!showActionSafe)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              showActionSafe
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'hover:bg-studio-800 text-slate-400'
            }`}
            title="Toggle EBU/SMPTE Title-Safe & Action-Safe Guides"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Safe Zones</span>
          </button>

          {/* Guide Overlay Toggle */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              showGuides
                ? 'bg-studio-700 text-slate-200'
                : 'hover:bg-studio-800 text-slate-400'
            }`}
            title="Toggle Center Crosshairs & Boundary Guides"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Crosshair</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-studio-850 px-2 py-0.5 rounded border border-studio-700 ml-2">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.05))}
              className="px-1 text-slate-400 hover:text-white"
            >
              -
            </button>
            <span className="w-12 text-center font-mono text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.25, zoom + 0.05))}
              className="px-1 text-slate-400 hover:text-white"
            >
              +
            </button>
            <button
              onClick={() => setZoom(0.55)}
              className="text-[10px] text-cyan-400 hover:underline ml-1"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div
        ref={viewportRef}
        onClick={() => setSelectedLayerId(null)}
        className="flex-1 flex items-center justify-center p-8 overflow-auto relative bg-[radial-gradient(#1b202e_1px,transparent_1px)] [background-size:16px_16px]"
      >
        {/* The 16:9 Canvas Box */}
        <div
          style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          className="relative shadow-2xl rounded-sm border border-studio-700 bg-studio-900/60 overflow-hidden"
        >
          {/* Transparency grid background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #1b202e 25%, transparent 25%), linear-gradient(-45deg, #1b202e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1b202e 75%), linear-gradient(-45deg, transparent 75%, #1b202e 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />

          {/* Broadcast Stage Renderer */}
          <CompositorStage
            template={activeTemplate}
            currentTime={currentTime}
            datasets={project.datasets}
            width={canvasWidth}
            height={canvasHeight}
            showBoundingBoxes={true}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => setSelectedLayerId(id)}
          />

          {/* Action-Safe & Title-Safe Overlays (SMPTE standard) */}
          {showActionSafe && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Action Safe (90% - Green line) */}
              <div
                className="absolute border border-emerald-500/40"
                style={{
                  top: '5%',
                  bottom: '5%',
                  left: '5%',
                  right: '5%',
                }}
              >
                <span className="absolute top-1 left-1.5 text-[9px] text-emerald-400/80 font-mono">
                  ACTION SAFE (90%)
                </span>
              </div>

              {/* Title Safe (80% - Yellow/Cyan line) */}
              <div
                className="absolute border border-amber-400/40 border-dashed"
                style={{
                  top: '10%',
                  bottom: '10%',
                  left: '10%',
                  right: '10%',
                }}
              >
                <span className="absolute top-1 left-1.5 text-[9px] text-amber-300/80 font-mono">
                  TITLE SAFE (80%)
                </span>
              </div>
            </div>
          )}

          {/* Center Crosshairs */}
          {showGuides && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/30" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/30" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
