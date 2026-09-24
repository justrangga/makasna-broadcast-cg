import React, { useRef, useState, useEffect } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { CompositorStage } from '../engine/CompositorStage';
import { Crosshair, Grid, Database, Sparkles, Move } from 'lucide-react';

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
    updateLayer,
  } = useCGStore();

  const viewportRef = useRef<HTMLDivElement>(null);

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);
  const selectedLayer = activeTemplate?.layers.find((l) => l.id === selectedLayerId);

  // Dragging layer state on canvas
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    layerId: string;
    layerName: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // All available headers across datasets
  const availableColumns = Array.from(
    new Set(project.datasets.flatMap((d) => d.headers))
  );

  const handleBindColumn = (col: string) => {
    if (!activeTemplate || !selectedLayerId) return;
    updateLayer(activeTemplate.id, selectedLayerId, {
      dataBinding: {
        column: col,
        fallback: selectedLayer?.content.text || `[${col}]`,
      },
    });
  };

  // Direct Layer Dragging with Mouse on 1080p Canvas
  const handleLayerMouseDown = (layerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeTemplate) return;
    const layer = activeTemplate.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    setSelectedLayerId(layerId);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialLayerX = layer.transform.x;
    const initialLayerY = layer.transform.y;
    const initialKeyframes = [...layer.keyframes];

    setDragState({
      isDragging: true,
      layerId,
      layerName: layer.name,
      startX: initialLayerX,
      startY: initialLayerY,
      currentX: initialLayerX,
      currentY: initialLayerY,
    });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;

      let newX = Math.round(initialLayerX + dx);
      let newY = Math.round(initialLayerY + dy);

      // Shift key constraint: axis-aligned (horizontal only or vertical only)
      if (moveEvent.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          newY = initialLayerY;
        } else {
          newX = initialLayerX;
        }
      }

      // Magnetic snapping to canvas center lines (1920/2 = 960, 1080/2 = 540)
      const centerX = newX + layer.transform.width / 2;
      const centerY = newY + layer.transform.height / 2;
      if (Math.abs(centerX - 960) < 12) {
        newX = Math.round(960 - layer.transform.width / 2);
      }
      if (Math.abs(centerY - 540) < 12) {
        newY = Math.round(540 - layer.transform.height / 2);
      }

      // Shift all keyframes with x/y so the whole motion choreography moves seamlessly
      const deltaXFromInitial = newX - initialLayerX;
      const deltaYFromInitial = newY - initialLayerY;

      const updatedKeyframes = initialKeyframes.map((kf) => ({
        ...kf,
        props: {
          ...kf.props,
          ...(kf.props.x !== undefined
            ? { x: Math.round((kf.props.x || 0) + deltaXFromInitial) }
            : {}),
          ...(kf.props.y !== undefined
            ? { y: Math.round((kf.props.y || 0) + deltaYFromInitial) }
            : {}),
        },
      }));

      updateLayer(activeTemplate.id, layerId, {
        transform: {
          ...layer.transform,
          x: newX,
          y: newY,
        },
        keyframes: updatedKeyframes,
      });

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: newX,
              currentY: newY,
            }
          : null
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setDragState(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Keyboard Arrow Keys Nudge for Selected Layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
        return;
      }

      if (!activeTemplate || !selectedLayerId || !selectedLayer || selectedLayer.locked) {
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let handled = false;
      let newX = selectedLayer.transform.x;
      let newY = selectedLayer.transform.y;

      if (e.key === 'ArrowLeft') {
        newX -= step;
        handled = true;
      } else if (e.key === 'ArrowRight') {
        newX += step;
        handled = true;
      } else if (e.key === 'ArrowUp') {
        newY -= step;
        handled = true;
      } else if (e.key === 'ArrowDown') {
        newY += step;
        handled = true;
      } else if (e.key === 'Escape') {
        setSelectedLayerId(null);
        handled = true;
      }

      if (
        handled &&
        (newX !== selectedLayer.transform.x || newY !== selectedLayer.transform.y)
      ) {
        e.preventDefault();
        const deltaX = newX - selectedLayer.transform.x;
        const deltaY = newY - selectedLayer.transform.y;

        const updatedKeyframes = selectedLayer.keyframes.map((kf) => ({
          ...kf,
          props: {
            ...kf.props,
            ...(kf.props.x !== undefined
              ? { x: Math.round((kf.props.x || 0) + deltaX) }
              : {}),
            ...(kf.props.y !== undefined
              ? { y: Math.round((kf.props.y || 0) + deltaY) }
              : {}),
          },
        }));

        updateLayer(activeTemplate.id, selectedLayerId, {
          transform: { ...selectedLayer.transform, x: newX, y: newY },
          keyframes: updatedKeyframes,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTemplate, selectedLayerId, selectedLayer, updateLayer, setSelectedLayerId]);

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
    <div className="flex-1 flex flex-col bg-studio-950 overflow-hidden relative font-display">
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

      {/* Smart Data Mapping Chips Bar */}
      <div className="h-8 bg-studio-850/80 border-b border-studio-800 px-4 flex items-center space-x-2 text-[11px] overflow-x-auto">
        <span className="text-slate-400 font-mono font-bold flex items-center shrink-0 mr-1">
          <Database className="w-3 h-3 text-cyan-400 mr-1" />
          MAPPING CHIPS:
        </span>
        {availableColumns.map((col) => (
          <button
            key={col}
            onClick={() => handleBindColumn(col)}
            className="px-2.5 py-0.5 rounded-full bg-studio-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition font-mono shrink-0"
            title={
              selectedLayer
                ? `Klik untuk menghubungkan [${col}] ke layer '${selectedLayer.name}'`
                : `Pilih layer terlebih dahulu lalu klik chip [${col}]`
            }
          >
            + [{col}]
          </button>
        ))}
        {selectedLayer?.dataBinding?.column && (
          <span className="text-[10px] text-emerald-400 font-mono ml-auto shrink-0 flex items-center bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Layer '{selectedLayer.name}' terhubung ke: [{selectedLayer.dataBinding.column}]
          </span>
        )}
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

          {/* Broadcast Stage Renderer with Free Layer Dragging */}
          <CompositorStage
            template={activeTemplate}
            currentTime={currentTime}
            datasets={project.datasets}
            width={canvasWidth}
            height={canvasHeight}
            showBoundingBoxes={true}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => setSelectedLayerId(id)}
            onLayerMouseDown={handleLayerMouseDown}
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

        {/* Live Dragging Floating Coordinates HUD */}
        {dragState?.isDragging && (
          <div className="absolute bottom-6 left-6 z-40 bg-studio-950/90 border border-cyan-400/80 rounded-lg px-4 py-2 shadow-2xl flex items-center space-x-3 font-mono text-xs backdrop-blur-md">
            <Move className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-white tracking-wide">
              {dragState.layerName}
            </span>
            <span className="text-cyan-400 font-semibold bg-studio-900 px-2 py-0.5 rounded border border-studio-700">
              X: {dragState.currentX}px
            </span>
            <span className="text-cyan-400 font-semibold bg-studio-900 px-2 py-0.5 rounded border border-studio-700">
              Y: {dragState.currentY}px
            </span>
            <span className="text-slate-400 text-[10px]">
              (ΔX: {dragState.currentX - dragState.startX >= 0 ? '+' : ''}
              {dragState.currentX - dragState.startX}, ΔY:{' '}
              {dragState.currentY - dragState.startY >= 0 ? '+' : ''}
              {dragState.currentY - dragState.startY})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};