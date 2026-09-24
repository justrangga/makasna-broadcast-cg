import { create } from 'zustand';
import { ActiveOnAirGraphic, LayerTarget, RundownItem } from '@shared/types';
import { defaultProject } from '@shared/defaultProject';

interface PlayoutStoreState {
  cuedItemId: string | null;
  activeLayers: Record<LayerTarget, ActiveOnAirGraphic | null>;
  rundown: RundownItem[];
  isSecondaryWindowOpen: boolean;
  isNDIActive: boolean;
  stats: {
    fps: number;
    frameDrops: number;
    cpuLoad: number;
  };

  // Actions
  setCuedItemId: (id: string | null) => void;
  setRundown: (items: RundownItem[]) => void;
  updateRundownItem: (id: string, updates: Partial<RundownItem>) => void;
  cueItem: (id: string) => void;
  cueNext: () => void;
  cuePrev: () => void;
  take: () => void;
  takeItemDirect: (id: string) => void;
  clearLayer: (layer: LayerTarget) => void;
  clearAll: () => void;
  setSecondaryWindowOpen: (open: boolean) => void;
  setNDIActive: (active: boolean) => void;
  updateStats: (fps: number, cpu: number) => void;
}

export const usePlayoutStore = create<PlayoutStoreState>((set, get) => ({
  cuedItemId: defaultProject.rundown[0]?.id || null,
  activeLayers: {
    L1: null,
    L2: null,
    L3: null,
    L4: null,
  },
  rundown: defaultProject.rundown,
  isSecondaryWindowOpen: false,
  isNDIActive: false,
  stats: {
    fps: 60.0,
    frameDrops: 0,
    cpuLoad: 8,
  },

  setCuedItemId: (id) => set({ cuedItemId: id }),
  setRundown: (items) => set({ rundown: items }),

  updateRundownItem: (id, updates) =>
    set((state) => ({
      rundown: state.rundown.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  cueItem: (id) => {
    set((state) => ({
      cuedItemId: id,
      rundown: state.rundown.map((item) => ({
        ...item,
        status: item.id === id ? 'cued' : item.status === 'on_air' ? 'on_air' : 'idle',
      })),
    }));
  },

  cueNext: () => {
    const { rundown, cuedItemId } = get();
    if (!rundown.length) return;
    const currentIndex = rundown.findIndex((i) => i.id === cuedItemId);
    const nextIndex = (currentIndex + 1) % rundown.length;
    get().cueItem(rundown[nextIndex].id);
  },

  cuePrev: () => {
    const { rundown, cuedItemId } = get();
    if (!rundown.length) return;
    const currentIndex = rundown.findIndex((i) => i.id === cuedItemId);
    const prevIndex = (currentIndex - 1 + rundown.length) % rundown.length;
    get().cueItem(rundown[prevIndex].id);
  },

  take: () => {
    const { cuedItemId, rundown } = get();
    if (!cuedItemId) return;
    const item = rundown.find((i) => i.id === cuedItemId);
    if (!item) return;

    // Put on air
    const activeGraphic: ActiveOnAirGraphic = {
      rundownItemId: item.id,
      templateId: item.templateId,
      targetLayer: item.targetLayer,
      playbackState: 'intro',
      startedAt: Date.now(),
      elapsedTime: 0,
      dataOverrides: { ...item.dataOverrides },
    };

    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [item.targetLayer]: activeGraphic,
      },
      rundown: state.rundown.map((i) =>
        i.id === item.id ? { ...i, status: 'on_air' } : i
      ),
    }));

    // Auto advance cue to next
    get().cueNext();
  },

  takeItemDirect: (id) => {
    const { rundown } = get();
    const item = rundown.find((i) => i.id === id);
    if (!item) return;

    const activeGraphic: ActiveOnAirGraphic = {
      rundownItemId: item.id,
      templateId: item.templateId,
      targetLayer: item.targetLayer,
      playbackState: 'intro',
      startedAt: Date.now(),
      elapsedTime: 0,
      dataOverrides: { ...item.dataOverrides },
    };

    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [item.targetLayer]: activeGraphic,
      },
      rundown: state.rundown.map((i) =>
        i.id === item.id ? { ...i, status: 'on_air' } : i
      ),
    }));
  },

  clearLayer: (layer) => {
    const { activeLayers } = get();
    const current = activeLayers[layer];
    if (!current) return;

    // Mark outro transition
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: {
          ...current,
          playbackState: 'outro',
        },
      },
      rundown: state.rundown.map((i) =>
        i.id === current.rundownItemId ? { ...i, status: 'idle' } : i
      ),
    }));

    // After outro (e.g. 800ms), unmount
    setTimeout(() => {
      set((state) => {
        if (state.activeLayers[layer]?.rundownItemId === current.rundownItemId) {
          return {
            activeLayers: {
              ...state.activeLayers,
              [layer]: null,
            },
          };
        }
        return state;
      });
    }, 850);
  },

  clearAll: () => {
    const layers: LayerTarget[] = ['L1', 'L2', 'L3', 'L4'];
    layers.forEach((l) => get().clearLayer(l));
  },

  setSecondaryWindowOpen: (open) => set({ isSecondaryWindowOpen: open }),
  setNDIActive: (active) => set({ isNDIActive: active }),
  updateStats: (fps, cpu) =>
    set((state) => ({
      stats: {
        ...state.stats,
        fps,
        cpuLoad: cpu,
      },
    })),
}));
