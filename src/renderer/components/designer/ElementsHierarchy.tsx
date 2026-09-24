import React from 'react';
import { useCGStore } from '@/store/useCGStore';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Square,
  Image as ImageIcon,
  Video,
  ListOrdered,
  Layers,
} from 'lucide-react';
import { CGLayer } from '@shared/types';

export const ElementsHierarchy: React.FC = () => {
  const {
    project,
    activeTemplateId,
    selectedLayerId,
    setActiveTemplateId,
    setSelectedLayerId,
    addLayer,
    deleteLayer,
    reorderLayers,
  } = useCGStore();

  const activeTemplate = project.templates.find((t) => t.id === activeTemplateId);

  const handleAddNewLayer = (type: CGLayer['type']) => {
    if (!activeTemplate) return;
    const newId = `layer_${Date.now()}`;
    const baseLayer: CGLayer = {
      id: newId,
      name: `New ${type.toUpperCase()}`,
      type,
      visible: true,
      locked: false,
      opacity: 1,
      transform: {
        x: 200,
        y: 400,
        width: type === 'text' ? 400 : 300,
        height: type === 'text' ? 50 : 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0,
        anchorY: 0,
      },
      style: {
        fill: type === 'text' ? '#ffffff' : '#1e293b',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: 600,
        borderRadius: 4,
      },
      content: {
        text: type === 'text' ? 'New Dynamic Text' : undefined,
        shapeType: 'rect',
      },
      keyframes: [],
    };

    addLayer(activeTemplate.id, baseLayer);
  };

  return (
    <div className="w-64 bg-studio-900 border-r border-studio-800 flex flex-col text-xs text-slate-300">
      {/* Templates Selector */}
      <div className="p-3 bg-studio-850 border-b border-studio-800">
        <label className="text-[10px] text-slate-500 font-mono block mb-1.5 font-bold">
          PAGE TEMPLATE
        </label>
        <select
          value={activeTemplateId}
          onChange={(e) => setActiveTemplateId(e.target.value)}
          className="w-full bg-studio-950 border border-studio-700 rounded px-2 py-1.5 text-white font-medium text-xs focus:border-cyan-500 outline-none"
        >
          {project.templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} ({tpl.category})
            </option>
          ))}
        </select>
      </div>

      {/* Layer Hierarchy Header */}
      <div className="px-3 py-2 bg-studio-900 border-b border-studio-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>LAYER STACK</span>
        </div>

        {/* Quick Add Menu */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleAddNewLayer('text')}
            className="p-1 hover:bg-studio-750 text-slate-300 rounded hover:text-white"
            title="Add Text Layer"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAddNewLayer('shape')}
            className="p-1 hover:bg-studio-750 text-slate-300 rounded hover:text-white"
            title="Add Shape / Mask Layer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAddNewLayer('image')}
            className="p-1 hover:bg-studio-750 text-slate-300 rounded hover:text-white"
            title="Add Image Layer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTemplate?.layers.map((layer, index) => {
          const isSelected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`p-2 rounded flex items-center justify-between cursor-pointer border transition ${
                isSelected
                  ? 'bg-studio-800 border-cyan-500/50 text-white font-medium shadow-sm'
                  : 'bg-studio-950/60 border-studio-800/80 text-slate-400 hover:bg-studio-850 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                {layer.type === 'text' && <Type className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                {layer.type === 'shape' && <Square className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                {layer.type === 'repeater-row' && (
                  <ListOrdered className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {layer.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {layer.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />}

                <span className="truncate">{layer.name}</span>
              </div>

              {isSelected && (
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayers(activeTemplate.id, index, index - 1);
                    }}
                    className="p-0.5 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={index === activeTemplate.layers.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayers(activeTemplate.id, index, index + 1);
                    }}
                    className="p-0.5 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(activeTemplate.id, layer.id);
                    }}
                    className="p-0.5 hover:text-rose-400 text-slate-500 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
