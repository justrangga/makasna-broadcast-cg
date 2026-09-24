import React from 'react';
import { useCGStore } from '@/store/useCGStore';
import {
  Sliders,
  Type,
  Maximize2,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PropertiesInspector: React.FC = () => {
  const { project, activeTemplateId, selectedLayerId, updateLayer } = useCGStore();

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);
  const layer = activeTemplate?.layers.find((l) => l.id === selectedLayerId);

  if (!activeTemplate || !layer) {
    return (
      <div className="w-80 bg-studio-900 border-l border-studio-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
        <Layers className="w-8 h-8 mb-2 opacity-30" />
        <span>Pilih elemen pada kanvas atau timeline untuk mengubah properti.</span>
      </div>
    );
  }

  const handleTransformChange = (key: string, val: number) => {
    updateLayer(activeTemplate.id, layer.id, {
      transform: {
        ...layer.transform,
        [key]: val,
      },
    });
  };

  const handleStyleChange = (key: string, val: any) => {
    updateLayer(activeTemplate.id, layer.id, {
      style: {
        ...layer.style,
        [key]: val,
      },
    });
  };

  const handleMaskChange = (key: string, val: any) => {
    updateLayer(activeTemplate.id, layer.id, {
      mask: {
        enabled: layer.mask?.enabled ?? true,
        type: layer.mask?.type ?? 'rect',
        x: layer.mask?.x ?? 0,
        y: layer.mask?.y ?? 0,
        width: layer.mask?.width ?? 100,
        height: layer.mask?.height ?? 100,
        [key]: val,
      },
    });
  };

  return (
    <div className="w-80 bg-studio-900 border-l border-studio-800 flex flex-col overflow-y-auto text-xs text-slate-300">
      {/* Element Header */}
      <div className="p-3 bg-studio-850 border-b border-studio-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white">{layer.name}</span>
          <span className="bg-studio-700 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 uppercase font-mono">
            {layer.type}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* TRANSFORM SECTION */}
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2.5">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>TRANSFORM & GEOMETRY</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-mono">POS X (px)</label>
              <input
                type="number"
                value={layer.transform.x}
                onChange={(e) => handleTransformChange('x', parseFloat(e.target.value) || 0)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">POS Y (px)</label>
              <input
                type="number"
                value={layer.transform.y}
                onChange={(e) => handleTransformChange('y', parseFloat(e.target.value) || 0)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">WIDTH</label>
              <input
                type="number"
                value={layer.transform.width}
                onChange={(e) => handleTransformChange('width', parseFloat(e.target.value) || 0)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">HEIGHT</label>
              <input
                type="number"
                value={layer.transform.height}
                onChange={(e) => handleTransformChange('height', parseFloat(e.target.value) || 0)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">SCALE X</label>
              <input
                type="number"
                step="0.1"
                value={layer.transform.scaleX}
                onChange={(e) => handleTransformChange('scaleX', parseFloat(e.target.value) || 1)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">SCALE Y</label>
              <input
                type="number"
                step="0.1"
                value={layer.transform.scaleY}
                onChange={(e) => handleTransformChange('scaleY', parseFloat(e.target.value) || 1)}
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* TEXT & TYPOGRAPHY SECTION */}
        {layer.type === 'text' && (
          <div>
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>DYNAMIC TYPOGRAPHY</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 font-mono">TEXT CONTENT</label>
                <input
                  type="text"
                  value={layer.content.text || ''}
                  onChange={(e) =>
                    updateLayer(activeTemplate.id, layer.id, {
                      content: { ...layer.content, text: e.target.value },
                    })
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">FONT SIZE (px)</label>
                  <input
                    type="number"
                    value={layer.style.fontSize || 24}
                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 12)}
                    className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">FONT WEIGHT</label>
                  <select
                    value={layer.style.fontWeight || 600}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-autoshrink"
                  checked={layer.style.autoShrink ?? true}
                  onChange={(e) => handleStyleChange('autoShrink', e.target.checked)}
                  className="rounded border-studio-700 bg-studio-950 text-cyan-500"
                />
                <label htmlFor="chk-autoshrink" className="text-xs text-slate-300 cursor-pointer">
                  Auto-Fit / Auto-Shrink Text
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STYLING & COLORS */}
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>APPEARANCE & SHADOW</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-500 font-mono">FILL COLOR</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={layer.style.fill?.startsWith('#') ? layer.style.fill : '#ffffff'}
                  onChange={(e) => handleStyleChange('fill', e.target.value)}
                  className="w-8 h-8 rounded bg-transparent cursor-pointer border border-studio-700"
                />
                <input
                  type="text"
                  value={layer.style.fill || ''}
                  onChange={(e) => handleStyleChange('fill', e.target.value)}
                  className="flex-1 bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-mono">BORDER RADIUS</label>
                <input
                  type="number"
                  value={layer.style.borderRadius || 0}
                  onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
                  className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">OPACITY</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={layer.opacity}
                  onChange={(e) =>
                    updateLayer(activeTemplate.id, layer.id, {
                      opacity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* HARDWARE-ACCELERATED MASKING SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>MASK & CLIP PATH</span>
            </div>
            <input
              type="checkbox"
              checked={layer.mask?.enabled ?? false}
              onChange={(e) => handleMaskChange('enabled', e.target.checked)}
              className="rounded bg-studio-950 text-cyan-500"
            />
          </div>

          {layer.mask?.enabled && (
            <div className="grid grid-cols-2 gap-2 bg-studio-950/60 p-2.5 rounded border border-studio-800">
              <div>
                <label className="text-[10px] text-slate-500 font-mono">MASK X</label>
                <input
                  type="number"
                  value={layer.mask.x}
                  onChange={(e) => handleMaskChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-studio-900 border border-studio-700 rounded px-1.5 py-0.5 text-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">MASK Y</label>
                <input
                  type="number"
                  value={layer.mask.y}
                  onChange={(e) => handleMaskChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-studio-900 border border-studio-700 rounded px-1.5 py-0.5 text-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">MASK WIDTH</label>
                <input
                  type="number"
                  value={layer.mask.width}
                  onChange={(e) => handleMaskChange('width', parseFloat(e.target.value) || 0)}
                  className="w-full bg-studio-900 border border-studio-700 rounded px-1.5 py-0.5 text-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">MASK HEIGHT</label>
                <input
                  type="number"
                  value={layer.mask.height}
                  onChange={(e) => handleMaskChange('height', parseFloat(e.target.value) || 0)}
                  className="w-full bg-studio-900 border border-studio-700 rounded px-1.5 py-0.5 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* DATA BINDING SECTION */}
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>SMART DATA BINDING</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-500 font-mono">COLUMN NAME</label>
              <input
                type="text"
                placeholder="e.g. Nama, Jabatan, Poin"
                value={layer.dataBinding?.column || ''}
                onChange={(e) =>
                  updateLayer(activeTemplate.id, layer.id, {
                    dataBinding: {
                      column: e.target.value,
                      fallback: layer.dataBinding?.fallback || layer.content.text,
                    },
                  })
                }
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">FALLBACK VALUE</label>
              <input
                type="text"
                value={layer.dataBinding?.fallback || ''}
                onChange={(e) =>
                  updateLayer(activeTemplate.id, layer.id, {
                    dataBinding: {
                      column: layer.dataBinding?.column || '',
                      fallback: e.target.value,
                    },
                  })
                }
                className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
