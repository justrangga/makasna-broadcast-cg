import React, { useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import {
  Palette,
  PlaySquare,
  Database,
  Save,
  FolderOpen,
  Wifi,
  Cpu,
  Monitor,
  Radio,
} from 'lucide-react';
import { SmartDataModal } from './datahub/SmartDataModal';

export const Header: React.FC = () => {
  const { mode, setMode, project, setProject } = useCGStore();
  const { isNDIActive, stats } = usePlayoutStore();
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const handleExportProject = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}.mcg`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.canvas && parsed.templates) {
          setProject(parsed);
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="h-12 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between select-none z-30">
        {/* Left Brand & Workspace Mode Switcher */}
        <div className="flex items-center space-x-6">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-rose-500 flex items-center justify-center font-bold text-xs text-white shadow">
              M
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white">
              MAKASNA <span className="text-cyan-400 font-normal">BROADCAST CG</span>
            </span>
          </div>

          {/* DUAL WORKSPACE TOGGLE */}
          <div className="flex items-center bg-studio-950 p-1 rounded-lg border border-studio-800">
            <button
              onClick={() => setMode('designer')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                mode === 'designer'
                  ? 'bg-studio-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>🎨 Designer Studio</span>
            </button>

            <button
              onClick={() => setMode('playout')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                mode === 'playout'
                  ? 'bg-studio-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>⚡ Playout Console</span>
            </button>
          </div>
        </div>

        {/* Center Tools: Smart Data Hub & Project File */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-studio-850 hover:bg-studio-800 text-slate-200 border border-studio-750 text-xs font-semibold transition"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart Data Hub</span>
          </button>

          <label className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-studio-850 hover:bg-studio-800 text-slate-300 border border-studio-750 text-xs cursor-pointer">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open (.mcg)</span>
            <input type="file" accept=".mcg,.json" onChange={handleImportProject} className="hidden" />
          </label>

          <button
            onClick={handleExportProject}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-studio-850 hover:bg-studio-800 text-slate-300 border border-studio-750 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save (.mcg)</span>
          </button>
        </div>

        {/* Right Broadcast Engine Telemetry */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          {/* NDI Status */}
          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] ${
              isNDIActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'text-slate-500'
            }`}
          >
            <Wifi className="w-3 h-3" />
            <span>NDI: {isNDIActive ? '1080p60 ON AIR' : 'OFF'}</span>
          </div>

          {/* Engine FPS & Latency */}
          <div className="flex items-center space-x-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{stats.fps.toFixed(1)} FPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">GPU V-Sync</span>
          </div>
        </div>
      </header>

      {/* Smart Data Hub Modal */}
      <SmartDataModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />
    </>
  );
};
