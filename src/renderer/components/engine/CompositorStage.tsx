import React, { useMemo } from 'react';
import { CGTemplate, CGLayer, SmartDataSet } from '@shared/types';
import { computeLayerAtTime } from './AnimationEngine';

interface CompositorStageProps {
  template: CGTemplate;
  currentTime: number;
  dataOverrides?: Record<string, string | number>;
  datasets?: SmartDataSet[];
  width?: number; // scale/view size
  height?: number;
  className?: string;
  showBoundingBoxes?: boolean;
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string) => void;
}

export const CompositorStage: React.FC<CompositorStageProps> = ({
  template,
  currentTime,
  dataOverrides = {},
  datasets = [],
  width = 1920,
  height = 1080,
  className = '',
  showBoundingBoxes = false,
  selectedLayerId = null,
  onSelectLayer,
}) => {
  const scale = width / 1920;

  // Find dataset if repeater is enabled
  const repeaterDataset = useMemo(() => {
    if (!template.repeater?.enabled) return null;
    return datasets.find((d) => d.id === template.repeater?.datasetId) || null;
  }, [template.repeater, datasets]);

  const renderLayer = (layer: CGLayer, overrideTime?: number, rowOffset: number = 0, rowData?: Record<string, string | number>) => {
    if (!layer.visible) return null;

    const time = overrideTime ?? currentTime;
    const computed = computeLayerAtTime(layer, time);

    // Apply row offset if repeated
    const currentY = computed.y + rowOffset;

    // Resolve text binding
    let displayText = layer.content.text || '';
    if (layer.dataBinding?.column) {
      const col = layer.dataBinding.column;
      if (rowData && rowData[col] !== undefined) {
        displayText = String(rowData[col]);
      } else if (dataOverrides[col] !== undefined) {
        displayText = String(dataOverrides[col]);
      } else if (layer.dataBinding.fallback) {
        displayText = layer.dataBinding.fallback;
      }
    }

    // Build mask clip-path style if enabled
    let clipPathStyle: React.CSSProperties = {};
    if (computed.mask) {
      // Hardware-accelerated inset or polygon masking
      const m = computed.mask;
      clipPathStyle = {
        clipPath: `inset(${m.y}px ${1920 - (m.x + m.width)}px ${1080 - (m.y + m.height)}px ${m.x}px round ${layer.style.borderRadius || 0}px)`,
      };
    }

    const isSelected = selectedLayerId === layer.id;

    // Drop shadow CSS string
    const shadow = layer.style.dropShadow
      ? `${layer.style.dropShadow.x}px ${layer.style.dropShadow.y}px ${layer.style.dropShadow.blur}px ${layer.style.dropShadow.color}`
      : 'none';

    return (
      <div
        key={`${layer.id}_${rowOffset}`}
        onClick={(e) => {
          if (onSelectLayer) {
            e.stopPropagation();
            onSelectLayer(layer.id);
          }
        }}
        style={{
          position: 'absolute',
          left: `${computed.x}px`,
          top: `${currentY}px`,
          width: `${layer.transform.width}px`,
          height: `${layer.transform.height}px`,
          transformOrigin: `${layer.transform.anchorX * 100}% ${layer.transform.anchorY * 100}%`,
          transform: `scale(${computed.scaleX}, ${computed.scaleY}) rotate(${computed.rotation}deg)`,
          opacity: computed.opacity,
          filter: computed.blur > 0 ? `blur(${computed.blur}px)` : undefined,
          pointerEvents: showBoundingBoxes ? 'auto' : 'none',
          ...clipPathStyle,
        }}
        className={isSelected && showBoundingBoxes ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent cursor-pointer' : ''}
      >
        {/* SHAPE LAYER */}
        {layer.type === 'shape' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: layer.style.fill || 'transparent',
              border: layer.style.stroke ? `${layer.style.strokeWidth || 1}px solid ${layer.style.stroke}` : 'none',
              borderRadius: layer.style.borderRadius ? `${layer.style.borderRadius}px` : '0px',
              boxShadow: shadow !== 'none' ? shadow : undefined,
            }}
          />
        )}

        {/* REPEATER ROW CONTAINER (Plate) */}
        {layer.type === 'repeater-row' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: layer.style.fill || 'transparent',
              border: layer.style.stroke ? `${layer.style.strokeWidth || 1}px solid ${layer.style.stroke}` : 'none',
              borderRadius: layer.style.borderRadius ? `${layer.style.borderRadius}px` : '0px',
              boxShadow: shadow !== 'none' ? shadow : undefined,
            }}
          />
        )}

        {/* TEXT LAYER */}
        {layer.type === 'text' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                layer.style.textAlign === 'center'
                  ? 'center'
                  : layer.style.textAlign === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              color: layer.style.fill || '#ffffff',
              fontFamily: layer.style.fontFamily || 'Inter, sans-serif',
              fontSize: `${layer.style.fontSize || 24}px`,
              fontWeight: layer.style.fontWeight || 600,
              letterSpacing: `${layer.style.letterSpacing || 0}px`,
              textShadow: shadow !== 'none' ? shadow : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayText}
          </div>
        )}

        {/* IMAGE / BADGE LAYER */}
        {layer.type === 'image' && layer.content.src && (
          <img
            src={layer.content.src}
            alt={layer.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: shadow !== 'none' ? `drop-shadow(${shadow})` : undefined,
            }}
          />
        )}

        {/* VIDEO WEBM ALPHA LAYER */}
        {layer.type === 'video' && layer.content.src && (
          <video
            src={layer.content.src}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative select-none overflow-hidden ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* Render standard layers or repeater */}
        {template.repeater?.enabled && repeaterDataset ? (
          <>
            {/* 1. Header/Non-repeater layers */}
            {template.layers
              .filter((l) => l.type !== 'repeater-row')
              .map((layer) => renderLayer(layer))}

            {/* 2. Cloned Repeater Rows with Stagger Delays */}
            {repeaterDataset.rows.slice(0, template.repeater.maxRows).map((row, idx) => {
              const rowOffset = idx * (template.repeater?.rowHeight || 64);
              const staggerTime = Math.max(0, currentTime - idx * (template.repeater?.staggerDelay || 0.08));

              const repeaterTemplateLayer = template.layers.find((l) => l.type === 'repeater-row');

              return (
                <React.Fragment key={`rep_row_${idx}`}>
                  {/* Row background plate */}
                  {repeaterTemplateLayer &&
                    renderLayer(repeaterTemplateLayer, staggerTime, rowOffset, row)}

                  {/* Dynamic Row Data Cells */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '480px',
                      top: `${282 + rowOffset}px`,
                      width: '960px',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      opacity: staggerTime > 0.4 ? 1 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {/* Rank Badge */}
                    <div className="w-16 text-center font-bold text-lg text-cyan-400 font-mono">
                      #{row['Posisi'] || idx + 1}
                    </div>
                    {/* Name */}
                    <div className="flex-1 font-bold text-xl text-white pl-4">
                      {row['Nama'] || 'Participant'}
                    </div>
                    {/* Club */}
                    <div className="w-48 text-slate-400 font-medium text-base">
                      {row['Klub/Tim'] || ''}
                    </div>
                    {/* Time / Score */}
                    <div className="w-32 text-right font-mono font-bold text-lg text-emerald-400 pr-4">
                      {row['Waktu/Poin'] || ''}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </>
        ) : (
          template.layers.map((layer) => renderLayer(layer))
        )}
      </div>
    </div>
  );
};
