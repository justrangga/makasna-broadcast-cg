import React, { useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import {
  Play,
  Square,
  Radio,
  Layers,
  Edit3,
  Check,
  ChevronRight,
  Monitor,
  Wifi,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { LayerTarget } from '@shared/types';
import { OutputSettingsModal } from '../output/OutputSettingsModal';

export const RundownPlaylist: React.FC = () => {
  const { project } = useCGStore();
  const {
    rundown,
    cuedItemId,
    activeLayers,
    cueItem,
    take,
    takeItemDirect,
    clearLayer,
    clearAll,
    updateRundownItem,
    isSecondaryWindowOpen,
    setSecondaryWindowOpen,
    isNDIActive,
    setNDIActive,
  } = usePlayoutStore();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editOverrides, setEditOverrides] = useState<Record<string, string | number>>({});
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);

  const handleStartEdit = (item: (typeof rundown)[0]) => {
    setEditingItemId(item.id);
    setEditOverrides({ ...item.dataOverrides });
  };

  const handleSaveEdit = (itemId: string) => {
    updateRundownItem(itemId, { dataOverrides: editOverrides });
    setEditingItemId(null);
  };

  const handleToggleSecondaryOutput = () => {
    const next = !isSecondaryWindowOpen;
    setSecondaryWindowOpen(next);
    if ((window as any).electronAPI?.openSecondaryOutput) {
      if (next) {
        (window as any).electronAPI.openSecondaryOutput();
      } else {
        (window as any).electronAPI.closeSecondaryOutput();
      }
    } else {
      if (next) {
        window.open('?output=pgm', 'BroadcastOutput', 'width=1920,height=1080');
      }
    }
  };

  const handleCopyBrowserSource = () => {
    navigator.clipboard.writeText('http://localhost:4989/?output=pgm');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTakeAll = () => {
    rundown.forEach((item) => {
      takeItemDirect(item.id);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-studio-950 overflow-hidden text-xs text-slate-300">
      {/* Broadcast Master Transition & Control Deck */}
      <div className="p-4 bg-studio-900 border-b border-studio-800 flex items-center justify-between gap-4">
        {/* Primary TAKE and CLEAR Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => take()}
            className="flex items-center space-x-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded shadow-lg shadow-rose-600/30 active:scale-95 transition tracking-wider"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>▶ TAKE (SPACE)</span>
          </button>

          <button
            onClick={() => handleTakeAll()}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded active:scale-95 transition"
            title="Take All Graphics onto their respective layers"
          >
            <span>⚡ TAKE ALL</span>
          </button>

          <button
            onClick={() => clearAll()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold rounded active:scale-95 transition"
          >
            <Square className="w-4 h-4 fill-current text-rose-500" />
            <span>⏹ CLEAR ALL (ESC)</span>
          </button>
        </div>

        {/* Per-Layer Clear Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 font-mono font-bold mr-1">LAYER CLR:</span>
          {(['L1', 'L2', 'L3', 'L4'] as LayerTarget[]).map((layer) => {
            const isActive = !!activeLayers[layer];
            return (
              <button
                key={layer}
                onClick={() => clearLayer(layer)}
                className={`px-3 py-1.5 rounded font-mono font-bold text-xs transition border ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30'
                    : 'bg-studio-850 text-slate-500 border-studio-750 hover:text-slate-300'
                }`}
              >
                CLR {layer}
              </button>
            );
          })}
        </div>

        {/* Broadcast Output Toggles (NDI & HDMI Window) */}
        <div className="flex items-center space-x-2">
          {/* OBS / vMix Browser Source URL Copy */}
          <button
            onClick={handleCopyBrowserSource}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition ${
              copiedUrl
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-studio-800 text-slate-300 border-studio-700 hover:bg-studio-750'
            }`}
            title="Salin URL Browser Source Alpha untuk vMix / OBS Studio"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{copiedUrl ? 'COPIED :4989' : 'OBS/vMix URL'}</span>
          </button>

          {/* NDI Output Toggle */}
          <button
            onClick={() => setNDIActive(!isNDIActive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition ${
              isNDIActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/20'
                : 'bg-studio-800 text-slate-400 border-studio-700 hover:bg-studio-750'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>NDI: {isNDIActive ? '1080p60 ON AIR' : 'STANDBY'}</span>
          </button>

          {/* Secondary Fullscreen Output Toggle */}
          <button
            onClick={handleToggleSecondaryOutput}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition ${
              isSecondaryWindowOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-studio-800 text-slate-400 border-studio-700 hover:bg-studio-750'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>HDMI / DISPLAY: {isSecondaryWindowOpen ? 'OPEN' : 'CLOSED'}</span>
          </button>

          {/* Dedicated Hardware & DeckLink Routing Button */}
          <button
            onClick={() => setIsOutputModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-studio-750 hover:bg-studio-700 text-slate-200 border border-studio-600 transition"
            title="Buka Pengaturan Hardware: Blackmagic DeckLink SDI Key & Fill, Display Sekunder"
          >
            <Settings className="w-3.5 h-3.5 text-rose-400" />
            <span>Setup Output</span>
          </button>
        </div>
      </div>

      {/* Rundown Table Header */}
      <div className="h-8 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="w-8 text-center">#</span>
          <span className="w-16">LAYER</span>
          <span className="w-64">RUNDOWN TITLE</span>
          <span className="w-48">TEMPLATE</span>
          <span>DATA OVERRIDES / QUICK PARAMETERS</span>
        </div>
        <span>ACTIONS</span>
      </div>

      {/* Rundown Item Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {rundown.map((item, index) => {
          const isCued = cuedItemId === item.id;
          const isOnAir = activeLayers[item.targetLayer]?.rundownItemId === item.id;
          const template = project.templates.find((t) => t.id === item.templateId);
          const isEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => cueItem(item.id)}
              onDoubleClick={() => takeItemDirect(item.id)}
              className={`p-3 rounded-lg border flex flex-col gap-2 transition cursor-pointer ${
                isOnAir
                  ? 'bg-rose-950/20 border-rose-500 shadow-md shadow-rose-950/30 text-white'
                  : isCued
                  ? 'bg-emerald-950/20 border-emerald-500/80 text-white'
                  : 'bg-studio-900 border-studio-800 hover:border-studio-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Status Indicator Badge */}
                  <span className="w-8 text-center font-mono font-bold text-slate-500">
                    {index + 1}
                  </span>

                  {/* Target Layer Tag */}
                  <span className="w-16 px-2 py-0.5 rounded text-center font-mono font-bold text-[11px] bg-studio-800 text-cyan-400 border border-studio-700">
                    {item.targetLayer}
                  </span>

                  {/* Title */}
                  <div className="w-64 font-bold text-sm truncate flex items-center space-x-2">
                    {isOnAir && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                    {isCued && !isOnAir && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        CUED
                      </span>
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>

                  {/* Template Name */}
                  <span className="w-48 text-slate-400 text-xs truncate">
                    {template?.name || item.templateId}
                  </span>

                  {/* Overrides Chips Preview */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    {Object.entries(item.dataOverrides).map(([col, val]) => (
                      <span
                        key={col}
                        className="bg-studio-950 px-2 py-0.5 rounded text-[11px] border border-studio-800 text-slate-300 font-mono"
                      >
                        <span className="text-cyan-400">{col}:</span> {val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Row Quick Action Buttons */}
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => (isEditing ? handleSaveEdit(item.id) : handleStartEdit(item))}
                    className="p-1.5 hover:bg-studio-800 rounded text-slate-400 hover:text-white"
                    title="Quick Edit Data"
                  >
                    {isEditing ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => takeItemDirect(item.id)}
                    className="px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[11px] transition"
                  >
                    TAKE
                  </button>
                </div>
              </div>

              {/* In-Line Quick Edit Drawer */}
              {isEditing && (
                <div
                  className="mt-2 pt-2 border-t border-studio-800/80 grid grid-cols-3 gap-3 bg-studio-950 p-3 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.keys(item.dataOverrides).length === 0 ? (
                    <div className="text-slate-500 text-xs italic col-span-3">
                      Tidak ada overrides teks default. Template menggunakan dataset internal.
                    </div>
                  ) : (
                    Object.entries(editOverrides).map(([col, val]) => (
                      <div key={col}>
                        <label className="text-[10px] text-cyan-400 font-mono font-bold block mb-1">
                          {col}
                        </label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setEditOverrides({ ...editOverrides, [col]: e.target.value })
                          }
                          className="w-full bg-studio-900 border border-studio-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-cyan-400"
                        />
                      </div>
                    ))
                  )}
                  <div className="col-span-3 flex justify-end">
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-4 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hardware & Broadcast Output Settings Modal */}
      <OutputSettingsModal
        isOpen={isOutputModalOpen}
        onClose={() => setIsOutputModalOpen(false)}
      />
    </div>
  );
};
