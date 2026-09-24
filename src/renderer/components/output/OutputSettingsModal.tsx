import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Cpu,
  Wifi,
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sliders,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';
import {
  DeckLinkConfig,
  DeckLinkDevice,
  DeckLinkKeyerMode,
  DeckLinkVideoStandard,
  DisplayOutputConfig,
} from '@shared/types';
import { usePlayoutStore } from '@/store/usePlayoutStore';

interface OutputSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DisplayInfo {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  label: string;
  isPrimary: boolean;
}

export const OutputSettingsModal: React.FC<OutputSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isSecondaryWindowOpen, setSecondaryWindowOpen, isNDIActive, setNDIActive } =
    usePlayoutStore();

  const [activeTab, setActiveTab] = useState<'display' | 'decklink' | 'ndi'>('decklink');

  // Display Output States
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplayId, setSelectedDisplayId] = useState<number>(0);
  const [testPattern, setTestPattern] = useState<DisplayOutputConfig['testPattern']>('none');

  // DeckLink Output States
  const [decklinkDevices, setDecklinkDevices] = useState<DeckLinkDevice[]>([
    {
      index: 0,
      name: 'Blackmagic DeckLink Duo 2 (Channel 1 - SDI Fill & Key)',
      modelName: 'DeckLink Duo 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 1,
      name: 'Blackmagic DeckLink Duo 2 (Channel 2 - SDI)',
      modelName: 'DeckLink Duo 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 2,
      name: 'Blackmagic DeckLink Quad 2 (SDI 1-8)',
      modelName: 'DeckLink Quad 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 3,
      name: 'Blackmagic DeckLink Mini Monitor HD (SDI/HDMI)',
      modelName: 'DeckLink Mini Monitor HD',
      hasKeyer: false,
      supports4K: false,
      status: 'idle',
    },
  ]);

  const [decklinkConfig, setDecklinkConfig] = useState<DeckLinkConfig>({
    enabled: false,
    deviceIndex: 0,
    deviceName: 'Blackmagic DeckLink Duo 2 (Channel 1 - SDI Fill & Key)',
    videoStandard: '1080p60',
    keyerMode: 'external',
    pixelFormat: '8BitYUV',
    bufferFrames: 3,
    syncGenlock: true,
    keyLevel: 255,
  });

  const [decklinkStreaming, setDecklinkStreaming] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Load connected displays & DeckLink devices
  useEffect(() => {
    if (!isOpen) return;

    if ((window as any).electronAPI?.getDisplays) {
      (window as any).electronAPI.getDisplays().then((res: DisplayInfo[]) => {
        setDisplays(res);
        // Default to secondary display if available
        const secondary = res.find((d) => !d.isPrimary);
        if (secondary) {
          setSelectedDisplayId(secondary.id);
        } else if (res.length > 0) {
          setSelectedDisplayId(res[0].id);
        }
      });
    } else {
      // Mock displays if running in standard web browser
      setDisplays([
        {
          id: 1,
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          label: 'Display 1 (Laptop Screen - 1920x1080)',
          isPrimary: true,
        },
        {
          id: 2,
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
          label: 'Display 2 (HDMI / External Monitor - 1920x1080)',
          isPrimary: false,
        },
      ]);
      setSelectedDisplayId(2);
    }

    if ((window as any).electronAPI?.getDeckLinkDevices) {
      (window as any).electronAPI.getDeckLinkDevices().then((devs: DeckLinkDevice[]) => {
        if (devs && devs.length > 0) {
          setDecklinkDevices(devs);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Display Output
  const handleToggleDisplay = async () => {
    const nextState = !isSecondaryWindowOpen;
    setSecondaryWindowOpen(nextState);

    if ((window as any).electronAPI?.openSecondaryOutput) {
      if (nextState) {
        await (window as any).electronAPI.openSecondaryOutput(selectedDisplayId, testPattern);
      } else {
        await (window as any).electronAPI.closeSecondaryOutput();
      }
    } else {
      if (nextState) {
        window.open(
          `?output=pgm&pattern=${testPattern}`,
          'BroadcastOutput',
          'width=1920,height=1080'
        );
      }
    }
  };

  // Toggle DeckLink Output
  const handleToggleDeckLink = async () => {
    const next = !decklinkStreaming;
    setDecklinkStreaming(next);
    setDecklinkConfig((prev) => ({ ...prev, enabled: next }));

    if ((window as any).electronAPI) {
      if (next) {
        await (window as any).electronAPI.startDeckLinkOutput(decklinkConfig);
      } else {
        await (window as any).electronAPI.stopDeckLinkOutput();
      }
    }
  };

  const handleCopyBrowserSource = () => {
    navigator.clipboard.writeText('http://localhost:4989/?output=pgm');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none font-display">
      <div className="w-full max-w-4xl bg-studio-900 border border-studio-750 rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="h-14 bg-studio-850 border-b border-studio-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="./assets/makasna-logo.svg"
              alt="Makasna"
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]"
            />
            <div>
              <h2 className="font-bold text-white text-sm tracking-wide">
                MAKASNA BROADCAST OUTPUT & HARDWARE ROUTING
              </h2>
              <p className="text-[11px] text-slate-400">
                Konfigurasi output video fisik (Blackmagic DeckLink SDI Key & Fill, Layar Sekunder HDMI, NDI)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-studio-750 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output Tabs Navigation */}
        <div className="px-6 bg-studio-850/60 border-b border-studio-800 flex items-center space-x-2 pt-2">
          <button
            onClick={() => setActiveTab('decklink')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs border-b-2 transition ${
              activeTab === 'decklink'
                ? 'bg-studio-900 text-rose-400 border-rose-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Blackmagic DeckLink (SDI Key & Fill)</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs border-b-2 transition ${
              activeTab === 'display'
                ? 'bg-studio-900 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Monitor Sekunder (HDMI / DP)</span>
          </button>

          <button
            onClick={() => setActiveTab('ndi')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs border-b-2 transition ${
              activeTab === 'ndi'
                ? 'bg-studio-900 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>NDI & Browser Source (vMix / OBS)</span>
          </button>
        </div>

        {/* TAB 1: BLACKMAGIC DECKLINK */}
        {activeTab === 'decklink' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
            {/* Status Banner */}
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                decklinkStreaming
                  ? 'bg-rose-950/30 border-rose-500/80 text-white'
                  : 'bg-studio-950 border-studio-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    decklinkStreaming ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-sm">
                    {decklinkStreaming
                      ? 'DECKLINK SDI PLAYOUT: ON AIR'
                      : 'DECKLINK SDI PLAYOUT: STANDBY'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {decklinkConfig.deviceName} • {decklinkConfig.videoStandard} • Mode:{' '}
                    {decklinkConfig.keyerMode.toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleDeckLink}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-xs shadow transition active:scale-95 ${
                  decklinkStreaming
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/50'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                }`}
              >
                {decklinkStreaming ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>STOP SDI PLAYOUT</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>START SDI PLAYOUT</span>
                  </>
                )}
              </button>
            </div>

            {/* Hardware Selection Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Device Selector */}
              <div>
                <label className="text-[10px] text-slate-400 font-mono font-bold block mb-1.5">
                  PERANGKAT BLACKMAGIC DECKLINK
                </label>
                <select
                  value={decklinkConfig.deviceIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    const dev = decklinkDevices.find((d) => d.index === idx);
                    setDecklinkConfig({
                      ...decklinkConfig,
                      deviceIndex: idx,
                      deviceName: dev?.name || `DeckLink ${idx}`,
                    });
                  }}
                  className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3 py-2 text-white font-medium outline-none focus:border-rose-500"
                >
                  {decklinkDevices.map((dev) => (
                    <option key={dev.index} value={dev.index}>
                      {dev.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Mendukung DeckLink Duo 2, Quad 2, Mini Monitor, 8K Pro, UltraStudio
                </span>
              </div>

              {/* Video Standard */}
              <div>
                <label className="text-[10px] text-slate-400 font-mono font-bold block mb-1.5">
                  STANDAR RESOLUSI & FRAMERATE
                </label>
                <select
                  value={decklinkConfig.videoStandard}
                  onChange={(e) =>
                    setDecklinkConfig({
                      ...decklinkConfig,
                      videoStandard: e.target.value as DeckLinkVideoStandard,
                    })
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3 py-2 text-white font-medium outline-none focus:border-rose-500 font-mono"
                >
                  <option value="1080p60">1080p 60.00 fps (SMPTE HD Progressive)</option>
                  <option value="1080p59.94">1080p 59.94 fps (NTSC Broadcast Standard)</option>
                  <option value="1080p50">1080p 50.00 fps (PAL Broadcast Standard)</option>
                  <option value="1080i59.94">1080i 59.94 fps (Interlaced NTSC)</option>
                  <option value="1080i50">1080i 50.00 fps (Interlaced PAL)</option>
                  <option value="720p60">720p 60.00 fps (Sports Fast HD)</option>
                  <option value="2160p60">2160p 60.00 fps (4K UHD Broadcast)</option>
                </select>
              </div>
            </div>

            {/* Keying & Alpha Channel Routing */}
            <div className="bg-studio-950 p-4 rounded-lg border border-studio-800 space-y-3">
              <label className="text-[11px] text-white font-bold block flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>SDI KEY & FILL ROUTING (STANDAR PENYIARAN TV)</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {/* External Key & Fill Card */}
                <div
                  onClick={() =>
                    setDecklinkConfig({ ...decklinkConfig, keyerMode: 'external' })
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    decklinkConfig.keyerMode === 'external'
                      ? 'bg-rose-950/20 border-rose-500 text-white'
                      : 'bg-studio-900 border-studio-800 hover:border-studio-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-rose-400 mb-1">
                    🌟 External Key & Fill
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Output 2 kabel SDI independen (SDI 1 = Warna/Fill, SDI 2 = Alpha Mask/Key).
                    Ideal untuk switcher ATEM Constellation, Ross Carbonite, dan Grass Valley.
                  </p>
                </div>

                {/* Internal Keyer Card */}
                <div
                  onClick={() =>
                    setDecklinkConfig({ ...decklinkConfig, keyerMode: 'internal' })
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    decklinkConfig.keyerMode === 'internal'
                      ? 'bg-rose-950/20 border-rose-500 text-white'
                      : 'bg-studio-900 border-studio-800 hover:border-studio-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-400 mb-1">
                    🔁 Internal Keyer (Loop)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Menumpuk grafis langsung di atas sinyal SDI kamera live yang masuk ke port SDI
                    Input tanpa butuh downstream keyer eksternal.
                  </p>
                </div>

                {/* Single Output Card */}
                <div
                  onClick={() => setDecklinkConfig({ ...decklinkConfig, keyerMode: 'single' })}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    decklinkConfig.keyerMode === 'single'
                      ? 'bg-rose-950/20 border-rose-500 text-white'
                      : 'bg-studio-900 border-studio-800 hover:border-studio-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-cyan-400 mb-1">
                    🎯 Single Clean Output
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Satu kabel SDI atau HDMI tunggal dengan grafis siap tayang (untuk monitor
                    studio atau perekam master recorder).
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Hardware Timing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-mono font-bold block mb-1">
                  PIXEL FORMAT
                </label>
                <select
                  value={decklinkConfig.pixelFormat}
                  onChange={(e) =>
                    setDecklinkConfig({
                      ...decklinkConfig,
                      pixelFormat: e.target.value as any,
                    })
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                >
                  <option value="8BitYUV">8-bit YUV 4:2:2 (UYVY)</option>
                  <option value="8BitBGRA">8-bit BGRA (Full Alpha 4:4:4:4)</option>
                  <option value="10BitRGB">10-bit YUV / RGB (v210)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono font-bold block mb-1">
                  FRAME BUFFER DEPTH
                </label>
                <select
                  value={decklinkConfig.bufferFrames}
                  onChange={(e) =>
                    setDecklinkConfig({
                      ...decklinkConfig,
                      bufferFrames: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                >
                  <option value="2">2 Frames (Ultra Low Latency: ~33ms)</option>
                  <option value="3">3 Frames (Rekomendasi Broadcast Stabil)</option>
                  <option value="4">4 Frames (Anti Drop Jitter Safe)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end pb-1.5">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={decklinkConfig.syncGenlock}
                    onChange={(e) =>
                      setDecklinkConfig({ ...decklinkConfig, syncGenlock: e.target.checked })
                    }
                    className="rounded bg-studio-950 border-studio-700 text-rose-500"
                  />
                  <span className="text-xs font-semibold">Kunci Sinyal Ref In / Genlock</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONITOR SEKUNDER (HDMI / DISPLAYPORT) */}
        {activeTab === 'display' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                isSecondaryWindowOpen
                  ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                  : 'bg-studio-950 border-studio-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isSecondaryWindowOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-sm">
                    {isSecondaryWindowOpen
                      ? 'OUTPUT DISPLAY SEKUNDER: TERBUKA'
                      : 'OUTPUT DISPLAY SEKUNDER: TERTUTUP'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Target: Monitor ID #{selectedDisplayId} • Borderless Fullscreen Transparent Alpha
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleDisplay}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-xs shadow transition active:scale-95 ${
                  isSecondaryWindowOpen
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isSecondaryWindowOpen ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>TUTUP OUTPUT DISPLAY</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>BUKA OUTPUT FULLSCREEN</span>
                  </>
                )}
              </button>
            </div>

            {/* Detected Displays List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-slate-400 font-mono font-bold">
                  DAFTAR LAYAR / MONITOR TERHUBUNG ({displays.length})
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {displays.map((disp) => {
                  const isSelected = selectedDisplayId === disp.id;
                  return (
                    <div
                      key={disp.id}
                      onClick={() => setSelectedDisplayId(disp.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500 text-white shadow'
                          : 'bg-studio-950 border-studio-800 hover:border-studio-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Monitor
                          className={`w-6 h-6 ${
                            isSelected ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-200">{disp.label}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {disp.bounds.width} × {disp.bounds.height} px
                            {disp.isPrimary ? ' • [Layar Utama]' : ' • [Layar Eksternal HDMI/DP]'}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Pattern & Behavior */}
            <div className="grid grid-cols-2 gap-4 bg-studio-950 p-4 rounded-lg border border-studio-800">
              <div>
                <label className="text-[10px] text-slate-400 font-mono font-bold block mb-1.5">
                  TEST PATTERN GENERATOR (KALIBRASI)
                </label>
                <select
                  value={testPattern}
                  onChange={(e) => setTestPattern(e.target.value as any)}
                  className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="none">Tanpa Test Pattern (Transparan Alpha PGM Murni)</option>
                  <option value="smpte-bars">SMPTE Color Bars (Kalibrasi Warna Broadcast)</option>
                  <option value="alpha-grid">Alpha Transparency Checkerboard</option>
                  <option value="green-screen">Solid Pure Green Screen (#00FF00)</option>
                </select>
              </div>

              <div className="space-y-2 flex flex-col justify-center">
                <div className="text-slate-300 font-semibold text-xs">
                  Karakteristik Output Sekunder:
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>✓ Otomatis Fullscreen Borderless (menutupi seluruh monitor).</div>
                  <div>✓ Sinyal Alpha Channel murni (tembus pandang ke layer video switcher).</div>
                  <div>✓ Klik mouse diteruskan ke belakang (Click Pass-through).</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NDI & BROWSER SOURCE */}
        {activeTab === 'ndi' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
            {/* NDI Toggle Banner */}
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                isNDIActive
                  ? 'bg-cyan-950/30 border-cyan-500/80 text-white'
                  : 'bg-studio-950 border-studio-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isNDIActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <div>
                  <div className="font-bold text-sm">
                    {isNDIActive ? 'NDI BROADCAST: AKTIF ON AIR' : 'NDI BROADCAST: STANDBY'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Stream Name: MAKASNA-CG-PGM • 1080p 60fps Alpha Channel via LAN
                  </div>
                </div>
              </div>

              <button
                onClick={() => setNDIActive(!isNDIActive)}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-xs shadow transition active:scale-95 ${
                  isNDIActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/50'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                }`}
              >
                {isNDIActive ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>NONAKTIFKAN NDI</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>AKTIFKAN NDI</span>
                  </>
                )}
              </button>
            </div>

            {/* OBS & vMix Browser Source Integration Card */}
            <div className="bg-studio-950 p-5 rounded-lg border border-studio-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-sm flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>INTEGRASI LANGSUNG vMIX & OBS STUDIO (BROWSER SOURCE)</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                  PORT 4989
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Di vMix atau OBS Studio, Anda cukup menambahkan input sumber **Browser Source**
                dengan resolusi 1920x1080. Seluruh animasi grafis akan muncul otomatis di atas video
                live dengan transparansi murni 60fps tanpa beban kartu capture.
              </p>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:4989/?output=pgm"
                  className="flex-1 bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-cyan-300 font-mono text-xs outline-none select-all"
                />
                <button
                  onClick={handleCopyBrowserSource}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-studio-750 hover:bg-studio-700 text-white font-bold rounded-lg transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'TERSALIN!' : 'SALIN URL'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-14 bg-studio-850 border-t border-studio-800 px-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>
              Status DeckLink:{' '}
              <strong className={decklinkStreaming ? 'text-rose-400' : 'text-slate-500'}>
                {decklinkStreaming ? 'LOCKED SDI OUT' : 'STANDBY'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Display:{' '}
              <strong className={isSecondaryWindowOpen ? 'text-emerald-400' : 'text-slate-500'}>
                {isSecondaryWindowOpen ? 'FULLSCREEN ACTIVE' : 'OFF'}
              </strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
          >
            Tutup Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
